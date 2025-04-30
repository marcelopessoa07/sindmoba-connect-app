
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Plus } from 'lucide-react';
import { EventForm } from '@/components/admin/events/EventForm';
import { EventViewer } from '@/components/admin/events/EventViewer';
import { EventList } from '@/components/admin/events/EventList';

interface Event {
  id: string;
  title: string;
  description: string | null;
  event_type: string;
  start_date: string;
  end_date: string;
  location: string | null;
  created_at: string | null;
  notify_target?: string;
}

const AdminEventsPage = () => {
  const [events, setEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<Event | null>(null);
  const [viewingEvent, setViewingEvent] = useState<Event | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchEvents();
  }, []);

  const fetchEvents = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('events')
        .select('*')
        .order('start_date', { ascending: false });

      if (error) {
        throw error;
      }

      setEvents(data || []);
    } catch (error) {
      console.error('Error fetching events:', error);
      toast({
        title: 'Erro ao carregar eventos',
        description: 'Não foi possível carregar a lista de eventos. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openAddDialog = () => {
    setEditingEvent(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    setIsDialogOpen(true);
  };

  const openViewDialog = (event: Event) => {
    setViewingEvent(event);
    setIsViewDialogOpen(true);
  };

  const handleEventDeleted = (deletedEventId: string) => {
    setEvents(events.filter(event => event.id !== deletedEventId));
  };

  return (
    <AdminLayout title="Gerenciamento de Eventos">
      <div className="space-y-4">
        <div className="flex justify-between">
          <p className="text-gray-600">
            Gerencie a agenda de eventos do sindicato.
          </p>
          <Button 
            onClick={openAddDialog}
            className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Evento
          </Button>
        </div>

        <EventList 
          events={events} 
          loading={loading}
          onEventView={openViewDialog}
          onEventEdit={openEditDialog}
          onEventDelete={handleEventDeleted}
          onAddEvent={openAddDialog}
        />

        <EventForm 
          isOpen={isDialogOpen} 
          onClose={() => setIsDialogOpen(false)} 
          editingEvent={editingEvent}
          onEventSaved={fetchEvents}
        />

        <EventViewer
          isOpen={isViewDialogOpen}
          onClose={() => setIsViewDialogOpen(false)}
          event={viewingEvent}
        />
      </div>
    </AdminLayout>
  );
};

export default AdminEventsPage;
