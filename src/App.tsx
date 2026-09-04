import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LifeOSProvider, useLifeOS } from './context/LifeOSContext';
import { AppLayout } from './components/layout/AppLayout';
import { Dashboard } from './pages/Dashboard';
import { Chat } from './pages/Chat';
import { Journal } from './pages/Journal';
import { AskJournal } from './pages/AskJournal';
import { MorningBrief } from './pages/MorningBrief';
import { DailyReflection } from './pages/DailyReflection';
import { Memories } from './pages/Memories';
import { Goals } from './pages/Goals';
import { Tasks } from './pages/Tasks';
import { Insights } from './pages/Insights';
import { Search } from './pages/Search';
import { Settings } from './pages/Settings';
import { Login } from './pages/auth/Login';
import { Signup } from './pages/auth/Signup';
import { ForgotPassword } from './pages/auth/ForgotPassword';
import { Onboarding } from './pages/auth/Onboarding';
import { ChatMode } from './types';
import { Bell, X } from 'lucide-react';

const MainAppContent: React.FC = () => {
  const { user, loading } = useAuth();
  const { notifications, markNotificationAsRead } = useLifeOS();

  const [currentPath, setCurrentPath] = useState<string>(() => {
    return window.location.pathname === '/' ? '/dashboard' : window.location.pathname;
  });

  const [quickChatPrompt, setQuickChatPrompt] = useState<string | undefined>(undefined);
  const [quickChatMode, setQuickChatMode] = useState<ChatMode>('GENERAL');

  // Handle browser back/forward
  useEffect(() => {
    const handlePopState = () => {
      setCurrentPath(window.location.pathname === '/' ? '/dashboard' : window.location.pathname);
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: string) => {
    setCurrentPath(path);
    window.history.pushState(null, '', path);
  };

  const handleLaunchChatPrompt = (prompt: string, mode?: string) => {
    setQuickChatPrompt(prompt);
    if (mode) setQuickChatMode(mode as ChatMode);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-space-950 flex flex-col items-center justify-center space-y-4 cyber-grid">
        <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-500/40 animate-spin flex items-center justify-center text-cyan shadow-glow-cyan">
          <div className="w-4 h-4 rounded-full bg-cyan" />
        </div>
        <p className="text-xs font-mono text-cyan tracking-widest uppercase">
          Initializing Gemini LifeOS Environment...
        </p>
      </div>
    );
  }

  // Unauthenticated routes
  if (!user) {
    if (currentPath === '/signup') return <Signup onNavigate={navigate} />;
    if (currentPath === '/forgot-password') return <ForgotPassword onNavigate={navigate} />;
    return <Login onNavigate={navigate} />;
  }

  // Onboarding route
  if (currentPath === '/onboarding') {
    return <Onboarding onComplete={() => navigate('/dashboard')} />;
  }

  // Protected workspace layout
  return (
    <AppLayout currentPath={currentPath} onNavigate={navigate}>
      {currentPath === '/dashboard' && (
        <Dashboard
          onNavigate={navigate}
          onQuickChatPrompt={handleLaunchChatPrompt}
        />
      )}
      {currentPath === '/chat' && (
        <Chat
          initialPrompt={quickChatPrompt}
          initialMode={quickChatMode}
        />
      )}
      {currentPath === '/journal' && <Journal />}
      {currentPath === '/ask-journal' && <AskJournal />}
      {currentPath === '/morning-brief' && <MorningBrief onNavigate={navigate} />}
      {currentPath === '/daily-reflection' && <DailyReflection />}
      {currentPath === '/memories' && <Memories />}
      {currentPath === '/goals' && <Goals />}
      {currentPath === '/tasks' && <Tasks />}
      {currentPath === '/insights' && <Insights />}
      {currentPath === '/search' && <Search onNavigate={navigate} />}
      {currentPath === '/settings' && <Settings />}

      {/* Floating Notifications Toast Container */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none max-w-sm w-full">
        {notifications
          .filter(n => !n.read)
          .slice(0, 3)
          .map((n) => (
            <div
              key={n.id}
              className="pointer-events-auto flex items-start gap-2.5 p-3 rounded-xl bg-space-900/95 border border-cyan-500/30 text-xs shadow-glow-cyan backdrop-blur-md animate-in slide-in-from-bottom"
            >
              <div className="p-1 rounded bg-cyan-500/10 text-cyan mt-0.5">
                <Bell className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 space-y-0.5">
                <p className="font-semibold text-white">{n.title}</p>
                <p className="text-[11px] text-slate-400 leading-tight">{n.message}</p>
              </div>
              <button
                onClick={() => markNotificationAsRead(n.id)}
                className="text-slate-500 hover:text-white p-0.5"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
      </div>
    </AppLayout>
  );
};

export const App: React.FC = () => {
  return (
    <AuthProvider>
      <LifeOSProvider>
        <MainAppContent />
      </LifeOSProvider>
    </AuthProvider>
  );
};

export default App;
