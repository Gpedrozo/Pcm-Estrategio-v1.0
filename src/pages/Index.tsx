import { Navigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import gppisLogo from '@/assets/gppis-logo.png';

const Index = () => {
  const { isAuthenticated, isLoading } = useAuth();
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowSplash(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (showSplash || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-gradient-to-br from-[hsl(215,28%,10%)] via-[hsl(215,28%,14%)] to-[hsl(215,28%,10%)] overflow-hidden">
        <div className="flex flex-col items-center justify-center text-center px-6 animate-fade-in-scale">
          <div className="mb-6 animate-logo-glow">
            <img src={gppisLogo} alt="GPPIS Industrial Systems" className="h-28 w-auto" />
          </div>
          <h1 className="text-4xl font-bold text-[hsl(210,20%,95%)] tracking-tight">PCM ESTRATÉGICO</h1>
          <p className="mt-4 text-lg font-light tracking-[0.25em] text-[hsl(210,20%,70%)]">
            Transformando dados de manutenção em resultados.
          </p>
        </div>
      </div>
    );
  }

  return <Navigate to={isAuthenticated ? '/dashboard' : '/login'} replace />;
};

export default Index;
