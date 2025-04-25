
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { Spinner } from '@/components/ui/spinner';

const LoginPage = () => {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Only redirect after auth is fully loaded
    if (loading) return;
    
    // Debug logged in user data
    if (user) {
      console.log('User authenticated:', user);
      console.log('User profile data:', profile);
    
      // Redirect based on role
      console.log('Redirecting user with role:', profile?.role || 'unknown');
      if (profile?.role === 'admin') {
        navigate('/admin');
      } else {
        navigate('/main');
      }
    }
  }, [user, profile, loading, navigate]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  return <LoginForm />;
};

export default LoginPage;
