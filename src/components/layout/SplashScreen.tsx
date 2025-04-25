
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    // Only proceed with navigation when auth state is determined
    if (!loading) {
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          try {
            // Navigate to login if no user, otherwise to main
            if (user) {
              navigate('/main');
            } else {
              navigate('/login');
            }
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback navigation
            window.location.href = '/login';
          }
        }, 500);
      }, 2500);

      return () => clearTimeout(timer);
    }
  }, [navigate, user, loading]);

  return (
    <div 
      className={`flex h-screen w-full flex-col items-center justify-center bg-sindmoba-primary transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center">
        {/* Placeholder for Logo - You'll need to add a real logo */}
        <div className="mb-6 h-40 w-40 rounded-full bg-white p-4 shadow-lg">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-sindmoba-light text-5xl font-bold text-sindmoba-primary">
            SM
          </div>
        </div>
        
        <h1 className="mb-3 text-center text-2xl font-bold text-white">
          Sindicato dos Peritos Médicos e Odonto Legais da Bahia
        </h1>
        
        <p className="animate-pulse-gentle text-center text-lg text-white">
          Unindo e fortalecendo a perícia oficial da Bahia
        </p>
      </div>
    </div>
  );
};

export default SplashScreen;
