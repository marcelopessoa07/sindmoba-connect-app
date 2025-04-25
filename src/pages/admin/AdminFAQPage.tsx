
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
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { Pencil, Trash2, Plus } from 'lucide-react';

interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string | null;
  is_active: boolean;
  order_index: number;
}

const AdminFAQPage = () => {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<FAQItem | null>(null);
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    is_active: true,
    order_index: 0,
  });
  const { toast } = useToast();

  // Categories for FAQ items
  const categories = [
    'Geral',
    'Filiação',
    'Contribuição Sindical',
    'Benefícios',
    'Assembleia',
    'Jurídico'
  ];

  useEffect(() => {
    fetchFAQItems();
  }, []);

  const fetchFAQItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('faq_items')
        .select('*')
        .order('order_index', { ascending: true });

      if (error) {
        throw error;
      }

      setFaqItems(data || []);
    } catch (error) {
      console.error('Error fetching FAQ items:', error);
      toast({
        title: 'Erro ao carregar perguntas frequentes',
        description: 'Não foi possível carregar os itens de FAQ. Tente novamente mais tarde.',
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

  const handleSwitchChange = (checked: boolean) => {
    setFormData({
      ...formData,
      is_active: checked,
    });
  };

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    });
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      question: '',
      answer: '',
      category: '',
      is_active: true,
      order_index: faqItems.length > 0 ? Math.max(...faqItems.map(item => item.order_index || 0)) + 1 : 0,
    });
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: FAQItem) => {
    setEditingItem(item);
    setFormData({
      question: item.question,
      answer: item.answer,
      category: item.category || '',
      is_active: item.is_active,
      order_index: item.order_index || 0,
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingItem) {
        // Update existing FAQ item
        const { error } = await supabase
          .from('faq_items')
          .update({
            question: formData.question,
            answer: formData.answer,
            category: formData.category || null,
            is_active: formData.is_active,
            order_index: formData.order_index,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({
          title: 'Item atualizado',
          description: 'O item de FAQ foi atualizado com sucesso.',
        });
      } else {
        // Create new FAQ item
        const { error } = await supabase
          .from('faq_items')
          .insert({
            question: formData.question,
            answer: formData.answer,
            category: formData.category || null,
            is_active: formData.is_active,
            order_index: formData.order_index,
          });

        if (error) throw error;
        toast({
          title: 'Item criado',
          description: 'Um novo item de FAQ foi adicionado com sucesso.',
        });
      }

      setIsDialogOpen(false);
      fetchFAQItems(); // Refresh the list
    } catch (error) {
      console.error('Error saving FAQ item:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o item de FAQ. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este item?')) {
      try {
        const { error } = await supabase
          .from('faq_items')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Remove item from state
        setFaqItems(faqItems.filter(item => item.id !== id));
        
        toast({
          title: 'Item excluído',
          description: 'O item de FAQ foi excluído com sucesso.',
        });
      } catch (error) {
        console.error('Error deleting FAQ item:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir o item de FAQ. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <AdminLayout title="Gerenciamento de FAQ">
      <div className="space-y-4">
        <div className="flex justify-between">
          <p className="text-gray-600">
            Adicione, edite ou remova perguntas frequentes que serão exibidas aos membros.
          </p>
          <Button 
            onClick={openAddDialog}
            className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Pergunta
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Carregando perguntas frequentes...</p>
          </div>
        ) : faqItems.length > 0 ? (
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[400px]">Pergunta</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Ordem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {faqItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.question}</TableCell>
                    <TableCell>{item.category || 'Não categorizado'}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${item.is_active ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_active ? 'Ativo' : 'Inativo'}
                      </span>
                    </TableCell>
                    <TableCell>{item.order_index}</TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(item)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(item.id)}
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
            <p>Não há perguntas frequentes cadastradas.</p>
            <Button 
              onClick={openAddDialog}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Primeira Pergunta
            </Button>
          </div>
        )}
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Pergunta Frequente' : 'Adicionar Pergunta Frequente'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="question">Pergunta</Label>
                <Input
                  id="question"
                  name="question"
                  value={formData.question}
                  onChange={handleInputChange}
                  placeholder="Digite a pergunta"
                  required
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="answer">Resposta</Label>
                <Textarea
                  id="answer"
                  name="answer"
                  value={formData.answer}
                  onChange={handleInputChange}
                  placeholder="Digite a resposta"
                  className="min-h-[120px]"
                  required
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category} value={category}>
                        {category}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="order_index">Ordem</Label>
                <Input
                  id="order_index"
                  name="order_index"
                  value={formData.order_index}
                  onChange={(e) => setFormData({ ...formData, order_index: parseInt(e.target.value) || 0 })}
                  type="number"
                  min="0"
                />
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={formData.is_active} 
                  onCheckedChange={handleSwitchChange} 
                  id="is_active"
                />
                <Label htmlFor="is_active">Ativo</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit">
                {editingItem ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminFAQPage;
