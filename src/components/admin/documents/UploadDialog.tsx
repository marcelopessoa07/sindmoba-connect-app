
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { FileText, Upload, Clock, X, Search } from 'lucide-react';
import { Database } from '@/integrations/supabase/types';

type SpecialtyType = Database["public"]["Enums"]["specialty_type"];

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

const fileCategories = [
  { value: 'estatuto', label: 'Estatuto do SINDMOBA' },
  { value: 'atas', label: 'Atas de assembleias' },
  { value: 'convenios', label: 'Convênios e acordos coletivos' },
  { value: 'comunicados', label: 'Comunicados oficiais' },
  { value: 'outros', label: 'Outros documentos' }
];

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

export default UploadDialog;
export { fileCategories };
