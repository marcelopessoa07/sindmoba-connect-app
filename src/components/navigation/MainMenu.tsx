
import { NavLink } from 'react-router-dom';
import { 
  Calendar, 
  File, 
  Book, 
  List, 
  Mail, 
  Users, 
  User
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface MainMenuProps {
  closeMenu: () => void;
}

const MainMenu = ({ closeMenu }: MainMenuProps) => {
  const { user, signOut } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [profileData, setProfileData] = useState({
    full_name: '',
    specialty: '',
  });
  
  useEffect(() => {
    const checkAdminRole = async () => {
      if (user) {
        try {
          // Verificar se o usuário tem role 'admin'
          const { data, error } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .single();

          if (error) {
            console.error('Error fetching profile:', error);
            return;
          }

          // Check if role exists and is admin
          setIsAdmin(data && 'role' in data && data.role === 'admin');
          
          // Set profile data for display
          if (data) {
            setProfileData({
              full_name: data.full_name || 'Usuário',
              specialty: data.specialty === 'pml' ? 'PML - Perito Médico Legal' : 
                        data.specialty === 'pol' ? 'POL - Perito Odonto Legal' : 
                        'Associado',
            });
          }
        } catch (error) {
          console.error('Error checking admin role:', error);
        }
      }
    };

    checkAdminRole();
  }, [user]);
  
  const menuItems = [
    { title: 'Últimas Notícias', path: '/news', icon: List },
    { title: 'Agenda e Eventos', path: '/events', icon: Calendar },
    { title: 'Documentos e Arquivos', path: '/documents', icon: File },
    { title: 'Legislação e Direitos', path: '/legislation', icon: Book },
    { title: 'Perguntas Frequentes', path: '/faq', icon: List },
    { title: 'Filiação ao Sindicato', path: '/membership', icon: Users },
    { title: 'Envio de Arquivos', path: '/file-submission', icon: File },
    { title: 'Contato e Atendimento', path: '/contact', icon: Mail }
  ];

  return (
    <div className="flex h-full flex-col bg-white p-4">
      <div className="mb-6 flex items-center justify-center">
        <div className="h-16 w-16 rounded-full bg-sindmoba-primary p-2">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-xl font-bold text-sindmoba-primary">
            SM
          </div>
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
        {isAdmin && (
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
            <Users className="mr-3 h-5 w-5" />
            <span>Painel Administrativo</span>
          </NavLink>
        )}
        {menuItems.map((item) => (
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
        ))}
      </div>
      
      <div className="mt-auto">
        <button
          className="flex w-full items-center justify-center rounded-md border border-sindmoba-danger py-2 text-sindmoba-danger"
          onClick={() => {
            signOut();
            closeMenu();
          }}
        >
          Sair
        </button>
      </div>
    </div>
  );
};

export default MainMenu;
