
import { useState, useEffect } from 'react';
import { Calendar } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

interface Event {
  id: string;
  title: string;
  description: string;
  start_date: string;
  end_date: string;
  location: string;
  event_type: 'assembly' | 'course' | 'celebration' | 'other';
}

const Events = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setLoading(true);
        setError(null);
        
        console.log('Fetching events from Supabase...');
        const { data, error } = await supabase
          .from('events')
          .select('*')
          .order('start_date', { ascending: true });

        if (error) {
          console.error('Error fetching events:', error);
          setError('Não foi possível carregar os eventos. Tente novamente mais tarde.');
          return;
        }

        console.log('Events fetched:', data);
        
        // Type cast the event_type to match our interface
        const typedEvents = data?.map(event => ({
          ...event,
          event_type: validateEventType(event.event_type)
        })) || [];

        setEvents(typedEvents);
      } catch (error) {
        console.error('Error in events fetch:', error);
        setError('Ocorreu um erro ao carregar os eventos.');
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Helper function to validate event_type
  const validateEventType = (type: string): Event['event_type'] => {
    const validTypes: Event['event_type'][] = ['assembly', 'course', 'celebration', 'other'];
    return validTypes.includes(type as Event['event_type']) 
      ? (type as Event['event_type']) 
      : 'other';
  };

  // Format date from ISO to DD/MM/YYYY
  const formatDate = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleDateString('pt-BR');
  };

  // Format time from ISO date
  const formatTime = (isoDate: string) => {
    const date = new Date(isoDate);
    return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const getEventTypeStyle = (type: Event['event_type']) => {
    switch (type) {
      case 'assembly':
        return 'bg-sindmoba-accent text-sindmoba-dark';
      case 'course':
        return 'bg-sindmoba-success text-white';
      case 'celebration':
        return 'bg-sindmoba-warning text-white';
      default:
        return 'bg-sindmoba-light text-sindmoba-dark';
    }
  };

  const getEventTypeName = (type: Event['event_type']) => {
    switch (type) {
      case 'assembly':
        return 'Assembleia';
      case 'course':
        return 'Curso';
      case 'celebration':
        return 'Celebração';
      default:
        return 'Outro';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Spinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="sindmoba-container">
        <h2 className="mb-6">Agenda e Eventos</h2>
        <div className="text-center py-8 bg-red-50 rounded-lg">
          <p className="text-red-600">{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="sindmoba-container">
      <h2 className="mb-6">Agenda e Eventos</h2>
      
      <div className="mb-6 flex gap-2 flex-wrap">
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-sindmoba-accent mr-1"></span>
          <span className="text-xs">Assembleias</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-sindmoba-success mr-1"></span>
          <span className="text-xs">Cursos</span>
        </div>
        <div className="flex items-center">
          <span className="h-3 w-3 rounded-full bg-sindmoba-warning mr-1"></span>
          <span className="text-xs">Celebrações</span>
        </div>
      </div>
      
      {events.length > 0 ? (
        <div className="space-y-4">
          {events.map((event) => (
            <div key={event.id} className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden">
              <div className="flex">
                <div className="flex-shrink-0 w-2 h-full bg-opacity-80" style={{ backgroundColor: event.event_type === 'assembly' ? '#3498db' : event.event_type === 'course' ? '#27ae60' : '#f39c12' }}></div>
                <div className="p-4 w-full">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center">
                      <Calendar className="h-4 w-4 mr-1 text-sindmoba-primary" />
                      <span className="text-sm font-medium">{formatDate(event.start_date)} às {formatTime(event.start_date)}</span>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${getEventTypeStyle(event.event_type)}`}>
                      {getEventTypeName(event.event_type)}
                    </span>
                  </div>
                  
                  <h3 className="text-lg font-bold mb-2">{event.title}</h3>
                  <p className="text-gray-600 mb-2">{event.description}</p>
                  <div className="text-sm text-gray-500">
                    <strong>Local:</strong> {event.location}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <p className="text-gray-500">Nenhum evento disponível no momento.</p>
        </div>
      )}
    </div>
  );
};

export default Events;
