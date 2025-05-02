
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
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
  DialogDescription,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Pencil, Plus, Trash2, ExternalLink } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface LegislationItem {
  id: string;
  title: string;
  url: string;
  category: string;
  description?: string;
  created_at: string;
}

interface CategoryParams {
  id: string;
  category_type: string;
  name: string;
  description?: string;
  created_at: string;
}

const AdminLegislationPage = () => {
  const [legislationItems, setLegislationItems] = useState<LegislationItem[]>([]);
  const [categories, setCategories] = useState<CategoryParams[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isEditCategoryDialogOpen, setIsEditCategoryDialogOpen] = useState(false);
  const [isDeleteCategoryDialogOpen, setIsDeleteCategoryDialogOpen] = useState(false);
  
  const [currentItem, setCurrentItem] = useState<LegislationItem | null>(null);
  const [currentCategory, setCurrentCategory] = useState<CategoryParams | null>(null);
  
  const [formData, setFormData] = useState({
    title: '',
    url: '',
    category: '',
    description: '',
  });
  
  const [categoryFormData, setCategoryFormData] = useState({
    category_type: 'legislation',
    name: '',
    description: '',
  });
  
  const { toast } = useToast();
  
  useEffect(() => {
    fetchLegislationItems();
    fetchCategories();
  }, []);
  
  const fetchLegislationItems = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('legislation_items')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setLegislationItems(data || []);
    } catch (error) {
      console.error('Error fetching legislation items:', error);
      toast({
        title: 'Erro ao carregar itens',
        description: 'Não foi possível carregar a lista de legislação.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('category_params')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
      toast({
        title: 'Erro ao carregar categorias',
        description: 'Não foi possível carregar as categorias.',
        variant: 'destructive',
      });
    }
  };
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleCategoryInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCategoryFormData({
      ...categoryFormData,
      [name]: value,
    });
  };
  
  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    });
  };
  
  const handleCategoryTypeChange = (value: string) => {
    setCategoryFormData({
      ...categoryFormData,
      category_type: value,
    });
  };
  
  const openAddDialog = () => {
    setFormData({
      title: '',
      url: '',
      category: '',
      description: '',
    });
    setIsAddDialogOpen(true);
  };
  
  const openEditDialog = (item: LegislationItem) => {
    setCurrentItem(item);
    setFormData({
      title: item.title || '',
      url: item.url || '',
      category: item.category || '',
      description: item.description || '',
    });
    setIsEditDialogOpen(true);
  };
  
  const openDeleteDialog = (item: LegislationItem) => {
    setCurrentItem(item);
    setIsDeleteDialogOpen(true);
  };
  
  const openAddCategoryDialog = () => {
    setCategoryFormData({
      category_type: 'legislation',
      name: '',
      description: '',
    });
    setIsCategoryDialogOpen(true);
  };
  
  const openEditCategoryDialog = (category: CategoryParams) => {
    setCurrentCategory(category);
    setCategoryFormData({
      category_type: category.category_type || 'legislation',
      name: category.name || '',
      description: category.description || '',
    });
    setIsEditCategoryDialogOpen(true);
  };
  
  const openDeleteCategoryDialog = (category: CategoryParams) => {
    setCurrentCategory(category);
    setIsDeleteCategoryDialogOpen(true);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('legislation_items')
        .insert([{
          title: formData.title,
          url: formData.url,
          category: formData.category,
          description: formData.description || null,
        }]);

      if (error) throw error;
      
      toast({
        title: 'Item adicionado',
        description: 'O item de legislação foi adicionado com sucesso.',
      });
      
      setIsAddDialogOpen(false);
      fetchLegislationItems();
    } catch (error) {
      console.error('Error adding legislation item:', error);
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar o item de legislação.',
        variant: 'destructive',
      });
    }
  };
  
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentItem) return;
    
    try {
      const { error } = await supabase
        .from('legislation_items')
        .update({
          title: formData.title,
          url: formData.url,
          category: formData.category,
          description: formData.description || null,
        })
        .eq('id', currentItem.id);

      if (error) throw error;
      
      toast({
        title: 'Item atualizado',
        description: 'O item de legislação foi atualizado com sucesso.',
      });
      
      setIsEditDialogOpen(false);
      fetchLegislationItems();
    } catch (error) {
      console.error('Error updating legislation item:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o item de legislação.',
        variant: 'destructive',
      });
    }
  };
  
  const handleDelete = async () => {
    if (!currentItem) return;
    
    try {
      const { error } = await supabase
        .from('legislation_items')
        .delete()
        .eq('id', currentItem.id);

      if (error) throw error;
      
      toast({
        title: 'Item excluído',
        description: 'O item de legislação foi excluído com sucesso.',
      });
      
      setIsDeleteDialogOpen(false);
      fetchLegislationItems();
    } catch (error) {
      console.error('Error deleting legislation item:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir o item de legislação.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { data, error } = await supabase
        .from('category_params')
        .insert([{
          category_type: categoryFormData.category_type,
          name: categoryFormData.name,
          description: categoryFormData.description || null,
        }]);

      if (error) throw error;
      
      toast({
        title: 'Categoria adicionada',
        description: 'A categoria foi adicionada com sucesso.',
      });
      
      setIsCategoryDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error adding category:', error);
      toast({
        title: 'Erro ao adicionar',
        description: 'Não foi possível adicionar a categoria.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCategoryUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!currentCategory) return;
    
    try {
      const { error } = await supabase
        .from('category_params')
        .update({
          category_type: categoryFormData.category_type,
          name: categoryFormData.name,
          description: categoryFormData.description || null,
        })
        .eq('id', currentCategory.id);

      if (error) throw error;
      
      toast({
        title: 'Categoria atualizada',
        description: 'A categoria foi atualizada com sucesso.',
      });
      
      setIsEditCategoryDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error updating category:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar a categoria.',
        variant: 'destructive',
      });
    }
  };
  
  const handleCategoryDelete = async () => {
    if (!currentCategory) return;
    
    try {
      const { error } = await supabase
        .from('category_params')
        .delete()
        .eq('id', currentCategory.id);

      if (error) throw error;
      
      toast({
        title: 'Categoria excluída',
        description: 'A categoria foi excluída com sucesso.',
      });
      
      setIsDeleteCategoryDialogOpen(false);
      fetchCategories();
    } catch (error) {
      console.error('Error deleting category:', error);
      toast({
        title: 'Erro ao excluir',
        description: 'Não foi possível excluir a categoria.',
        variant: 'destructive',
      });
    }
  };
  
  const getLegislationCategories = () => {
    return categories.filter(cat => cat.category_type === 'legislation');
  };
  
  const getEventCategories = () => {
    return categories.filter(cat => cat.category_type === 'event');
  };
  
  const getNewsCategories = () => {
    return categories.filter(cat => cat.category_type === 'news');
  };
  
  const getDocumentCategories = () => {
    return categories.filter(cat => cat.category_type === 'document');
  };
  
  const CategoryTable = ({ categoryType, title, items }: { categoryType: string, title: string, items: CategoryParams[] }) => (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
        <h4 className="font-medium">{title}</h4>
        <Button
          variant="outline"
          size="sm"
          onClick={() => {
            setCategoryFormData({
              ...categoryFormData,
              category_type: categoryType
            });
            openAddCategoryDialog();
          }}
        >
          <Plus className="h-4 w-4 mr-1" /> Adicionar
        </Button>
      </CardHeader>
      <CardContent>
        {items.length > 0 ? (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>Descrição</TableHead>
                <TableHead className="w-[120px] text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {items.map((category) => (
                <TableRow key={category.id}>
                  <TableCell>{category.name}</TableCell>
                  <TableCell>{category.description || '-'}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditCategoryDialog(category)}
                      className="mr-1"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openDeleteCategoryDialog(category)}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        ) : (
          <div className="text-center p-4 text-gray-500">
            Nenhuma categoria cadastrada
          </div>
        )}
      </CardContent>
    </Card>
  );

  return (
    <AdminLayout title="Gerenciar Legislação e Categorias">
      <Tabs defaultValue="legislation" className="space-y-4">
        <TabsList>
          <TabsTrigger value="legislation">Legislação e Direitos</TabsTrigger>
          <TabsTrigger value="categories">Categorias</TabsTrigger>
        </TabsList>
        
        <TabsContent value="legislation">
          <div className="mb-4 flex justify-between items-center">
            <p className="text-gray-600">
              Gerencie os itens de legislação que serão exibidos na página de Legislação e Direitos.
            </p>
            <Button onClick={openAddDialog}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Item
            </Button>
          </div>

          {loading ? (
            <div className="text-center py-8">
              <p>Carregando itens...</p>
            </div>
          ) : legislationItems.length > 0 ? (
            <div className="rounded-lg border bg-white shadow-sm">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Link</TableHead>
                    <TableHead>Categoria</TableHead>
                    <TableHead className="w-[120px] text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {legislationItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.title}</TableCell>
                      <TableCell>
                        <a 
                          href={item.url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                          className="flex items-center text-blue-500 hover:underline"
                        >
                          {item.url.length > 30 ? item.url.substring(0, 30) + '...' : item.url}
                          <ExternalLink className="ml-1 h-3 w-3" />
                        </a>
                      </TableCell>
                      <TableCell>{item.category}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openEditDialog(item)}
                          className="mr-1"
                        >
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => openDeleteDialog(item)}
                        >
                          <Trash2 className="h-4 w-4 text-red-500" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
              <p>Não há itens de legislação cadastrados.</p>
              <Button 
                onClick={openAddDialog}
                variant="outline" 
                className="mt-4"
              >
                <Plus className="mr-2 h-4 w-4" /> Cadastrar Primeiro Item
              </Button>
            </div>
          )}
        </TabsContent>
        
        <TabsContent value="categories">
          <div className="mb-4">
            <p className="text-gray-600 mb-4">
              Configure as categorias disponíveis para classificar itens de legislação, eventos, notícias e documentos.
            </p>
            
            <div className="grid gap-6 md:grid-cols-2">
              <CategoryTable 
                categoryType="legislation" 
                title="Categorias de Legislação" 
                items={getLegislationCategories()} 
              />
              <CategoryTable 
                categoryType="event" 
                title="Tipos de Eventos" 
                items={getEventCategories()} 
              />
              <CategoryTable 
                categoryType="news" 
                title="Categorias de Notícias" 
                items={getNewsCategories()} 
              />
              <CategoryTable 
                categoryType="document" 
                title="Tipos de Documentos" 
                items={getDocumentCategories()} 
              />
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Add Legislation Item Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Item de Legislação</DialogTitle>
            <DialogDescription>
              Adicione um novo item de legislação ou direito que será exibido na página.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="title">Título</Label>
                <Input
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  placeholder="Ex: Lei Federal 12.030/2009"
                  required
                />
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="url">Link do Documento</Label>
                <Input
                  id="url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  placeholder="https://exemplo.gov.br/arquivo.pdf"
                  required
                />
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLegislationCategories().map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Breve descrição do documento"
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Adicionar Item</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Legislation Item Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Item de Legislação</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="edit-title">Título</Label>
                <Input
                  id="edit-title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="edit-url">Link do Documento</Label>
                <Input
                  id="edit-url"
                  name="url"
                  type="url"
                  value={formData.url}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="edit-category">Categoria</Label>
                <Select value={formData.category} onValueChange={handleSelectChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {getLegislationCategories().map((category) => (
                      <SelectItem key={category.id} value={category.name}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="edit-description">Descrição (Opcional)</Label>
                <Textarea
                  id="edit-description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  rows={3}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Legislation Item Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Item</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este item? Esta ação não pode ser desfeita.
              {currentItem && (
                <p className="mt-2 font-medium">{currentItem.title}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Add Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Adicionar Categoria</DialogTitle>
            <DialogDescription>
              Adicione uma nova categoria para classificar itens no sistema.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCategorySubmit}>
            <div className="grid gap-4 py-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="category_type">Tipo de Categoria</Label>
                <Select value={categoryFormData.category_type} onValueChange={handleCategoryTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legislation">Legislação</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="news">Notícia</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="name">Nome da Categoria</Label>
                <Input
                  id="name"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  placeholder="Ex: Legislação Federal"
                  required
                />
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="c-description">Descrição (Opcional)</Label>
                <Textarea
                  id="c-description"
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  placeholder="Descrição breve da categoria"
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Adicionar Categoria</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Edit Category Dialog */}
      <Dialog open={isEditCategoryDialogOpen} onOpenChange={setIsEditCategoryDialogOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>Editar Categoria</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCategoryUpdate}>
            <div className="grid gap-4 py-4">
              <div className="grid w-full gap-2">
                <Label htmlFor="edit-category_type">Tipo de Categoria</Label>
                <Select value={categoryFormData.category_type} onValueChange={handleCategoryTypeChange}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="legislation">Legislação</SelectItem>
                    <SelectItem value="event">Evento</SelectItem>
                    <SelectItem value="news">Notícia</SelectItem>
                    <SelectItem value="document">Documento</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="edit-name">Nome da Categoria</Label>
                <Input
                  id="edit-name"
                  name="name"
                  value={categoryFormData.name}
                  onChange={handleCategoryInputChange}
                  required
                />
              </div>
              <div className="grid w-full gap-2">
                <Label htmlFor="edit-c-description">Descrição (Opcional)</Label>
                <Textarea
                  id="edit-c-description"
                  name="description"
                  value={categoryFormData.description}
                  onChange={handleCategoryInputChange}
                  rows={2}
                />
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">Cancelar</Button>
              </DialogClose>
              <Button type="submit">Salvar Alterações</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      
      {/* Delete Category Dialog */}
      <AlertDialog open={isDeleteCategoryDialogOpen} onOpenChange={setIsDeleteCategoryDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Categoria</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir esta categoria? Esta ação não pode ser desfeita.
              {currentCategory && (
                <p className="mt-2 font-medium">{currentCategory.name}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleCategoryDelete}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
};

export default AdminLegislationPage;
