
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import SplashScreen from '@/components/layout/SplashScreen';

const Index = () => {
  const navigate = useNavigate();

  useEffect(() => {
    // We'll handle navigation in SplashScreen component 
    // to avoid routing conflicts
  }, [navigate]);

  return <SplashScreen />;
};

export default Index;
