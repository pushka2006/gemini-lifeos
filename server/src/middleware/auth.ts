import { Request, Response, NextFunction } from 'express';
import admin from 'firebase-admin';

// Extend Express Request to include authenticated user
export interface AuthenticatedRequest extends Request {
  user?: {
    uid: string;
    email?: string;
    name?: string;
    isDevMock?: boolean;
  };
}

let firebaseAdminInitialized = false;

export function initializeFirebaseAdmin() {
  if (firebaseAdminInitialized || admin.apps.length > 0) {
    firebaseAdminInitialized = true;
    return;
  }

  try {
    const projectId = process.env.FIREBASE_PROJECT_ID;
    const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (projectId && clientEmail && privateKey) {
      admin.initializeApp({
        credential: admin.credential.cert({
          projectId,
          clientEmail,
          privateKey,
        }),
      });
      firebaseAdminInitialized = true;
      console.log('✅ Firebase Admin SDK initialized successfully.');
    } else if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      admin.initializeApp({
        credential: admin.credential.applicationDefault(),
      });
      firebaseAdminInitialized = true;
      console.log('✅ Firebase Admin initialized via GOOGLE_APPLICATION_CREDENTIALS.');
    } else {
      console.warn('⚠️ Firebase Admin credentials not provided in environment. Running in Dev/Sandbox Auth mode.');
    }
  } catch (error) {
    console.error('Failed to initialize Firebase Admin SDK:', error);
  }
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or malformed Authorization header. Bearer token required.',
    });
    return;
  }

  const token = authHeader.split('Bearer ')[1].trim();

  // If Firebase Admin is initialized with production credentials, verify real ID token
  if (firebaseAdminInitialized && admin.apps.length > 0) {
    try {
      const decodedToken = await admin.auth().verifyIdToken(token);
      req.user = {
        uid: decodedToken.uid,
        email: decodedToken.email,
        name: decodedToken.name,
      };
      return next();
    } catch (err: unknown) {
      const error = err as Error;
      // If verification failed and token is NOT a dev sandbox token, reject
      if (!token.startsWith('dev-mock-token-') && process.env.NODE_ENV === 'production') {
        res.status(401).json({
          error: 'Unauthorized',
          message: 'Invalid or expired authentication token.',
          details: error.message,
        });
        return;
      }
    }
  }

  // Development / Sandbox mode authentication support
  // Allows testing when running in local development mode without Firebase Cloud credentials
  if (token.startsWith('dev-mock-token-') || process.env.NODE_ENV !== 'production' || !firebaseAdminInitialized) {
    // Extract simulated UID from token safely
    const mockUid = token.startsWith('dev-mock-token-') 
      ? token.replace('dev-mock-token-', '') 
      : 'dev-user-primary';

    req.user = {
      uid: mockUid || 'dev-user-primary',
      email: `${mockUid || 'dev-user'}@gemini-lifeos.internal`,
      name: 'LifeOS Explorer',
      isDevMock: true,
    };
    return next();
  }

  res.status(401).json({
    error: 'Unauthorized',
    message: 'Unable to verify authentication credentials.',
  });
}
