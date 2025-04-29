import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, File, Book, List, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';

interface MenuItem {
  title: string;
  path: string;
  icon: React.ElementType;
  color: string;
  description: string;
}

interface Notification {
  id: string;
  title: string;
  time: string;
}

const MainPage = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  // In a real application, you would fetch notifications from the server here
  useEffect(() => {
    // Empty this out to have no notifications by default
    // Later you can implement real notifications fetching from Supabase
    setNotifications([]);
  }, []);

  const menuItems: MenuItem[] = [
    { 
      title: 'Últimas Notícias', 
      path: '/news', 
      icon: List,
      color: '#3498db',
      description: 'Acompanhe as últimas atualizações do sindicato'
    },
    { 
      title: 'Agenda e Eventos', 
      path: '/events', 
      icon: Calendar,
      color: '#f39c12',
      description: 'Calendário de assembleias, cursos e eventos'
    },
    { 
      title: 'Documentos e Arquivos', 
      path: '/documents', 
      icon: File,
      color: '#27ae60',
      description: 'Acesse documentos oficiais e informativos'
    },
    { 
      title: 'Legislação e Direitos', 
      path: '/legislation', 
      icon: Book,
      color: '#8e44ad',
      description: 'Conheça seus direitos como perito sindicalizado'
    },
    { 
      title: 'Perguntas Frequentes', 
      path: '/faq', 
      icon: List,
      color: '#2c3e50',
      description: 'Respostas para as dúvidas mais comuns'
    },
    { 
      title: 'Contato e Atendimento', 
      path: '/contact', 
      icon: Mail,
      color: '#2980b9',
      description: 'Canais de comunicação direta com o SINDMOBA'
    }
  ];

  return (
    <div className="sindmoba-container">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-1">Bem-vindo, {profile?.full_name || 'Associado'}</h2>
          <p className="text-sm text-gray-600">
            {profile?.specialty === 'pml' ? 'PML - Perito Médico Legal' : 
             profile?.specialty === 'pol' ? 'POL - Perito Odonto Legal' : 
             'Associado SINDMOBA'}
          </p>
        </div>
        <div className="h-12 w-12 rounded-full bg-sindmoba-primary p-1">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white">
            <img 
              src="/lovable-uploads/66f7fa3e-a2bd-4a64-bf5d-c6cb1846a31d.png" 
              alt="SINDMOBA Logo" 
              className="max-w-full max-h-full object-contain" 
            />
          </div>
        </div>
      </div>

      <section className="mb-6 rounded-lg bg-sindmoba-primary bg-opacity-10 p-4">
        <h3 className="mb-3 text-lg font-semibold text-sindmoba-primary">Notificações Recentes</h3>
        {notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div key={notification.id} className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm">
                <p className="font-medium">{notification.title}</p>
                <span className="text-xs text-gray-500">{notification.time}</span>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-600 p-3 bg-white rounded-lg">
            Bem-vindo ao SINDMOBA! Você ainda não tem notificações.
            Quando houver novos comunicados do sindicato, eles aparecerão aqui.
          </p>
        )}
      </section>

      <Separator className="my-6" />

      <section>
        <h3 className="mb-4 text-lg font-semibold">Menu Principal</h3>
        <div className="grid grid-cols-2 gap-4">
          {menuItems.map(item => (
            <Link
              key={item.path}
              to={item.path}
              className="flex flex-col rounded-lg border border-gray-200 bg-white p-4 shadow-sm transition-all hover:shadow-md"
            >
              <div 
                className="mb-3 rounded-full p-2" 
                style={{ backgroundColor: `${item.color}20` }}
              >
                <item.icon style={{ color: item.color }} className="h-5 w-5" />
              </div>
              <h4 className="mb-1 font-medium">{item.title}</h4>
              <p className="text-xs text-gray-600">{item.description}</p>
            </Link>
          ))}
        </div>
      </section>

      <section className="mt-8 rounded-lg bg-sindmoba-light p-4 text-center">
        <h3 className="mb-2 text-lg font-semibold">Precisa de ajuda?</h3>
        <p className="mb-4 text-sm text-gray-600">
          Nossa equipe está à disposição para atendê-lo em caso de dúvidas.
        </p>
        <Button
          asChild
          variant="outline"
          className="border-sindmoba-primary text-sindmoba-primary hover:bg-sindmoba-primary hover:text-white"
        >
          <Link to="/contact">Contato e Atendimento</Link>
        </Button>
      </section>
    </div>
  );
};

export default MainPage;
