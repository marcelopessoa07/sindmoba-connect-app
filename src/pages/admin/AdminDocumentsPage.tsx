
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog';
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
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Clock, X, Eye, Download, Trash2, Check, Search, MessageSquare } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';
import { 
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage 
} from '@/components/ui/form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { useForm } from 'react-hook-form';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

type SpecialtyType = Database["public"]["Enums"]["specialty_type"];

const fileCategories = [
  { value: 'estatuto', label: 'Estatuto do SINDMOBA' },
  { value: 'atas', label: 'Atas de assembleias' },
  { value: 'convenios', label: 'Convênios e acordos coletivos' },
  { value: 'comunicados', label: 'Comunicados oficiais' },
  { value: 'outros', label: 'Outros documentos' }
];

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

type UserProfile = {
  id: string;
  full_name: string | null;
  email: string;
  specialty: string | null;
};

const UploadDialog = ({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [recipientType, setRecipientType] = useState('all'); // 'all', 'specialty', 'individual'
  const [selectedSpecialty, setSelectedSpecialty] = useState<SpecialtyType | ''>('');
  const [userProfiles, setUserProfiles] = useState<UserProfile[]>([]);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch users when recipientType is set to 'individual'
  useEffect(() => {
    if (recipientType === 'individual') {
      fetchUserProfiles();
    }
  }, [recipientType]);

  const fetchUserProfiles = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, specialty')
        .order('full_name');
      
      if (error) {
        throw error;
      }
      
      setUserProfiles(data || []);
    } catch (error) {
      console.error('Error fetching user profiles:', error);
      toast({
        title: 'Erro ao carregar usuários',
        description: 'Não foi possível obter a lista de usuários.',
        variant: 'destructive',
      });
    }
  };

  const filteredUsers = searchTerm 
    ? userProfiles.filter(user => 
        (user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
         user.email.toLowerCase().includes(searchTerm.toLowerCase())))
    : userProfiles;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      
      // Check if file is PDF
      if (selectedFile.type !== 'application/pdf') {
        toast({
          title: 'Formato inválido',
          description: 'Por favor, selecione um arquivo PDF.',
          variant: 'destructive',
        });
        return;
      }
      
      // Check file size (max 10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast({
          title: 'Arquivo muito grande',
          description: 'O tamanho máximo permitido é 10MB.',
          variant: 'destructive',
        });
        return;
      }
      
      setFile(selectedFile);
      setFilePreview(selectedFile.name);
    }
  };

  const clearFile = () => {
    setFile(null);
    setFilePreview('');
  };

  const toggleUserSelection = (userId: string) => {
    if (selectedUserIds.includes(userId)) {
      setSelectedUserIds(selectedUserIds.filter(id => id !== userId));
    } else {
      setSelectedUserIds([...selectedUserIds, userId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios.',
        variant: 'destructive',
      });
      return;
    }

    if (recipientType === 'individual' && selectedUserIds.length === 0) {
      toast({
        title: 'Nenhum destinatário selecionado',
        description: 'Por favor, selecione pelo menos um usuário como destinatário.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      let filePath = '';
      let fileSize = 0;
      let fileType = '';
      let publicUrl = '';
      
      // Upload file to Supabase Storage if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
        filePath = `documents/${fileName}`;
        
        const { error: storageError } = await supabase.storage
          .from('documents')
          .upload(filePath, file);
        
        if (storageError) throw storageError;
        
        // Get the public URL
        const { data: { publicUrl: uploadedUrl } } = supabase.storage
          .from('documents')
          .getPublicUrl(filePath);
          
        publicUrl = uploadedUrl;
        fileSize = file.size;
        fileType = file.type;
      }
      
      // Save document metadata to database
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            title,
            description,
            category,
            file_url: file ? publicUrl : '',
            file_type: file ? fileType : '',
            file_size: file ? fileSize : 0,
          }
        ])
        .select()
        .single();
      
      if (dbError) throw dbError;

      // Handle recipients based on selected type
      if (recipientType === 'all') {
        // Send to all users - no filter needed
        const { error } = await supabase
          .from('document_recipients')
          .insert({
            document_id: documentData.id,
            recipient_type: 'all'
          });
          
        if (error) throw error;
      } else if (recipientType === 'specialty' && selectedSpecialty) {
        // Send to specific specialty
        const { error } = await supabase
          .from('document_recipients')
          .insert({
            document_id: documentData.id,
            recipient_type: 'specialty',
            specialty: selectedSpecialty
          });
          
        if (error) throw error;
      } else if (recipientType === 'individual' && selectedUserIds.length > 0) {
        // Send to individual users
        const recipientInserts = selectedUserIds.map(userId => ({
          document_id: documentData.id,
          recipient_type: 'individual',
          recipient_id: userId
        }));
        
        const { error } = await supabase
          .from('document_recipients')
          .insert(recipientInserts);
          
        if (error) throw error;
      }
      
      toast({
        title: 'Documento enviado',
        description: 'O documento foi enviado com sucesso.',
      });
      
      onOpenChange(false);
      onUploadSuccess();
      
      // Reset form
      setFile(null);
      setFilePreview('');
      setTitle('');
      setDescription('');
      setCategory('');
      setRecipientType('all');
      setSelectedSpecialty('');
      setSelectedUserIds([]);
      setSearchTerm('');
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Erro no envio',
        description: 'Não foi possível enviar o documento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-auto">
        <DialogHeader>
          <DialogTitle>Enviar Nova Comunicação</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título do documento *</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do documento"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma breve descrição do documento"
              className="min-h-[100px]"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {fileCategories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="recipientType">Destinatários *</Label>
            <Select value={recipientType} onValueChange={setRecipientType}>
              <SelectTrigger id="recipientType">
                <SelectValue placeholder="Selecione os destinatários" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os associados</SelectItem>
                <SelectItem value="specialty">Por especialidade</SelectItem>
                <SelectItem value="individual">Usuários específicos</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          {recipientType === 'specialty' && (
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade *</Label>
              <Select 
                value={selectedSpecialty} 
                onValueChange={(value: string) => {
                  if (value === 'pml' || value === 'pol') {
                    setSelectedSpecialty(value);
                  }
                }}
              >
                <SelectTrigger id="specialty">
                  <SelectValue placeholder="Selecione a especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pml">Peritos Médicos Legais (PML)</SelectItem>
                  <SelectItem value="pol">Peritos Odonto Legais (POL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}
          
          {recipientType === 'individual' && (
            <div className="space-y-2 border rounded-md p-4">
              <Label htmlFor="user-search">Selecione os usuários</Label>
              <div className="flex items-center space-x-2 mb-2">
                <Search className="h-4 w-4 text-gray-500" />
                <Input
                  id="user-search"
                  placeholder="Buscar por nome ou email"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="text-sm text-muted-foreground mb-2">
                {selectedUserIds.length} usuário(s) selecionado(s)
              </div>
              
              <ScrollArea className="h-[200px] rounded-md border">
                {filteredUsers.length > 0 ? (
                  <div className="space-y-1 p-2">
                    {filteredUsers.map((user) => (
                      <div 
                        key={user.id}
                        className={`flex items-center justify-between p-2 rounded-md ${
                          selectedUserIds.includes(user.id) ? 'bg-muted' : 'hover:bg-muted/50'
                        }`}
                        onClick={() => toggleUserSelection(user.id)}
                      >
                        <div className="flex-1">
                          <div className="font-medium">{user.full_name || 'Sem nome'}</div>
                          <div className="text-xs text-muted-foreground">{user.email}</div>
                          {user.specialty && (
                            <div className="text-xs text-muted-foreground">
                              Especialidade: {user.specialty === 'pml' ? 'PML' : 'POL'}
                            </div>
                          )}
                        </div>
                        <Checkbox 
                          checked={selectedUserIds.includes(user.id)}
                          onCheckedChange={() => toggleUserSelection(user.id)}
                        />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-muted-foreground p-4">
                    Nenhum usuário encontrado
                  </div>
                )}
              </ScrollArea>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo PDF</Label>
            {!filePreview ? (
              <div className="flex items-center justify-center border-2 border-dashed border-gray-300 rounded-md h-32">
                <div className="space-y-1 text-center">
                  <Upload className="mx-auto h-8 w-8 text-gray-400" />
                  <div className="text-sm text-gray-600">
                    Clique para selecionar um arquivo PDF
                  </div>
                  <div className="text-xs text-gray-500">
                    Tamanho máximo: 10MB
                  </div>
                  <input
                    id="file"
                    type="file"
                    className="hidden"
                    accept="application/pdf"
                    onChange={handleFileChange}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="mt-2"
                    onClick={() => document.getElementById('file')?.click()}
                  >
                    Selecionar arquivo
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between border rounded-md p-3">
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-sindmoba-primary" />
                  <span className="text-sm truncate max-w-[350px]">{filePreview}</span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={clearFile}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isUploading}>
              {isUploading ? (
                <>
                  <Clock className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : 'Enviar Comunicação'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const AdminDocumentsPage = () => {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [documents, setDocuments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDocument, setSelectedDocument] = useState<any>(null);
  const [documentUrl, setDocumentUrl] = useState('');
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<any>(null);
  const { toast } = useToast();

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
        description: 'Não foi possível carregar a lista de documentos.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDocuments();
  }, []);

  const viewDocument = async (document: any) => {
    try {
      setSelectedDocument(document);
      
      if (document.file_url) {
        // Generate a temporary URL for file viewing/downloading
        const fileUrl = document.file_url.replace('https://agennmpmizazbapvqkqq.supabase.co/storage/v1/object/public/documents/', '');
        const { data, error } = await supabase
          .storage
          .from('documents')
          .createSignedUrl(fileUrl, 60);
        
        if (error) {
          throw error;
        }
        
        setDocumentUrl(data?.signedUrl || document.file_url);
      } else {
        setDocumentUrl('');
      }
      
      setIsPreviewDialogOpen(true);
    } catch (error) {
      console.error('Error generating document URL:', error);
      toast({
        title: 'Erro ao gerar URL do documento',
        description: 'Não foi possível visualizar o documento.',
        variant: 'destructive',
      });
    }
  };

  const openDeleteDialog = (document: any) => {
    setDocumentToDelete(document);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteDocument = async () => {
    if (!documentToDelete) return;

    try {
      // If there's a file, delete it from storage
      if (documentToDelete.file_url) {
        const fileUrl = documentToDelete.file_url.replace('https://agennmpmizazbapvqkqq.supabase.co/storage/v1/object/public/documents/', '');
        
        const { error: storageError } = await supabase
          .storage
          .from('documents')
          .remove([fileUrl]);
        
        if (storageError) {
          console.error('Error deleting file from storage:', storageError);
          // Continue with deleting the record even if file deletion fails
        }
      }

      // Delete related records in document_recipients
      const { error: recipientsError } = await supabase
        .from('document_recipients')
        .delete()
        .eq('document_id', documentToDelete.id);
      
      if (recipientsError) {
        console.error('Error deleting document recipients:', recipientsError);
      }

      // Delete the document record
      const { error } = await supabase
        .from('documents')
        .delete()
        .eq('id', documentToDelete.id);

      if (error) {
        throw error;
      }

      // Update the local state
      setDocuments(documents.filter(doc => doc.id !== documentToDelete.id));
      
      toast({
        title: 'Documento excluído',
        description: 'O documento foi excluído com sucesso.',
      });

      // Close the dialogs if they're open
      setIsDeleteDialogOpen(false);
      if (selectedDocument && selectedDocument.id === documentToDelete.id) {
        setIsPreviewDialogOpen(false);
      }
      
    } catch (error) {
      console.error('Error deleting document:', error);
      toast({
        title: 'Erro ao excluir documento',
        description: 'Não foi possível excluir o documento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const getCategoryLabel = (categoryValue: string) => {
    const category = fileCategories.find(cat => cat.value === categoryValue);
    return category ? category.label : categoryValue;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' bytes';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  };

  return (
    <AdminLayout title="Gerenciamento de Comunicações e Documentos">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Gerencie as comunicações e documentos disponibilizados aos associados.
          </p>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Enviar Comunicação
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando comunicações e documentos...</p>
          </div>
        ) : documents.length > 0 ? (
          <div className="space-y-4">
            {documents.map((document) => (
              <div
                key={document.id}
                className="border rounded-lg bg-white shadow-sm p-4"
              >
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                  <div className="space-y-1">
                    <h3 className="font-medium">{document.title}</h3>
                    {document.description && (
                      <p className="text-sm text-gray-600">{document.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2 text-xs text-gray-500">
                      <span>Categoria: {getCategoryLabel(document.category)}</span>
                      <span>•</span>
                      {document.file_size > 0 && (
                        <>
                          <span>Tamanho: {formatFileSize(document.file_size)}</span>
                          <span>•</span>
                        </>
                      )}
                      <span>Enviado em: {formatDate(document.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center"
                      onClick={() => viewDocument(document)}
                    >
                      <Eye className="mr-1 h-4 w-4" />
                      <span>Visualizar</span>
                    </Button>
                    
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="flex items-center text-red-500 hover:text-red-700"
                      onClick={() => openDeleteDialog(document)}
                    >
                      <Trash2 className="mr-1 h-4 w-4" />
                      <span>Excluir</span>
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
            <MessageSquare className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhuma comunicação</h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há comunicações ou documentos disponíveis. Comece enviando uma nova comunicação.
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Comunicação
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{selectedDocument?.title}</DialogTitle>
            {selectedDocument?.description && (
              <DialogDescription>{selectedDocument.description}</DialogDescription>
            )}
          </DialogHeader>
          
          <div className="mt-4">
            {selectedDocument && (
              <div className="flex flex-col items-center justify-center">
                {documentUrl && selectedDocument?.file_type?.includes('pdf') ? (
                  <iframe 
                    src={`${documentUrl}#toolbar=0`}
                    className="w-full h-[500px] border rounded"
                    title={selectedDocument?.title}
                  />
                ) : documentUrl ? (
                  <p className="mb-4 text-center">
                    Este tipo de arquivo não pode ser pré-visualizado.
                  </p>
                ) : (
                  <div className="text-center p-4">
                    <p className="mb-2">Este é um documento sem arquivo anexado.</p>
                    <p className="text-sm text-gray-500">
                      Contate o administrador para mais informações.
                    </p>
                  </div>
                )}
                
                {documentUrl && (
                  <Button asChild className="mt-4">
                    <a href={documentUrl} download={selectedDocument?.title} target="_blank" rel="noreferrer">
                      <Download className="mr-2 h-4 w-4" />
                      Baixar Arquivo
                    </a>
                  </Button>
                )}
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button 
              variant="destructive" 
              onClick={() => {
                setIsPreviewDialogOpen(false);
                openDeleteDialog(selectedDocument);
              }}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Excluir Documento
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir documento</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja excluir este documento? Esta ação não pode ser desfeita.
              {documentToDelete?.title && (
                <p className="mt-2 font-medium text-foreground">{documentToDelete.title}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDeleteDocument}
              className="bg-red-500 hover:bg-red-600"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      <UploadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUploadSuccess={fetchDocuments}
      />
    </AdminLayout>
  );
};

export default AdminDocumentsPage;
