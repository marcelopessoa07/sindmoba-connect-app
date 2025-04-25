
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
import { useToast } from '@/hooks/use-toast';
import { Eye, Pencil, Trash2, Plus, Upload, File } from 'lucide-react';

interface Document {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_type: string;
  file_size: number;
  category: string;
  created_at: string | null;
}

const AdminDocumentsPage = () => {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingDocument, setEditingDocument] = useState<Document | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
  });
  const { toast } = useToast();

  // Document categories
  const categories = [
    'Estatuto',
    'Atas de Assembleias',
    'Acordos Coletivos',
    'Comunicados Oficiais',
    'Legislação',
    'Formulários'
  ];

  useEffect(() => {
    fetchDocuments();
  }, []);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setDocuments(data || []);
    } catch (error) {
      console.error('Error fetching documents:', error);
      toast({
        title: 'Erro ao carregar documentos',
        description: 'Não foi possível carregar a lista de documentos. Tente novamente mais tarde.',
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

  const handleCategoryChange = (value: string) => {
    setFormData({
      ...formData,
      category: value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0]);
    }
  };

  const openAddDialog = () => {
    setEditingDocument(null);
    setFormData({
      title: '',
      description: '',
      category: '',
    });
    setFile(null);
    setIsDialogOpen(true);
  };

  const openEditDialog = (document: Document) => {
    setEditingDocument(document);
    setFormData({
      title: document.title,
      description: document.description || '',
      category: document.category,
    });
    setFile(null);
    setIsDialogOpen(true);
  };

  const openViewDialog = (document: Document) => {
    setViewingDocument(document);
    setIsViewDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingDocument && !file) {
      toast({
        title: 'Arquivo obrigatório',
        description: 'Por favor, selecione um arquivo para upload.',
        variant: 'destructive',
      });
      return;
    }
    
    try {
      setUploading(true);
      
      let fileUrl = editingDocument?.file_url || '';
      let fileType = editingDocument?.file_type || '';
      let fileSize = editingDocument?.file_size || 0;
      
      // Upload file if a new one is selected
      if (file) {
        const fileName = `${Date.now()}_${file.name}`;
        const { data: uploadData, error: uploadError } = await supabase
          .storage
          .from('documents')
          .upload(fileName, file);
        
        if (uploadError) throw uploadError;
        
        fileUrl = fileName;
        fileType = file.type;
        fileSize = file.size;
      }
      
      if (editingDocument) {
        // Update existing document
        const { error } = await supabase
          .from('documents')
          .update({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            ...(file ? { 
              file_url: fileUrl, 
              file_type: fileType, 
              file_size: fileSize 
            } : {}),
            updated_at: new Date().toISOString(),
          })
          .eq('id', editingDocument.id);

        if (error) throw error;
        toast({
          title: 'Documento atualizado',
          description: 'O documento foi atualizado com sucesso.',
        });
      } else {
        // Create new document
        const { error } = await supabase
          .from('documents')
          .insert({
            title: formData.title,
            description: formData.description || null,
            category: formData.category,
            file_url: fileUrl,
            file_type: fileType,
            file_size: fileSize,
            created_by: (await supabase.auth.getUser()).data.user?.id,
          });

        if (error) throw error;
        toast({
          title: 'Documento adicionado',
          description: 'O novo documento foi adicionado com sucesso.',
        });
      }

      setIsDialogOpen(false);
      fetchDocuments(); // Refresh the list
    } catch (error) {
      console.error('Error saving document:', error);
      toast({
        title: 'Erro ao salvar',
        description: 'Não foi possível salvar o documento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este documento?')) {
      try {
        const documentToDelete = documents.find(doc => doc.id === id);
        
        if (documentToDelete) {
          // Delete from storage first
          await supabase
            .storage
            .from('documents')
            .remove([documentToDelete.file_url]);
          
          // Then delete from database
          const { error } = await supabase
            .from('documents')
            .delete()
            .eq('id', id);

          if (error) throw error;
          
          // Remove document from state
          setDocuments(documents.filter(doc => doc.id !== id));
          
          toast({
            title: 'Documento excluído',
            description: 'O documento foi excluído com sucesso.',
          });
        }
      } catch (error) {
        console.error('Error deleting document:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir o documento. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  return (
    <AdminLayout title="Gerenciamento de Documentos">
      <div className="space-y-4">
        <div className="flex justify-between">
          <p className="text-gray-600">
            Gerencie os documentos disponíveis para os membros do sindicato.
          </p>
          <Button 
            onClick={openAddDialog}
            className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
          >
            <Plus className="h-4 w-4 mr-2" /> Adicionar Documento
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Carregando documentos...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[300px]">Título</TableHead>
                  <TableHead>Categoria</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Tamanho</TableHead>
                  <TableHead>Data</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {documents.map((document) => (
                  <TableRow key={document.id}>
                    <TableCell className="font-medium">{document.title}</TableCell>
                    <TableCell>{document.category}</TableCell>
                    <TableCell>{document.file_type}</TableCell>
                    <TableCell>{formatFileSize(document.file_size)}</TableCell>
                    <TableCell>
                      {document.created_at 
                        ? new Date(document.created_at).toLocaleDateString('pt-BR')
                        : 'N/A'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(document)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openEditDialog(document)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(document.id)}
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
            <p>Não há documentos cadastrados.</p>
            <Button 
              onClick={openAddDialog}
              variant="outline" 
              className="mt-4"
            >
              <Plus className="h-4 w-4 mr-2" /> Adicionar Primeiro Documento
            </Button>
          </div>
        )}
      </div>

      {/* Add/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>
              {editingDocument ? 'Editar Documento' : 'Adicionar Documento'}
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
                  placeholder="Digite o título do documento"
                  required
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="description">Descrição (Opcional)</Label>
                <Textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Descreva brevemente o conteúdo do documento"
                  className="min-h-[80px]"
                />
              </div>
              
              <div className="grid w-full gap-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={formData.category}
                  onValueChange={handleCategoryChange}
                  required
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
                <Label htmlFor="file">Arquivo {!editingDocument && '(Obrigatório)'}</Label>
                <div className="flex items-center">
                  <Input
                    id="file"
                    type="file"
                    onChange={handleFileChange}
                    className="hidden"
                  />
                  <div className="flex items-center w-full">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => document.getElementById('file')?.click()}
                      className="flex-shrink-0"
                    >
                      <Upload className="h-4 w-4 mr-2" /> Selecionar arquivo
                    </Button>
                    <span className="ml-3 text-sm text-gray-500">
                      {file ? file.name : editingDocument ? 'Manter arquivo atual' : 'Nenhum arquivo selecionado'}
                    </span>
                  </div>
                </div>
                {editingDocument && (
                  <p className="text-xs text-gray-500">
                    Arquivo atual: {editingDocument.file_url.split('_').slice(1).join('_')}
                  </p>
                )}
              </div>
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="outline">
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={uploading}>
                {uploading ? 'Enviando...' : editingDocument ? 'Atualizar' : 'Adicionar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* View Document Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Visualizar Documento</DialogTitle>
          </DialogHeader>
          {viewingDocument && (
            <div className="space-y-4 py-4">
              <div>
                <h3 className="font-semibold">Título</h3>
                <p>{viewingDocument.title}</p>
              </div>
              {viewingDocument.description && (
                <div>
                  <h3 className="font-semibold">Descrição</h3>
                  <p>{viewingDocument.description}</p>
                </div>
              )}
              <div>
                <h3 className="font-semibold">Categoria</h3>
                <p>{viewingDocument.category}</p>
              </div>
              <div>
                <h3 className="font-semibold">Arquivo</h3>
                <div className="flex items-center mt-2">
                  <File className="h-5 w-5 mr-2 text-sindmoba-primary" />
                  <span>{viewingDocument.file_url.split('_').slice(1).join('_')} ({formatFileSize(viewingDocument.file_size)})</span>
                </div>
              </div>
              <div className="flex justify-center mt-4">
                <Button asChild>
                  <a 
                    href={`${supabase.storage.from('documents').getPublicUrl(viewingDocument.file_url).data.publicUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Abrir Documento
                  </a>
                </Button>
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

export default AdminDocumentsPage;
