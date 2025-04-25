
import MemberRegistration from '@/components/admin/MemberRegistration';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

const AdminPage = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        if (error) {
          console.error('Error fetching profile:', error);
          navigate('/main');
          return;
        }

        // Check if role exists and is admin
        if (!data || !('role' in data) || data.role !== 'admin') {
          navigate('/main');
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
        navigate('/main');
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-8">Painel Administrativo</h1>
      <MemberRegistration />
    </div>
  );
};

export default AdminPage;
