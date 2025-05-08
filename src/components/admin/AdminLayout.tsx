
import { ReactNode, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { 
  CalendarDays, 
  FileText, 
  Users, 
  HelpCircle, 
  Newspaper,
  Mail,
  BookText,
  School,
  Library,
  ListFilter
} from 'lucide-react';
import { Spinner } from '@/components/ui/spinner';
import { toast } from '@/hooks/use-toast';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkAdminRole = async () => {
      if (!user) {
        console.log('No user found, redirecting to login');
        navigate('/login');
        return;
      }

      try {
        console.log('Checking admin role for user:', user.id);
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();

        console.log('Profile data:', data, 'Error:', error);

        if (error) {
          console.error('Error fetching profile:', error);
          setError('Error fetching user profile');
          toast({
            title: 'Error',
            description: 'Failed to validate admin permissions',
            variant: 'destructive',
          });
          return;
        }

        if (!data || !('role' in data) || data.role !== 'admin') {
          console.log('User is not an admin, redirecting to main');
          toast({
            title: 'Access Denied',
            description: 'You do not have admin privileges',
            variant: 'destructive',
          });
          navigate('/main');
          return;
        }

        console.log('Admin access confirmed');
        setLoading(false);
      } catch (error) {
        console.error('Error checking admin role:', error);
        setError('Failed to validate admin permissions');
        toast({
          title: 'Error',
          description: 'An unexpected error occurred',
          variant: 'destructive',
        });
        navigate('/main');
      }
    };

    checkAdminRole();
  }, [user, navigate]);

  const adminSections = [
    { title: 'Gerenciar Membros', icon: Users, path: '/admin' },
    { title: 'Documentos', icon: FileText, path: '/admin/documents' },
    { title: 'Eventos', icon: CalendarDays, path: '/admin/events' },
    { title: 'Notícias', icon: Newspaper, path: '/admin/news' },
    { title: 'Ensino', icon: School, path: '/admin/education' },
    { title: 'Biblioteca', icon: Library, path: '/admin/library' },
    { title: 'Categorias', icon: ListFilter, path: '/admin/legislation' },
    { title: 'Gerenciamento de Contatos', icon: Mail, path: '/admin/contacts' },
    { title: 'FAQ', icon: HelpCircle, path: '/admin/faq' },
  ];

  if (loading) {
    return (
      <div className="flex h-full w-full items-center justify-center p-8">
        <Spinner size="lg" />
        <span className="ml-2">Verificando permissões de administrador...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="rounded-lg border border-red-200 bg-red-50 p-6 text-center">
          <h2 className="mb-4 text-lg font-bold text-red-700">Erro</h2>
          <p className="text-red-600">{error}</p>
          <button 
            onClick={() => navigate('/main')}
            className="mt-4 rounded-lg bg-sindmoba-primary px-4 py-2 text-white"
          >
            Voltar para a página principal
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <nav className="mb-8">
        <ul className="flex flex-wrap gap-4">
          {adminSections.map((section) => (
            <li key={section.path}>
              <button
                onClick={() => navigate(section.path)}
                className="flex items-center gap-2 rounded-lg border border-gray-200 px-4 py-2 text-sm hover:bg-gray-50"
              >
                <section.icon className="h-4 w-4" />
                {section.title}
              </button>
            </li>
          ))}
        </ul>
      </nav>
      <div>
        <h1 className="mb-8 text-3xl font-bold">{title}</h1>
        {children}
      </div>
    </div>
  );
};

export default AdminLayout;
