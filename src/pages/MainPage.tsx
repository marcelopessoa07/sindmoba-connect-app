import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, File, Book, List, Mail, Users, Newspaper, FileText, HelpCircle, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { pt } from 'date-fns/locale';

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
  type: 'document' | 'event' | 'news';
  itemId: string;
}

const MainPage = () => {
  const { profile } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Fetch notifications from various sources
  useEffect(() => {
    if (!profile) return;
    
    const fetchNotifications = async () => {
      setLoading(true);
      const allNotifications: Notification[] = [];
      
      try {
        // Fetch recent documents
        const { data: documents } = await supabase
          .from('documents')
          .select('id, title, created_at, category')
          .order('created_at', { ascending: false })
          .limit(3);
          
        if (documents) {
          documents.forEach(doc => {
            allNotifications.push({
              id: `doc-${doc.id}`,
              title: `Novo documento: ${doc.title}`,
              time: format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt }),
              type: 'document',
              itemId: doc.id
            });
          });
        }
        
        // Fetch upcoming events
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 7); // Events in the next week
        
        const { data: events } = await supabase
          .from('events')
          .select('id, title, start_date')
          .lt('start_date', tomorrow.toISOString())
          .gt('start_date', new Date().toISOString())
          .order('start_date', { ascending: true })
          .limit(3);
          
        if (events) {
          events.forEach(event => {
            allNotifications.push({
              id: `event-${event.id}`,
              title: `Evento próximo: ${event.title}`,
              time: format(new Date(event.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt }),
              type: 'event',
              itemId: event.id
            });
          });
        }
        
        // Fetch recent news
        const { data: news } = await supabase
          .from('news')
          .select('id, title, published_at')
          .order('published_at', { ascending: false })
          .limit(3);
          
        if (news) {
          news.forEach(item => {
            allNotifications.push({
              id: `news-${item.id}`,
              title: `Nova notícia: ${item.title}`,
              time: format(new Date(item.published_at), "dd/MM/yyyy", { locale: pt }),
              type: 'news',
              itemId: item.id
            });
          });
        }
        
        // Sort notifications by time (newest first)
        allNotifications.sort((a, b) => {
          return new Date(b.time).getTime() - new Date(a.time).getTime();
        });
        
        // Take the most recent 5 notifications
        setNotifications(allNotifications.slice(0, 5));
        
      } catch (error) {
        console.error("Error fetching notifications:", error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchNotifications();
    
    // Set up real-time listeners for new content
    const documentsChannel = supabase
      .channel('public:documents')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'documents' 
        },
        payload => {
          const doc = payload.new;
          setNotifications(prev => [{
            id: `doc-${doc.id}`,
            title: `Novo documento: ${doc.title}`,
            time: format(new Date(doc.created_at), "dd/MM/yyyy 'às' HH:mm", { locale: pt }),
            type: 'document',
            itemId: doc.id
          }, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();
      
    const eventsChannel = supabase
      .channel('public:events')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'events' 
        },
        payload => {
          const event = payload.new;
          setNotifications(prev => [{
            id: `event-${event.id}`,
            title: `Novo evento: ${event.title}`,
            time: format(new Date(event.start_date), "dd/MM/yyyy 'às' HH:mm", { locale: pt }),
            type: 'event',
            itemId: event.id
          }, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();
      
    const newsChannel = supabase
      .channel('public:news')
      .on('postgres_changes', 
        { 
          event: 'INSERT', 
          schema: 'public', 
          table: 'news' 
        },
        payload => {
          const news = payload.new;
          setNotifications(prev => [{
            id: `news-${news.id}`,
            title: `Nova notícia: ${news.title}`,
            time: format(new Date(news.published_at), "dd/MM/yyyy", { locale: pt }),
            type: 'news',
            itemId: news.id
          }, ...prev.slice(0, 4)]);
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(documentsChannel);
      supabase.removeChannel(eventsChannel);
      supabase.removeChannel(newsChannel);
    };
  }, [profile]);

  const handleNotificationClick = (notification: Notification) => {
    // Navigate to the appropriate page based on notification type
    if (notification.type === 'document') {
      window.location.href = '/documents';
    } else if (notification.type === 'event') {
      window.location.href = '/events';
    } else if (notification.type === 'news') {
      window.location.href = '/news';
    }
  };

  const memberMenuItems: MenuItem[] = [
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

  const adminMenuItems: MenuItem[] = [
    { 
      title: 'Gerenciar Membros', 
      path: '/admin', 
      icon: Users,
      color: '#3498db',
      description: 'Gerencie os membros do sindicato'
    },
    { 
      title: 'Documentos', 
      path: '/admin/documents', 
      icon: FileText,
      color: '#27ae60',
      description: 'Gerencie os documentos do sindicato'
    },
    { 
      title: 'Eventos', 
      path: '/admin/events', 
      icon: Calendar,
      color: '#f39c12',
      description: 'Gerencie eventos e assembleias'
    },
    { 
      title: 'Notícias', 
      path: '/admin/news', 
      icon: Newspaper,
      color: '#8e44ad',
      description: 'Publique e edite notícias'
    },
    { 
      title: 'Gerenciamento de Contatos', 
      path: '/admin/contacts', 
      icon: Mail,
      color: '#2980b9',
      description: 'Configure os contatos do sindicato'
    },
    { 
      title: 'FAQ', 
      path: '/admin/faq', 
      icon: HelpCircle,
      color: '#2c3e50',
      description: 'Gerencie as perguntas frequentes'
    }
  ];

  // Select which menu items to display based on user role
  const menuItems = profile?.role === 'admin' ? adminMenuItems : memberMenuItems;

  return (
    <div className="sindmoba-container">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="mb-1">Bem-vindo, {profile?.full_name || 'Associado'}</h2>
          <p className="text-sm text-gray-600">
            {profile?.role === 'admin' ? 'Administrador' : 
             profile?.specialty === 'pml' ? 'PML - Perito Médico Legal' : 
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
        <h3 className="mb-3 flex items-center text-lg font-semibold text-sindmoba-primary">
          {profile?.role === 'admin' ? (
            'Painel Administrativo'
          ) : (
            <>
              <Bell className="mr-2 h-5 w-5" />
              Notificações Recentes
            </>
          )}
        </h3>
        
        {profile?.role === 'admin' ? (
          <p className="text-gray-600 p-3 bg-white rounded-lg">
            Bem-vindo ao painel administrativo do SINDMOBA. Use o menu abaixo para gerenciar o sindicato.
          </p>
        ) : loading ? (
          <div className="text-center p-3 bg-white rounded-lg">
            <p className="text-gray-600">Carregando notificações...</p>
          </div>
        ) : notifications.length > 0 ? (
          <div className="space-y-2">
            {notifications.map(notification => (
              <div 
                key={notification.id}
                className="flex items-center justify-between rounded-lg bg-white p-3 shadow-sm hover:bg-gray-50 cursor-pointer"
                onClick={() => handleNotificationClick(notification)}
              >
                <div>
                  <p className="font-medium">{notification.title}</p>
                  <span className="text-xs text-gray-500">{notification.time}</span>
                </div>
                <div className={`w-2 h-2 rounded-full ${
                  notification.type === 'document' ? 'bg-green-500' : 
                  notification.type === 'event' ? 'bg-orange-500' : 'bg-blue-500'
                }`}></div>
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
        <h3 className="mb-4 text-lg font-semibold">
          {profile?.role === 'admin' ? 'Funções Administrativas' : 'Menu Principal'}
        </h3>
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
        <h3 className="mb-2 text-lg font-semibold">
          {profile?.role === 'admin' ? 'Precisa de ajuda com o painel?' : 'Precisa de ajuda?'}
        </h3>
        <p className="mb-4 text-sm text-gray-600">
          {profile?.role === 'admin' 
            ? 'Entre em contato com o suporte técnico em caso de problemas.'
            : 'Nossa equipe está à disposição para atendê-lo em caso de dúvidas.'}
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
