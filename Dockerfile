# Multi-stage Dockerfile for Gemini LifeOS (Cloud Run AI Challenge)
# Stage 1: Build Client and Server
FROM node:20-alpine AS builder
WORKDIR /app

# Copy root package files and install client dependencies
COPY package*.json ./
RUN npm ci

# Copy server package files and install server dependencies
COPY server/package*.json ./server/
RUN npm --prefix server ci

# Copy full source
COPY . .

# Build Vite client and Express server
RUN npm run build
RUN npm --prefix server run build

# Stage 2: Production Runtime
FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=8080

# Copy root package & built frontend
COPY package*.json ./
COPY --from=builder /app/dist ./dist

# Copy server package, production dependencies, and built server
COPY server/package*.json ./server/
RUN npm --prefix server ci --only=production
COPY --from=builder /app/server/dist ./server/dist

EXPOSE 8080

# Run the backend server
CMD ["node", "server/dist/index.js"]
