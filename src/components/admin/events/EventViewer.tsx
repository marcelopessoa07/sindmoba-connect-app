
import { CalendarDays } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

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

interface EventViewerProps {
  isOpen: boolean;
  onClose: () => void;
  event: Event | null;
}

export const EventViewer = ({ isOpen, onClose, event }: EventViewerProps) => {
  if (!event) {
    return null;
  }

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Visualizar Evento</DialogTitle>
        </DialogHeader>
        <div className="space-y-3 py-2">
          <div className="flex items-center">
            <CalendarDays className="h-8 w-8 text-sindmoba-primary mr-3" />
            <div>
              <h2 className="text-lg font-bold">{event.title}</h2>
              <p className="text-sm text-gray-500">
                {event.event_type}
              </p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-3 border-t border-b py-2">
            <div>
              <h3 className="font-semibold text-xs text-gray-500">Início</h3>
              <p className="text-sm">{formatDate(event.start_date)}</p>
            </div>
            <div>
              <h3 className="font-semibold text-xs text-gray-500">Término</h3>
              <p className="text-sm">{formatDate(event.end_date)}</p>
            </div>
          </div>
          
          {event.location && (
            <div>
              <h3 className="font-semibold text-xs text-gray-500">Local</h3>
              <p className="text-sm">{event.location}</p>
            </div>
          )}
          
          {event.description && (
            <div>
              <h3 className="font-semibold text-xs text-gray-500">Descrição</h3>
              <p className="text-sm">{event.description}</p>
            </div>
          )}
          
          <div>
            <h3 className="font-semibold text-xs text-gray-500">Notificações</h3>
            <p className="text-sm">
              {event.notify_target === 'all' 
                ? 'Todos os membros' 
                : event.notify_target === 'pml'
                  ? 'Apenas PML'
                  : 'Apenas POL'}
            </p>
          </div>
        </div>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" size="sm">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
