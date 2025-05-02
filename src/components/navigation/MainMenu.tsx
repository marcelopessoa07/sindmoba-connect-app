
import { NavLink } from 'react-router-dom';
import { 
  Calendar, 
  File, 
  Book, 
  List, 
  Mail, 
  User,
  Shield,
  Users,
  FileText,
  Newspaper,
  HelpCircle,
  MessageSquare,
  BookText
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { toast } from '@/hooks/use-toast';

interface MainMenuProps {
  closeMenu: () => void;
}

// Define the menu item interface with the external property
interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
  external?: boolean;
}

const MainMenu = ({ closeMenu }: MainMenuProps) => {
  const { user, profile, signOut } = useAuth();
  const [profileData, setProfileData] = useState({
    full_name: '',
    specialty: '',
  });
  
  useEffect(() => {
    if (profile) {
      setProfileData({
        full_name: profile.full_name || profile.email?.split('@')[0] || 'Usuário',
        specialty: profile.specialty === 'pml' ? 'PML - Perito Médico Legal' : 
                  profile.specialty === 'pol' ? 'POL - Perito Odonto Legal' : 
                  'Associado',
      });
    }
  }, [profile]);
  
  // Regular user menu items
  const memberMenuItems: MenuItem[] = [
    { title: 'Últimas Notícias', path: '/news', icon: List },
    { title: 'Agenda e Eventos', path: '/events', icon: Calendar },
    { title: 'Documentos e Arquivos', path: '/documents', icon: File },
    { title: 'Legislação e Direitos', path: '/legislation', icon: Book },
    { title: 'Perguntas Frequentes', path: '/faq', icon: HelpCircle },
    { title: 'Fórum', path: 'https://forum.sindmoba.org.br/', icon: MessageSquare, external: true }
  ];

  // Admin menu items
  const adminMenuItems: MenuItem[] = [
    { title: 'Gerenciar Membros', path: '/admin', icon: Users },
    { title: 'Documentos', path: '/admin/documents', icon: FileText },
    { title: 'Eventos', path: '/admin/events', icon: Calendar },
    { title: 'Notícias', path: '/admin/news', icon: Newspaper },
    { title: 'Gerenciamento de Contatos', path: '/admin/contacts', icon: Mail },
    { title: 'Legislação e Direitos', path: '/admin/legislation', icon: BookText },
    { title: 'FAQ', path: '/admin/faq', icon: HelpCircle },
  ];

  // Select which menu items to display based on user role
  const menuItems = profile?.role === 'admin' ? adminMenuItems : memberMenuItems;

  // Handle logout with confirmation
  const handleLogout = async () => {
    if (window.confirm('Tem certeza que deseja sair?')) {
      closeMenu(); // Close menu first for better UX
      
      toast({
        title: "Saindo do sistema",
        description: "Processando logout..."
      });
      
      try {
        await signOut();
        
        // Force redirect to login page after signOut completes
        window.location.href = '/login';
      } catch (error) {
        console.error("Logout error:", error);
        toast({
          title: "Erro ao sair",
          description: "Houve um problema ao fazer logout",
          variant: "destructive"
        });
        
        // Fallback redirect
        setTimeout(() => {
          window.location.href = '/login';
        }, 500);
      }
    }
  };

  return (
    <div className="flex h-full flex-col bg-white p-4">
      <div className="mb-6 flex items-center justify-center">
        <div className="h-24 w-full flex items-center justify-center">
          <img 
            src="/lovable-uploads/66f7fa3e-a2bd-4a64-bf5d-c6cb1846a31d.png" 
            alt="SINDMOBA Logo" 
            className="max-h-full max-w-full object-contain" 
          />
        </div>
      </div>
      
      <div className="mb-4">
        <p className="text-center text-sm font-medium text-gray-500">
          Logado como
        </p>
        <p className="text-center text-lg font-semibold text-sindmoba-dark">
          {profileData.full_name || user?.email?.split('@')[0] || 'Usuário'}
        </p>
        <p className="text-center text-sm text-gray-500">
          {profileData.specialty}
        </p>
        <div className="mt-2 flex justify-center">
          <NavLink
            to="/profile"
            className="text-sindmoba-primary text-sm flex items-center hover:underline"
            onClick={closeMenu}
          >
            <User className="mr-1 h-3 w-3" /> Ver perfil
          </NavLink>
        </div>
      </div>
      
      <div className="divide-y">
        {profile?.role === 'admin' && !adminMenuItems.some(item => item.path === '/admin') && (
          <NavLink
            to="/admin"
            className={({ isActive }) =>
              `flex items-center px-4 py-3 ${
                isActive
                  ? 'bg-sindmoba-light text-sindmoba-primary font-semibold'
                  : 'text-gray-700 hover:bg-gray-100'
              }`
            }
            onClick={closeMenu}
          >
            <Shield className="mr-3 h-5 w-5 text-sindmoba-primary" />
            <span className="font-medium">Painel Administrativo</span>
          </NavLink>
        )}
        {menuItems.map((item) => (
          item.external ? (
            <a
              key={item.path}
              href={item.path}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center px-4 py-3 text-gray-700 hover:bg-gray-100"
              onClick={closeMenu}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.title}</span>
            </a>
          ) : (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center px-4 py-3 ${
                  isActive
                    ? 'bg-sindmoba-light text-sindmoba-primary font-semibold'
                    : 'text-gray-700 hover:bg-gray-100'
                }`
              }
              onClick={closeMenu}
            >
              <item.icon className="mr-3 h-5 w-5" />
              <span>{item.title}</span>
            </NavLink>
          )
        ))}
      </div>
      
      <div className="mt-auto">
        <button
          className="flex w-full items-center justify-center rounded-md border border-sindmoba-danger py-2 text-sindmoba-danger"
          onClick={handleLogout}
        >
          Sair
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
