import { NavLink } from 'react-router-dom';
import { Calendar, File, Book, List, Mail, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface MainMenuProps {
  closeMenu: () => void;
}

interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
}

const MainMenu = ({ closeMenu }: MainMenuProps) => {
  const { user, signOut } = useAuth();
  
  const menuItems: MenuItem[] = [
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
          João Silva
        </p>
        <p className="text-center text-sm text-gray-500">
          PML - Perito Médico Legal
        </p>
      </div>
      
      <div className="divide-y">
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
