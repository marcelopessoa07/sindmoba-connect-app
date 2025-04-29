
import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import MainMenu from '../navigation/MainMenu';
import { Button } from '@/components/ui/button';
import { Menu } from 'lucide-react';
import { useNotifications } from '@/hooks/use-notifications';
import { requestNotificationPermission } from '@/utils/notifications';

const AppLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  
  // Initialize notifications
  useNotifications();
  
  // Request notification permissions on first load
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  const toggleMenu = () => {
    setMenuOpen(!menuOpen);
  };

  const handleBackClick = () => {
    if (location.pathname === '/main') {
      if (confirm('Deseja sair do aplicativo?')) {
        // In a real app, we would exit the app here
      }
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="flex h-screen flex-col">
      {/* Header */}
      <header className="bg-sindmoba-primary p-4 shadow-md">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            className="text-white hover:bg-sindmoba-secondary"
            onClick={handleBackClick}
          >
            Voltar
          </Button>
          <div className="flex items-center justify-center">
            <h1 className="text-xl font-bold text-white">SINDMOBA</h1>
          </div>
          <Button
            variant="ghost"
            className="text-white hover:bg-sindmoba-secondary"
            onClick={toggleMenu}
          >
            <Menu />
          </Button>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto">
        <Outlet />
      </main>

      {/* Menu Overlay */}
      {menuOpen && (
        <div
          className="absolute inset-0 bg-black bg-opacity-50 z-10"
          onClick={() => setMenuOpen(false)}
        >
          <div
            className="absolute right-0 top-0 h-full w-3/4 max-w-xs transform bg-white shadow-lg"
            onClick={(e) => e.stopPropagation()}
          >
            <MainMenu closeMenu={() => setMenuOpen(false)} />
          </div>
        </div>
      )}
    </div>
  );
};

export default AppLayout;
