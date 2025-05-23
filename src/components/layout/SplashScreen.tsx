
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const SplashScreen = () => {
  const navigate = useNavigate();
  const [fadeOut, setFadeOut] = useState(false);
  const { user, loading } = useAuth();

  useEffect(() => {
    console.log('SplashScreen mounted, auth loading:', loading, 'user:', user ? 'exists' : 'none');
    
    // Only proceed with navigation when auth state is determined
    if (!loading) {
      console.log('Auth loading complete, preparing to navigate');
      const timer = setTimeout(() => {
        setFadeOut(true);
        setTimeout(() => {
          try {
            // Navigate to login if no user, otherwise to main
            if (user) {
              console.log('User found, navigating to /main');
              navigate('/main');
            } else {
              console.log('No user found, navigating to /login');
              navigate('/login');
            }
          } catch (error) {
            console.error('Navigation error:', error);
            // Fallback navigation
            window.location.href = '/login';
          }
        }, 500);
      }, 2000);

      return () => clearTimeout(timer);
    }
  }, [navigate, user, loading]);

  return (
    <div 
      className={`flex h-screen w-full flex-col items-center justify-center bg-sindmoba-primary transition-opacity duration-500 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
    >
      <div className="flex flex-col items-center">
        <div className="mb-6 w-96 h-auto">
          <img 
            src="/lovable-uploads/f871b032-f7fc-43cb-83e4-3f6d2381d1e6.png" 
            alt="SINDMOBA Logo" 
            className="w-full h-full object-contain max-w-[300px]" 
          />
        </div>
        
        <h1 className="mb-3 text-center text-2xl font-bold text-white">
          Sindicato dos Peritos Médicos e Odonto Legais da Bahia
        </h1>
        
        <p className="text-center text-lg text-white">
          Unindo e fortalecendo a perícia oficial da Bahia
        </p>

        {loading && (
          <div className="mt-8 flex items-center text-white">
            <Spinner className="text-white" />
            <span className="ml-2">Carregando...</span>
          </div>
        )}
      </div>
    </div>
  );
};

export default SplashScreen;
