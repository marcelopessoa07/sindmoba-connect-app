
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
import { Library, Pencil, Trash2, Plus, Search } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

const AdminLibraryPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // Mock data - in a real app, this would come from your database
  const [items, setItems] = useState([
    {
      id: '1',
      title: 'Medicina Legal e Antropologia Forense',
      author: 'Genival Veloso de França',
      type: 'Livro',
      year: '2022',
      category: 'Medicina Legal',
      description: 'Obra de referência em medicina legal, com abordagem completa de temas essenciais para peritos.',
      link: 'https://exemplo.com/livro-medicina-legal'
    },
    {
      id: '2',
      title: 'Revista Brasileira de Odontologia Legal',
      author: 'Associação Brasileira de Odontologia Legal',
      type: 'Periódico',
      year: '2023',
      category: 'Odontologia Legal',
      description: 'Publicação científica com os mais recentes estudos em odontologia legal e forense.',
      link: 'https://exemplo.com/revista-odontologia'
    },
    {
      id: '3',
      title: 'Traumatologia Forense: Princípios e Práticas',
      author: 'Eduardo R. Alves',
      type: 'Livro',
      year: '2021',
      category: 'Traumatologia',
      description: 'Manual completo sobre traumatologia forense, com casos e aplicações práticas.',
      link: 'https://exemplo.com/traumatologia-forense'
    }
  ]);
  
  const filteredItems = items.filter(item => 
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.author.toLowerCase().includes(searchTerm.toLowerCase()) || 
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const openAddDialog = () => {
    setCurrentItem(null);
    setIsDialogOpen(true);
  };
  
  const openEditDialog = (item: any) => {
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
      author: formData.get('author') as string,
      type: formData.get('type') as string,
      year: formData.get('year') as string,
      category: formData.get('category') as string,
      description: formData.get('description') as string,
      link: formData.get('link') as string
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
    <AdminLayout title="Gerenciamento da Biblioteca">
      <div className="mb-6 flex justify-between items-center">
        <div>
          <p className="text-gray-600">
            Gerencie o acervo bibliográfico do SINDMOBA, incluindo livros, periódicos e artigos.
          </p>
        </div>
        <Button onClick={openAddDialog} className="gap-1">
          <Plus size={16} />
          Novo Item
        </Button>
      </div>
      
      <div className="mb-6 flex">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
          <Input
            placeholder="Buscar por título, autor ou categoria..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>
      
      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Título</TableHead>
              <TableHead>Autor</TableHead>
              <TableHead>Tipo</TableHead>
              <TableHead>Categoria</TableHead>
              <TableHead className="w-[100px]">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.length > 0 ? filteredItems.map(item => (
              <TableRow key={item.id}>
                <TableCell className="font-medium">{item.title}</TableCell>
                <TableCell>{item.author}</TableCell>
                <TableCell>{item.type}</TableCell>
                <TableCell>{item.category}</TableCell>
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
                <TableCell colSpan={5} className="text-center py-6">
                  <div className="flex flex-col items-center text-gray-500">
                    <Library size={32} strokeWidth={1} className="mb-2" />
                    {searchTerm ? (
                      <p>Nenhum item encontrado para sua busca.</p>
                    ) : (
                      <>
                        <p>Nenhum item cadastrado</p>
                        <p className="text-sm">Utilize o botão acima para adicionar novos itens.</p>
                      </>
                    )}
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
              {currentItem ? 'Editar' : 'Adicionar'} Item Bibliográfico
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
                <label htmlFor="author" className="text-sm font-medium">
                  Autor
                </label>
                <Input 
                  id="author" 
                  name="author" 
                  defaultValue={currentItem?.author || ''}
                  required 
                />
              </div>
              
              <div className="grid gap-2">
                <label htmlFor="type" className="text-sm font-medium">
                  Tipo
                </label>
                <Select name="type" defaultValue={currentItem?.type || 'Livro'}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o tipo" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Livro">Livro</SelectItem>
                    <SelectItem value="Periódico">Periódico</SelectItem>
                    <SelectItem value="Artigo">Artigo</SelectItem>
                    <SelectItem value="Tese">Tese</SelectItem>
                    <SelectItem value="Manual">Manual</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <label htmlFor="year" className="text-sm font-medium">
                    Ano
                  </label>
                  <Input 
                    id="year" 
                    name="year" 
                    defaultValue={currentItem?.year || new Date().getFullYear().toString()}
                    required 
                  />
                </div>
                
                <div className="grid gap-2">
                  <label htmlFor="category" className="text-sm font-medium">
                    Categoria
                  </label>
                  <Input 
                    id="category" 
                    name="category" 
                    defaultValue={currentItem?.category || ''}
                    required 
                  />
                </div>
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
              
              <div className="grid gap-2">
                <label htmlFor="description" className="text-sm font-medium">
                  Descrição
                </label>
                <Textarea 
                  id="description" 
                  name="description" 
                  defaultValue={currentItem?.description || ''}
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

export default AdminLibraryPage;
