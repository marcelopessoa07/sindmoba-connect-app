import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
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
import { Eye, Pencil, Trash2, Plus, CalendarDays } from 'lucide-react';

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

  const formatDateTimeForDisplay = (dateTimeString: string) => {
    const date = new Date(dateTimeString);
    return {
      date: date.toISOString().split('T')[0],
      time: date.toTimeString().split(':').slice(0, 2).join(':')
    };
  };

  const openAddDialog = () => {
    setEditingEvent(null);
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
    setIsDialogOpen(true);
  };

  const openEditDialog = (event: Event) => {
    setEditingEvent(event);
    const startDateTime = formatDateTimeForDisplay(event.start_date);
    const endDateTime = formatDateTimeForDisplay(event.end_date);
    
    setFormData({
      title: event.title,
      description: event.description || '',
      event_type: event.event_type,
      start_date: startDateTime.date,
      start_time: startDateTime.time,
      end_date: endDateTime.date,
      end_time: endDateTime.time,
      location: event.location || '',
      notify_target: event.notify_target || 'all',
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (event: Event) => {
    setViewingEvent(event);
    setIsViewDialogOpen(true);
  };

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

      setIsDialogOpen(false);
      fetchEvents(); // Refresh the list
    } catch (error) {
      console.error('Error saving event:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o evento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este evento?')) {
      try {
        const { error } = await supabase
          .from('events')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Remove event from state
        setEvents(events.filter(event => event.id !== id));
        
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

        {loading ? (
          <div className="text-center py-8">
            <p>Carregando eventos...</p>
          </div>
        ) : events.length > 0 ? (
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
                        onClick={() => openViewDialog(event)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(event)}
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
        ) : (
          <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
            <p>Não há eventos cadastrados.</p>
            <Button 
              onClick={openAddDialog}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Primeiro Evento
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog - Redesigned to be more compact */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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

      {/* View Event Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Visualizar Evento</DialogTitle>
          </DialogHeader>
          {viewingEvent && (
            <div className="space-y-3 py-2">
              <div className="flex items-center">
                <CalendarDays className="h-8 w-8 text-sindmoba-primary mr-3" />
                <div>
                  <h2 className="text-lg font-bold">{viewingEvent.title}</h2>
                  <p className="text-sm text-gray-500">
                    {viewingEvent.event_type}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3 border-t border-b py-2">
                <div>
                  <h3 className="font-semibold text-xs text-gray-500">Início</h3>
                  <p className="text-sm">{formatDate(viewingEvent.start_date)}</p>
                </div>
                <div>
                  <h3 className="font-semibold text-xs text-gray-500">Término</h3>
                  <p className="text-sm">{formatDate(viewingEvent.end_date)}</p>
                </div>
              </div>
              
              {viewingEvent.location && (
                <div>
                  <h3 className="font-semibold text-xs text-gray-500">Local</h3>
                  <p className="text-sm">{viewingEvent.location}</p>
                </div>
              )}
              
              {viewingEvent.description && (
                <div>
                  <h3 className="font-semibold text-xs text-gray-500">Descrição</h3>
                  <p className="text-sm">{viewingEvent.description}</p>
                </div>
              )}
              
              <div>
                <h3 className="font-semibold text-xs text-gray-500">Notificações</h3>
                <p className="text-sm">
                  {viewingEvent.notify_target === 'all' 
                    ? 'Todos os membros' 
                    : viewingEvent.notify_target === 'pml'
                      ? 'Apenas PML'
                      : 'Apenas POL'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" size="sm">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEventsPage;
