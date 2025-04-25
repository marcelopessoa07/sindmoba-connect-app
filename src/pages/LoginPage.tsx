
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';

const LoginPage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    if (loading) return;
    
    if (user && profile) {
      // Redirect based on role
      if (profile.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/main');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return null; // or your loading spinner
  }

  return <LoginForm />;
};

export default LoginPage;
