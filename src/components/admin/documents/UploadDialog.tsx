
import { useState, FormEvent, useEffect } from 'react';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogDescription,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from '@/components/ui/select';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { fileCategories, recipientTypes, specialtyOptions } from './documentUtils';
import { 
  Users,
  Trash2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

// Create a File interface that extends the standard File with an id property
interface ExtendedFile extends File {
  id?: string;
}

interface UserOption {
  id: string;
  email: string;
  name?: string;
}

const UploadDialog = ({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<ExtendedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('comunicados');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const [users, setUsers] = useState<UserOption[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<UserOption[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const { toast } = useToast();

  // Fetch users for specific selection
  useEffect(() => {
    if (recipientType === 'specific') {
      fetchUsers();
    }
  }, [recipientType]);

  const fetchUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .order('email');
        
      if (error) {
        throw error;
      }
      
      setUsers(data.map(user => ({
        id: user.id,
        email: user.email || '',
        name: user.full_name
      })));
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar a lista de usuários',
        variant: 'destructive',
      });
    }
  };

  const handleUserSelect = (user: UserOption) => {
    if (!selectedUsers.some(u => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
    }
    setSearchTerm('');
  };

  const removeUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter(user => user.id !== userId));
  };

  const filteredUsers = users.filter(user => 
    !selectedUsers.some(u => u.id === user.id) && 
    (user.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (user.name && user.name.toLowerCase().includes(searchTerm.toLowerCase())))
  ).slice(0, 5);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    
    if (!title.trim()) {
      toast({
        title: 'Título obrigatório',
        description: 'Por favor, informe um título para o documento.',
        variant: 'destructive',
      });
      return;
    }

    if (recipientType === 'specific' && selectedUsers.length === 0) {
      toast({
        title: 'Selecione pelo menos um usuário',
        description: 'Por favor, selecione pelo menos um usuário para receber o documento.',
        variant: 'destructive',
      });
      return;
    }

    try {
      setUploading(true);
      
      let fileUrl = '';
      let fileType = '';
      let fileSize = 0;
      
      // Upload the file if provided
      if (file) {
        const fileName = `${Date.now()}_${file.name.replace(/\s+/g, '_')}`;
        fileType = file.type;
        fileSize = file.size;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('documents')
          .upload(`public/${fileName}`, file);
          
        if (uploadError) {
          throw uploadError;
        }
        
        console.log('File uploaded:', uploadData);
        
        // Get the public URL
        const { data: publicUrlData } = supabase.storage
          .from('documents')
          .getPublicUrl(`public/${fileName}`);
          
        fileUrl = publicUrlData.publicUrl;
        console.log('File URL:', fileUrl);
      }
      
      // Insert document in the database
      const { data: document, error: insertError } = await supabase
        .from('documents')
        .insert({
          title,
          description,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          category,
          created_by: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();
        
      if (insertError) {
        throw insertError;
      }
      
      console.log('Document created:', document);
      
      // Handle recipient settings
      if (recipientType === 'all') {
        console.log('Adding document recipient: all users');
        const { error: recipientError } = await supabase
          .from('document_recipients')
          .insert({
            document_id: document.id,
            recipient_type: 'all'
          });
          
        if (recipientError) {
          console.error('Error setting document recipient (all):', recipientError);
          throw recipientError;
        }
      } else if (recipientType === 'specialty' && selectedSpecialty) {
        // Make sure selectedSpecialty is one of the allowed values
        const validSpecialty = specialtyOptions.find(opt => opt.id === selectedSpecialty);
        if (validSpecialty) {
          console.log('Adding document recipient: specialty', selectedSpecialty);
          const { error: recipientError } = await supabase
            .from('document_recipients')
            .insert({
              document_id: document.id,
              recipient_type: 'specialty',
              specialty: selectedSpecialty as "pml" | "pol" // Type assertion since we validated above
            });
            
          if (recipientError) {
            console.error('Error setting document recipient (specialty):', recipientError);
            throw recipientError;
          }
        }
      } else if (recipientType === 'specific' && selectedUsers.length > 0) {
        // Insert specific users as recipients
        console.log('Adding document recipients: specific users', selectedUsers.length);
        const recipientsData = selectedUsers.map(user => ({
          document_id: document.id,
          recipient_type: 'specific',
          recipient_id: user.id
        }));
        
        const { error: recipientError } = await supabase
          .from('document_recipients')
          .insert(recipientsData);
          
        if (recipientError) {
          console.error('Error setting document recipients (specific):', recipientError);
          throw recipientError;
        }
      }
      
      toast({
        title: 'Documento enviado',
        description: 'O documento foi enviado com sucesso.',
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setFile(null);
      setCategory('comunicados');
      setRecipientType('all');
      setSelectedSpecialty(null);
      setSelectedUsers([]);
      
      // Close dialog and refresh document list
      onOpenChange(false);
      onUploadSuccess();
      
    } catch (error) {
      console.error('Error uploading document:', error);
      toast({
        title: 'Erro ao enviar documento',
        description: 'Não foi possível enviar o documento. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  // This function properly handles the file data from FileUploader
  const handleFileChange = (fileData: File | null) => {
    console.log('File selected:', fileData);
    setFile(fileData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Enviar Nova Comunicação</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para enviar um novo documento ou comunicação aos associados.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left column */}
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Título da comunicação *</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Digite o título do documento"
                  required
                />
              </div>
              
              <div>
                <Label htmlFor="description">Descrição (opcional)</Label>
                <Textarea
                  id="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Digite uma breve descrição do documento"
                  rows={2}
                />
              </div>
              
              <div>
                <Label>Categoria</Label>
                <Select value={category} onValueChange={(value) => setCategory(value)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria" />
                  </SelectTrigger>
                  <SelectContent>
                    {fileCategories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>{cat.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            {/* Right column */}
            <div className="space-y-4">
              <div>
                <Label>Arquivo (opcional)</Label>
                <div>
                  <Button
                    type="button"
                    variant="outline"
                    className={`w-full relative ${uploading ? 'opacity-50' : ''}`}
                    disabled={uploading}
                  >
                    {uploading ? 'Enviando...' : 'Selecionar arquivo'}
                    <input
                      type="file"
                      onChange={(e) => handleFileChange(e.target.files?.[0] || null)}
                      disabled={uploading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                  </Button>
                  <p className="text-xs text-gray-500 mt-1">
                    PDFs, documentos, imagens (máx. 10MB)
                  </p>
                </div>
                {file && (
                  <p className="text-sm text-gray-500 mt-1">
                    Arquivo: {file.name} ({Math.round(file.size / 1024)} KB)
                  </p>
                )}
              </div>
              
              <Accordion type="single" collapsible defaultValue="recipients">
                <AccordionItem value="recipients">
                  <AccordionTrigger>Destinatários</AccordionTrigger>
                  <AccordionContent>
                    <div className="space-y-3">
                      <div>
                        <Label>Enviar para</Label>
                        <Select value={recipientType} onValueChange={(value) => {
                          setRecipientType(value);
                          if (value !== 'specialty') setSelectedSpecialty(null);
                          if (value !== 'specific') setSelectedUsers([]);
                        }}>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione o tipo de destinatário" />
                          </SelectTrigger>
                          <SelectContent>
                            {recipientTypes.map((type) => (
                              <SelectItem key={type.id} value={type.id}>{type.label}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      {recipientType === 'specialty' && (
                        <div>
                          <Label>Especialidade</Label>
                          <Select 
                            value={selectedSpecialty || ''} 
                            onValueChange={(value) => setSelectedSpecialty(value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a especialidade" />
                            </SelectTrigger>
                            <SelectContent>
                              {specialtyOptions.map(option => (
                                <SelectItem key={option.id} value={option.id}>{option.label}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                      
                      {recipientType === 'specific' && (
                        <div className="space-y-3">
                          <div>
                            <Label>Buscar usuários</Label>
                            <div className="flex gap-2">
                              <Input
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                placeholder="Digite o email ou nome"
                                className="flex-1"
                              />
                              <Button type="button" variant="outline" size="icon" onClick={fetchUsers}>
                                <Users className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                          
                          {searchTerm && (
                            <ul className="mt-1 border rounded-md divide-y max-h-40 overflow-y-auto">
                              {filteredUsers.length > 0 ? (
                                filteredUsers.map(user => (
                                  <li 
                                    key={user.id}
                                    onClick={() => handleUserSelect(user)}
                                    className="p-2 hover:bg-gray-100 cursor-pointer"
                                  >
                                    <p className="text-sm font-medium">{user.email}</p>
                                    {user.name && <p className="text-xs text-gray-500">{user.name}</p>}
                                  </li>
                                ))
                              ) : (
                                <li className="p-2 text-sm text-gray-500">Nenhum usuário encontrado</li>
                              )}
                            </ul>
                          )}
                          
                          <div className="mt-2">
                            <Label>Usuários selecionados ({selectedUsers.length})</Label>
                            <div className="flex flex-wrap gap-1 mt-1">
                              {selectedUsers.map(user => (
                                <Badge key={user.id} variant="secondary" className="flex gap-1 items-center">
                                  {user.email}
                                  <button 
                                    type="button"
                                    onClick={() => removeUser(user.id)} 
                                    className="ml-1 rounded-full hover:bg-gray-200 p-0.5"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </Badge>
                              ))}
                              
                              {selectedUsers.length === 0 && (
                                <p className="text-sm text-gray-500 w-full">Nenhum usuário selecionado</p>
                              )}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>
            </div>
          </div>
          
          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={uploading}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={uploading}>
              {uploading ? 'Enviando...' : 'Enviar documento'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
