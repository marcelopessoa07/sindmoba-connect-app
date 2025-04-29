
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
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from '@/hooks/use-toast';
import { Eye, Pencil, Trash2, Plus, Upload, Image as ImageIcon } from 'lucide-react';

interface NewsItem {
  id: string;
  title: string;
  summary: string;
  content: string;
  image_url: string | null;
  is_featured: boolean;
  published_at: string | null;
  created_at: string | null;
  notify_target?: string;
}

const AdminNewsPage = () => {
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<NewsItem | null>(null);
  const [viewingItem, setViewingItem] = useState<NewsItem | null>(null);
  const [image, setImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    summary: '',
    content: '',
    is_featured: false,
    published_at: new Date().toISOString().split('T')[0],
    notify_target: 'all',
  });
  const { toast } = useToast();

  // Notification target options
  const notificationTargets = [
    { value: 'all', label: 'Todos os membros' },
    { value: 'pml', label: 'Apenas PML' },
    { value: 'pol', label: 'Apenas POL' },
  ];

  useEffect(() => {
    fetchNewsItems();
  }, []);

  const fetchNewsItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('news')
        .select('*')
        .order('published_at', { ascending: false });

      if (error) {
        throw error;
      }

      setNewsItems(data || []);
    } catch (error) {
      console.error('Error fetching news items:', error);
      toast({
        title: 'Erro ao carregar notícias',
        description: 'Não foi possível carregar a lista de notícias. Tente novamente mais tarde.',
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
      is_featured: checked,
    });
  };

  const handleNotifyTargetChange = (value: string) => {
    setFormData({
      ...formData,
      notify_target: value,
    });
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedImage = e.target.files[0];
      setImage(selectedImage);
      
      // Create a preview
      const reader = new FileReader();
      reader.onload = (event) => {
        setImagePreview(event.target?.result as string);
      };
      reader.readAsDataURL(selectedImage);
    }
  };

  const openAddDialog = () => {
    setEditingItem(null);
    setFormData({
      title: '',
      summary: '',
      content: '',
      is_featured: false,
      published_at: new Date().toISOString().split('T')[0],
      notify_target: 'all',
    });
    setImage(null);
    setImagePreview(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (item: NewsItem) => {
    setEditingItem(item);
    setFormData({
      title: item.title,
      summary: item.summary,
      content: item.content,
      is_featured: item.is_featured || false,
      published_at: item.published_at ? new Date(item.published_at).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
      notify_target: item.notify_target || 'all',
    });
    setImage(null);
    setImagePreview(item.image_url ? supabase.storage.from('news-images').getPublicUrl(item.image_url).data.publicUrl : null);
    setIsDialogOpen(true);
  };

  const openViewDialog = (item: NewsItem) => {
    setViewingItem(item);
    setIsViewDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      setUploading(true);
      
      let imageUrl = editingItem?.image_url || null;
      
      // Upload image if a new one is selected
      if (image) {
        const fileName = `${Date.now()}_${image.name}`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('news-images')
          .upload(fileName, image);
        
        if (uploadError) throw uploadError;
        
        imageUrl = fileName;
      }
      
      // Prepare news data
      const newsData = {
        title: formData.title,
        summary: formData.summary,
        content: formData.content,
        is_featured: formData.is_featured,
        published_at: new Date(formData.published_at).toISOString(),
        notify_target: formData.notify_target,
        ...(image ? { image_url: imageUrl } : {}),
      };
      
      if (editingItem) {
        // Update existing news item
        const { error } = await supabase
          .from('news')
          .update({
            ...newsData,
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingItem.id);

        if (error) throw error;
        toast({
          title: 'Notícia atualizada',
          description: 'A notícia foi atualizada com sucesso.',
        });
      } else {
        // Create new news item
        const { error } = await supabase
          .from('news')
          .insert({
            ...newsData,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        toast({
          title: 'Notícia adicionada',
          description: 'A nova notícia foi adicionada com sucesso.',
        });
      }

      setIsDialogOpen(false);
      fetchNewsItems(); // Refresh the list
    } catch (error) {
      console.error('Error saving news item:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar a notícia. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir esta notícia?')) {
      try {
        const itemToDelete = newsItems.find(item => item.id === id);
        
        if (itemToDelete && itemToDelete.image_url) {
          // Delete image from storage if it exists
          await supabase
            .storage
            .from('news-images')
            .remove([itemToDelete.image_url]);
        }
        
        // Delete from database
        const { error } = await supabase
          .from('news')
          .delete()
          .eq('id', id);

        if (error) throw error;
        
        // Remove item from state
        setNewsItems(newsItems.filter(item => item.id !== id));
        
        toast({
          title: 'Notícia excluída',
          description: 'A notícia foi excluída com sucesso.',
        });
      } catch (error) {
        console.error('Error deleting news item:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir a notícia. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  return (
    <AdminLayout title="Gerenciamento de Notícias">
      <div className="space-y-4">
        <div className="flex justify-between">
          <p className="text-gray-600">
            Gerencie as notícias e informações disponíveis para os membros do sindicato.
          </p>
          <Button 
            onClick={openAddDialog}
            className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Notícia
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Carregando notícias...</p>
          </div>
        ) : newsItems.length > 0 ? (
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Título</TableHead>
                  <TableHead>Data de Publicação</TableHead>
                  <TableHead>Destaque</TableHead>
                  <TableHead>Imagem</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {newsItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="font-medium">{item.title}</TableCell>
                    <TableCell>{formatDate(item.published_at)}</TableCell>
                    <TableCell>
                      <span className={`px-2 py-1 rounded text-xs ${item.is_featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                        {item.is_featured ? 'Sim' : 'Não'}
                      </span>
                    </TableCell>
                    <TableCell>
                      {item.image_url ? 'Sim' : 'Não'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(item)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
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
            <p>Não há notícias cadastradas.</p>
            <Button 
              onClick={openAddDialog}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Primeira Notícia
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>
              {editingItem ? 'Editar Notícia' : 'Adicionar Notícia'}
            </DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Digite o título da notícia"
                  required
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="summary">Resumo</Label>
                <Textarea
                  id="summary"
                  name="summary"
                  value={formData.summary}
                  onChange={handleInputChange}
                  placeholder="Digite um breve resumo da notícia"
                  className="min-h-[80px]"
                  required
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="content">Conteúdo</Label>
                <Textarea
                  id="content"
                  name="content"
                  value={formData.content}
                  onChange={handleInputChange}
                  placeholder="Digite o conteúdo completo da notícia"
                  className="min-h-[200px]"
                  required
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="published_at">Data de Publicação</Label>
                <Input
                  id="published_at"
                  name="published_at"
                  type="date"
                  value={formData.published_at}
                  onChange={handleInputChange}
                  required
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="image">Imagem (Opcional)</Label>
                <div className="flex items-center">
                  <Input
                    id="image"
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                  <div className="flex items-center w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('image')?.click()}
                      className="flex-shrink-0"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Selecionar imagem
                    </Button>
                    <span className="ml-3 text-sm text-gray-500">
                      {image ? image.name : editingItem && editingItem.image_url ? 'Manter imagem atual' : 'Nenhuma imagem selecionada'}
                    </span>
                  </div>
                </div>
                
                {imagePreview && (
                  <div className="mt-2">
                    <p className="text-sm text-gray-500 mb-1">Pré-visualização:</p>
                    <div className="border rounded-md overflow-hidden h-32 w-auto">
                      <img 
                        src={imagePreview} 
                        alt="Preview" 
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </div>
                )}
              </div>
              
              {/* Notification target */}
              <div className="grid w-full gap-2">
                <Label>Notificar</Label>
                <RadioGroup 
                  value={formData.notify_target} 
                  onValueChange={handleNotifyTargetChange}
                  className="flex flex-col space-y-2"
                >
                  {notificationTargets.map((target) => (
                    <div key={target.value} className="flex items-center space-x-2">
                      <RadioGroupItem value={target.value} id={`notify-news-${target.value}`} />
                      <Label htmlFor={`notify-news-${target.value}`}>{target.label}</Label>
                    </div>
                  ))}
                </RadioGroup>
              </div>
              
              <div className="flex items-center space-x-2">
                <Switch 
                  checked={formData.is_featured} 
                  onCheckedChange={handleSwitchChange} 
                  id="is_featured"
                />
                <Label htmlFor="is_featured">Destacar notícia</Label>
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Enviando...' : editingItem ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View News Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[700px]">
          <DialogHeader>
            <DialogTitle>Visualizar Notícia</DialogTitle>
          </DialogHeader>
          {viewingItem && (
            <div className="space-y-4 py-4">
              <h2 className="text-xl font-bold">{viewingItem.title}</h2>
              <p className="text-sm text-gray-500">
                Publicado em {formatDate(viewingItem.published_at)}
              </p>
              
              {viewingItem.image_url && (
                <div className="rounded-md overflow-hidden h-40 w-full">
                  <img 
                    src={supabase.storage.from('news-images').getPublicUrl(viewingItem.image_url).data.publicUrl}
                    alt={viewingItem.title}
                    className="h-full w-full object-cover"
                  />
                </div>
              )}
              
              <div>
                <h3 className="font-semibold">Resumo</h3>
                <p>{viewingItem.summary}</p>
              </div>
              
              <div>
                <h3 className="font-semibold">Conteúdo</h3>
                <div className="prose max-w-none">
                  {viewingItem.content.split('\n').map((paragraph, i) => (
                    <p key={i}>{paragraph}</p>
                  ))}
                </div>
              </div>
              
              <div className="flex items-center">
                <span className="font-semibold mr-2">Destaque:</span>
                <span className={`px-2 py-1 rounded text-xs ${viewingItem.is_featured ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {viewingItem.is_featured ? 'Sim' : 'Não'}
                </span>
              </div>
              
              <div>
                <h3 className="font-semibold">Notificações enviadas para:</h3>
                <p>
                  {viewingItem.notify_target === 'all' 
                    ? 'Todos os membros' 
                    : viewingItem.notify_target === 'pml'
                      ? 'Apenas PML'
                      : 'Apenas POL'}
                </p>
              </div>
            </div>
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminNewsPage;
