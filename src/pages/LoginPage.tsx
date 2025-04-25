
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import LoginForm from '@/components/auth/LoginForm';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const LoginPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    // Check if user is already logged in
    const checkUserAndRedirect = async () => {
      if (!user) return;
      
      try {
        // Fetch the user's profile to check their role
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', user.id)
          .single();
          
        if (error) {
          console.error('Error fetching user profile:', error);
          navigate('/main');
          return;
        }
        
        // Redirect based on role
        if (profile && profile.role === 'admin') {
          navigate('/admin');
        } else {
          navigate('/main');
        }
      } catch (error) {
        console.error('Error during role check:', error);
        navigate('/main');
      }
    };

    checkUserAndRedirect();
  }, [user, navigate]);

  return <LoginForm />;
};

export default LoginPage;
