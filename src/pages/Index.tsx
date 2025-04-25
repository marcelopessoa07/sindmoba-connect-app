
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '@/components/layout/SplashScreen';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();
  
  console.log('Index page rendered, auth loading:', loading, 'user:', user ? 'exists' : 'none');

  // If loading takes too long, we'll have a fallback
  useEffect(() => {
    if (!loading) {
      console.log('Auth loaded, user:', user ? 'exists' : 'none');
      // If the user is logged in, no need to show splash for long
      if (user) {
        console.log('User is logged in, will navigate to main shortly');
        const timer = setTimeout(() => {
          console.log('Navigating to main');
          navigate('/main');
        }, 1000);
        return () => clearTimeout(timer);
      }
    } else {
      // Fallback if loading takes too long
      const timeoutId = setTimeout(() => {
        if (loading) {
          console.log('Auth loading timeout - navigating to login as fallback');
          navigate('/login');
        }
      }, 5000);
      
      return () => clearTimeout(timeoutId);
    }
  }, [loading, user, navigate]);

  if (loading) {
    console.log('Rendering loading spinner while auth initializes');
    return (
      <div className="flex h-screen w-full items-center justify-center bg-sindmoba-primary">
        <Spinner size="lg" className="text-white" />
        <span className="ml-2 text-white">Inicializando aplicação...</span>
      </div>
    );
  }

  console.log('Rendering splash screen');
  return <SplashScreen />;
};

export default Index;
