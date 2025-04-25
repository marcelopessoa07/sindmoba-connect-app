
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '@/components/layout/SplashScreen';
import { useAuth } from '@/contexts/AuthContext';

const Index = () => {
  const navigate = useNavigate();
  const { loading } = useAuth();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Make sure we wait for auth to initialize
    if (!loading) {
      setIsReady(true);
    }
  }, [loading]);

  // Only render splash screen when auth state is determined
  return isReady ? <SplashScreen /> : null;
};

export default Index;
