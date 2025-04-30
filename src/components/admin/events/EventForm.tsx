
import { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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

interface EventFormProps {
  isOpen: boolean;
  onClose: () => void;
  editingEvent: Event | null;
  onEventSaved: () => void;
}

// Event types
const eventTypes = [
  'Assembleia',
  'Curso',
  'Reunião',
  'Evento Social',
  'Protesto',
  'Conferência'
];

// Notification target options
const notificationTargets = [
  { value: 'all', label: 'Todos os membros' },
  { value: 'pml', label: 'Apenas PML' },
  { value: 'pol', label: 'Apenas POL' },
];

export const EventForm = ({ isOpen, onClose, editingEvent, onEventSaved }: EventFormProps) => {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    event_type: '',
    start_date: '',
    start_time: '',
    end_date: '',
    end_time: '',
    location: '',
    notify_target: 'all',
  });
  const { toast } = useToast();

  useEffect(() => {
    if (editingEvent) {
      const startDateTime = formatDateTimeForDisplay(editingEvent.start_date);
      const endDateTime = formatDateTimeForDisplay(editingEvent.end_date);
      
      setFormData({
        title: editingEvent.title,
        description: editingEvent.description || '',
        event_type: editingEvent.event_type,
        start_date: startDateTime.date,
        start_time: startDateTime.time,
        end_date: endDateTime.date,
        end_time: endDateTime.time,
        location: editingEvent.location || '',
        notify_target: editingEvent.notify_target || 'all',
      });
    } else {
      const now = new Date();
      const tomorrow = new Date(now);
      tomorrow.setDate(tomorrow.getDate() + 1);
      
      setFormData({
        title: '',
        description: '',
        event_type: '',
        start_date: now.toISOString().split('T')[0],
        start_time: '09:00',
        end_date: tomorrow.toISOString().split('T')[0],
        end_time: '17:00',
        location: '',
        notify_target: 'all',
      });
    }
  }, [editingEvent]);

  const formatDateTimeForDisplay = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(':').slice(0, 2).join(':')
    };
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleEventTypeChange = (value: string) => {
    setFormData({
      ...formData,
      event_type: value,
    });
  };

  const handleNotifyTargetChange = (value: string) => {
    setFormData({
      ...formData,
      notify_target: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      // Combine date and time for start_date and end_date
      const startDateTime = new Date(`${formData.start_date}T${formData.start_time}`);
      const endDateTime = new Date(`${formData.end_date}T${formData.end_time}`);
      
      // Check if end date is after start date
      if (endDateTime <= startDateTime) {
        toast({
          title: 'Erro de validação',
          description: 'A data e hora de término deve ser posterior à data e hora de início.',
          variant: 'destructive',
        });
        return;
      }
      
      // Prepare event data
      const eventData = {
        title: formData.title,
        description: formData.description || null,
        event_type: formData.event_type,
        start_date: startDateTime.toISOString(),
        end_date: endDateTime.toISOString(),
        location: formData.location || null,
        notify_target: formData.notify_target,
      };
      
      if (editingEvent) {
        // Update existing event
        const { error } = await supabase
          .from('events')
          .update({
            ...eventData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingEvent.id);

        if (error) throw error;
        toast({
          title: 'Evento atualizado',
          description: 'O evento foi atualizado com sucesso.',
        });
      } else {
        // Create new event
        const { error } = await supabase
          .from('events')
          .insert({
            ...eventData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        toast({
          title: 'Evento adicionado',
          description: 'O novo evento foi adicionado com sucesso.',
        });
      }

      onClose();
      onEventSaved();
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o evento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[550px]">
        <DialogHeader>
          <DialogTitle>
            {editingEvent ? 'Editar Evento' : 'Adicionar Evento'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="space-y-3">
            {/* Title field */}
            <div>
              <Label htmlFor="title" className="text-sm">Título</Label>
              <Input
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Digite o título do evento"
                required
                className="h-9"
              />
            </div>
            
            {/* Event type field */}
            <div>
              <Label htmlFor="event_type" className="text-sm">Tipo de Evento</Label>
              <Select
                value={formData.event_type}
                onValueChange={handleEventTypeChange}
                required
              >
                <SelectTrigger className="h-9">
                  <SelectValue placeholder="Selecione o tipo de evento" />
                </SelectTrigger>
                <SelectContent>
                  {eventTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            {/* Date and time fields in a more compact layout */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="start_date" className="text-sm">Data de Início</Label>
                <Input
                  id="start_date"
                  name="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={handleInputChange}
                  required
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="start_time" className="text-sm">Hora de Início</Label>
                <Input
                  id="start_time"
                  name="start_time"
                  type="time"
                  value={formData.start_time}
                  onChange={handleInputChange}
                  required
                  className="h-9"
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="end_date" className="text-sm">Data de Término</Label>
                <Input
                  id="end_date"
                  name="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={handleInputChange}
                  required
                  className="h-9"
                />
              </div>
              <div>
                <Label htmlFor="end_time" className="text-sm">Hora de Término</Label>
                <Input
                  id="end_time"
                  name="end_time"
                  type="time"
                  value={formData.end_time}
                  onChange={handleInputChange}
                  required
                  className="h-9"
                />
              </div>
            </div>
            
            {/* Location field */}
            <div>
              <Label htmlFor="location" className="text-sm">Local (Opcional)</Label>
              <Input
                id="location"
                name="location"
                value={formData.location}
                onChange={handleInputChange}
                placeholder="Digite o local do evento"
                className="h-9"
              />
            </div>
            
            {/* Description field with smaller height */}
            <div>
              <Label htmlFor="description" className="text-sm">Descrição (Opcional)</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Descreva brevemente o evento"
                className="min-h-[60px] resize-none"
                rows={2}
              />
            </div>
            
            {/* Notification targets in a more compact layout */}
            <div>
              <Label className="text-sm mb-1 block">Notificar</Label>
              <RadioGroup 
                value={formData.notify_target} 
                onValueChange={handleNotifyTargetChange}
                className="flex flex-row space-x-4"
              >
                {notificationTargets.map((target) => (
                  <div key={target.value} className="flex items-center space-x-1">
                    <RadioGroupItem value={target.value} id={`notify-${target.value}`} />
                    <Label htmlFor={`notify-${target.value}`} className="text-sm">{target.label}</Label>
                  </div>
                ))}
              </RadioGroup>
            </div>
          </div>

          <DialogFooter className="pt-2">
            <DialogClose asChild>
              <Button type="button" variant="outline" size="sm">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" size="sm">
              {editingEvent ? 'Atualizar' : 'Adicionar'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
