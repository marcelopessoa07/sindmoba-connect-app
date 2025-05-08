
import { useState } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Button } from '@/components/ui/button';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { School, Pencil, Trash2, Plus } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminEducationPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [formType, setFormType] = useState('curso');
  
  // Mock data - in a real app, this would come from your database
  const [items, setItems] = useState([
    {
      id: '1',
      title: 'Introdução à Perícia Médico-Legal',
      type: 'curso',
      link: 'https://exemplo.com/curso-pericia',
      details: {
        instructor: 'Dr. Carlos Mendes',
        description: 'Curso básico sobre os fundamentos da perícia médico-legal.'
      }
    },
    {
      id: '2',
      title: 'Manual de Procedimentos Periciais',
      type: 'material',
      link: 'https://exemplo.com/manual-procedimentos',
      details: {
        format: 'PDF',
        description: 'Documento com diretrizes e procedimentos padrão para perícias.'
      }
    },
    {
      id: '3',
      title: 'Workshop: Novas Técnicas Forenses',
      type: 'evento',
      link: 'https://exemplo.com/workshop',
      details: {
        date: '2025-06-15',
        location: 'Salvador, BA',
        description: 'Apresentação de novas tecnologias e técnicas aplicadas à perícia.'
      }
    }
  ]);
  
  const openAddDialog = (type: string) => {
    setFormType(type);
    setCurrentItem(null);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (item: any) => {
    setFormType(item.type);
    setCurrentItem(item);
    setIsDialogOpen(true);
  };
  
  const handleDelete = (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      setItems(items.filter(item => item.id !== id));
      toast({
        title: "Item excluído",
        description: "O item foi removido com sucesso."
      });
    }
  };
  
  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a real app, you would send this data to your backend
    const formData = new FormData(e.target as HTMLFormElement);
    const itemData = {
      id: currentItem ? currentItem.id : Date.now().toString(),
      title: formData.get('title') as string,
      type: formType,
      link: formData.get('link') as string,
      details: {
        ...(formType === 'curso' && { 
          instructor: formData.get('instructor') as string 
        }),
        ...(formType === 'material' && { 
          format: formData.get('format') as string 
        }),
        ...(formType === 'evento' && { 
          date: formData.get('date') as string,
          location: formData.get('location') as string 
        }),
        description: formData.get('description') as string
      }
    };
    
    if (currentItem) {
      setItems(items.map(item => item.id === currentItem.id ? itemData : item));
      toast({
        title: "Item atualizado",
        description: "As alterações foram salvas com sucesso."
      });
    } else {
      setItems([...items, itemData]);
      toast({
        title: "Item adicionado",
        description: "O novo item foi adicionado com sucesso."
      });
    }
    
    setIsDialogOpen(false);
  };
  
  return (
    <AdminLayout title="Gerenciamento de Ensino">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            Gerencie cursos, materiais educativos e eventos de capacitação para os associados.
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={() => openAddDialog('curso')} className="gap-1">
            <Plus size={16} />
            Novo Curso
          </Button>
          <Button onClick={() => openAddDialog('material')} variant="outline" className="gap-1">
            <Plus size={16} />
            Novo Material
          </Button>
          <Button onClick={() => openAddDialog('evento')} variant="outline" className="gap-1">
            <Plus size={16} />
            Novo Evento
          </Button>
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Link</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.length > 0 ? items.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>
                  <span className="capitalize">{item.type}</span>
                </TableCell>
                <TableCell>
                  <a href={item.link} target="_blank" rel="noopener noreferrer" className="text-sindmoba-primary hover:underline truncate block max-w-xs">
                    {item.link}
                  </a>
                </TableCell>
                <TableCell>
                  <div className="flex gap-2">
                    <Button size="icon" variant="ghost" onClick={() => openEditDialog(item)}>
                      <Pencil size={16} />
                    </Button>
                    <Button size="icon" variant="ghost" onClick={() => handleDelete(item.id)}>
                      <Trash2 size={16} />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )) : (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6">
                  <div className="flex flex-col items-center text-gray-500">
                    <School size={32} strokeWidth={1} className="mb-2" />
                    <p>Nenhum item cadastrado</p>
                    <p className="text-sm">Utilize os botões acima para adicionar novos itens.</p>
                  </div>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>
              {currentItem ? 'Editar' : 'Adicionar'} {
                formType === 'curso' ? 'Curso' : 
                formType === 'material' ? 'Material Educativo' : 'Evento Educacional'
              }
            </DialogTitle>
            <DialogDescription>
              Preencha os campos abaixo com as informações do item.
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSave}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <label htmlFor="title" className="text-sm font-medium">
                  Título
                </label>
                <Input 
                  id="title" 
                  name="title" 
                  defaultValue={currentItem?.title || ''}
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="link" className="text-sm font-medium">
                  Link
                </label>
                <Input 
                  id="link" 
                  name="link" 
                  placeholder="https://" 
                  defaultValue={currentItem?.link || ''}
                  required 
                />
              </div>
              
              {formType === 'curso' && (
                <div className="grid gap-2">
                  <label htmlFor="instructor" className="text-sm font-medium">
                    Instrutor
                  </label>
                  <Input 
                    id="instructor" 
                    name="instructor" 
                    defaultValue={currentItem?.details?.instructor || ''}
                    required 
                  />
                </div>
              )}
              
              {formType === 'material' && (
                <div className="grid gap-2">
                  <label htmlFor="format" className="text-sm font-medium">
                    Formato
                  </label>
                  <Select name="format" defaultValue={currentItem?.details?.format || 'PDF'}>
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o formato" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="PDF">PDF</SelectItem>
                      <SelectItem value="Vídeo">Vídeo</SelectItem>
                      <SelectItem value="Apresentação">Apresentação</SelectItem>
                      <SelectItem value="Ebook">Ebook</SelectItem>
                      <SelectItem value="Outro">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}
              
              {formType === 'evento' && (
                <>
                  <div className="grid gap-2">
                    <label htmlFor="date" className="text-sm font-medium">
                      Data
                    </label>
                    <Input 
                      id="date" 
                      name="date" 
                      type="date" 
                      defaultValue={currentItem?.details?.date || ''}
                      required 
                    />
                  </div>
                  <div className="grid gap-2">
                    <label htmlFor="location" className="text-sm font-medium">
                      Local
                    </label>
                    <Input 
                      id="location" 
                      name="location" 
                      defaultValue={currentItem?.details?.location || ''}
                      required 
                    />
                  </div>
                </>
              )}
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={currentItem?.details?.description || ''}
                  rows={3} 
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Cancelar
              </Button>
              <Button type="submit">Salvar</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminEducationPage;
