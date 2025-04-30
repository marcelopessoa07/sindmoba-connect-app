
import { useState } from 'react';
import { Eye, Pencil, Trash2, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Spinner } from '@/components/ui/spinner';

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

interface EventListProps {
  events: Event[];
  loading: boolean;
  onEventView: (event: Event) => void;
  onEventEdit: (event: Event) => void;
  onEventDelete: (eventId: string) => void;
  onAddEvent: () => void;
}

export const EventList = ({ 
  events, 
  loading, 
  onEventView, 
  onEventEdit, 
  onEventDelete,
  onAddEvent
}: EventListProps) => {
  const { toast } = useToast();
  
  const formatDate = (dateString: string) => {
    const options: Intl.DateTimeFormatOptions = {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString('pt-BR', options);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        onEventDelete(id);
        
        toast({
          title: 'Evento excluído',
          description: 'O evento foi excluído com sucesso.',
        });
      } catch (error) {
        console.error('Error deleting event:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir o evento. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="text-center py-8">
        <Spinner size="lg" />
        <p className="mt-2">Carregando eventos...</p>
      </div>
    );
  }

  if (events.length === 0) {
    return (
      <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
        <p>Não há eventos cadastrados.</p>
        <Button 
          onClick={onAddEvent}
          variant="outline" 
          className="mt-4"
        >
          <Plus className="h-4 w-4 mr-2" /> Adicionar Primeiro Evento
        </Button>
      </div>
    );
  }

  return (
    <div className="rounded-lg border bg-white shadow-sm">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[300px]">Título</TableHead>
            <TableHead>Tipo</TableHead>
            <TableHead>Data de Início</TableHead>
            <TableHead>Data de Término</TableHead>
            <TableHead>Local</TableHead>
            <TableHead className="text-right">Ações</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {events.map((event) => (
            <TableRow key={event.id}>
              <TableCell className="font-medium">{event.title}</TableCell>
              <TableCell>{event.event_type}</TableCell>
              <TableCell>{formatDate(event.start_date)}</TableCell>
              <TableCell>{formatDate(event.end_date)}</TableCell>
              <TableCell>{event.location || 'Não informado'}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEventView(event)}
                >
                  <Eye className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onEventEdit(event)}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleDelete(event.id)}
                >
                  <Trash2 className="h-4 w-4 text-sindmoba-danger" />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
