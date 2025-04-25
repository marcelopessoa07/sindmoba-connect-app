
import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useEffect } from 'react';
import { 
  CalendarDays, 
  FileText, 
  Users, 
  HelpCircle, 
  Newspaper,
  Folder
} from 'lucide-react';

interface AdminLayoutProps {
  children: ReactNode;
  title: string;
}

const AdminLayout = ({ children, title }: AdminLayoutProps) => {
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

        if (error || !data || !('role' in data) || data.role !== 'admin') {
          navigate('/main');
          return;
        }
      } catch (error) {
        console.error('Error checking admin role:', error);
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
    { title: 'Arquivos Enviados', icon: Folder, path: '/admin/submissions' },
    { title: 'FAQ', icon: HelpCircle, path: '/admin/faq' },
  ];

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
