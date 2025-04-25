
import { useState } from 'react';
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
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { FileText, Upload, Clock, X } from 'lucide-react';

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

const UploadDialog = ({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [filePreview, setFilePreview] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('');
  const [recipientType, setRecipientType] = useState('all'); // 'all', 'specialty', 'individual'
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>('');
  const { toast } = useToast();

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!file || !title || !category) {
      toast({
        title: 'Campos obrigatórios',
        description: 'Por favor, preencha todos os campos obrigatórios e selecione um arquivo.',
        variant: 'destructive',
      });
      return;
    }
    
    setIsUploading(true);
    
    try {
      // Upload file to Supabase Storage
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = `documents/${fileName}`;
      
      const { error: storageError } = await supabase.storage
        .from('documents')
        .upload(filePath, file);
      
      if (storageError) throw storageError;
      
      // Get the public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(filePath);
      
      // Save document metadata to database
      const { data: documentData, error: dbError } = await supabase
        .from('documents')
        .insert([
          {
            title,
            description,
            category,
            file_url: publicUrl,
            file_type: file.type,
            file_size: file.size,
          }
        ])
        .select()
        .single();
      
      if (dbError) throw dbError;

      // Handle recipients based on selected type
      if (recipientType === 'all') {
        // Send to all users - no filter needed
        await supabase
          .from('document_recipients')
          .insert([
            {
              document_id: documentData.id,
              recipient_type: 'all'
            }
          ]);
      } else if (recipientType === 'specialty' && selectedSpecialty) {
        // Send to specific specialty
        await supabase
          .from('document_recipients')
          .insert([
            {
              document_id: documentData.id,
              recipient_type: 'specialty',
              specialty: selectedSpecialty
            }
          ]);
      }
      // Note: individual recipients would be handled here if needed
      
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
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>Enviar Novo Documento</DialogTitle>
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
              </SelectContent>
            </Select>
          </div>
          
          {recipientType === 'specialty' && (
            <div className="space-y-2">
              <Label htmlFor="specialty">Especialidade *</Label>
              <Select value={selectedSpecialty} onValueChange={setSelectedSpecialty}>
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
          
          <div className="space-y-2">
            <Label htmlFor="file">Arquivo PDF *</Label>
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
              ) : 'Enviar Documento'}
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

  // Fetch documents on mount
  useState(() => {
    fetchDocuments();
  });

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
    <AdminLayout title="Gerenciamento de Documentos">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Gerencie os documentos disponibilizados aos associados.
          </p>
          
          <Button onClick={() => setIsDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Enviar Documento
          </Button>
        </div>
        
        {loading ? (
          <div className="text-center py-8">
            <p>Carregando documentos...</p>
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
                      <span>Tamanho: {formatFileSize(document.file_size)}</span>
                      <span>•</span>
                      <span>Enviado em: {formatDate(document.created_at)}</span>
                    </div>
                  </div>
                  
                  <div className="mt-3 sm:mt-0 flex items-center space-x-2">
                    <a
                      href={document.file_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sindmoba-primary hover:text-sindmoba-secondary text-sm"
                    >
                      Visualizar
                    </a>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
            <FileText className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-lg font-medium text-gray-900">Nenhum documento</h3>
            <p className="mt-1 text-sm text-gray-500">
              Não há documentos disponíveis. Comece enviando um novo documento.
            </p>
            <div className="mt-6">
              <Button onClick={() => setIsDialogOpen(true)}>
                <Upload className="mr-2 h-4 w-4" />
                Enviar Documento
              </Button>
            </div>
          </div>
        )}
      </div>
      
      <UploadDialog
        open={isDialogOpen}
        onOpenChange={setIsDialogOpen}
        onUploadSuccess={fetchDocuments}
      />
    </AdminLayout>
  );
};

export default AdminDocumentsPage;
