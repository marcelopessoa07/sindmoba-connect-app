
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  RadioGroup,
  RadioGroupItem
} from '@/components/ui/radio-group';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel
} from '@/components/ui/form';
import { FileUploader } from '@/components/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, Search, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Avatar } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useForm } from 'react-hook-form';

// Export file categories for use in other components
export const fileCategories = [
  { value: 'estatuto', label: 'Estatuto do SINDMOBA' },
  { value: 'atas', label: 'Atas de assembleias' },
  { value: 'convenios', label: 'Convênios e acordos coletivos' },
  { value: 'comunicados', label: 'Comunicados oficiais' },
  { value: 'outros', label: 'Outros documentos' }
];

// Recipient types
const recipientTypes = [
  { value: 'all', label: 'Todos os associados' },
  { value: 'specialty', label: 'Por especialidade' },
  { value: 'specific', label: 'Associados específicos' }
];

// Specialties
const specialties = [
  { value: 'pml', label: 'Perícia Médica Legal' },
  { value: 'pol', label: 'Polícia Ostensiva Local' },
  { value: 'onc', label: 'Oncologia' },
  { value: 'cir', label: 'Cirurgia' },
  { value: 'psq', label: 'Psiquiatria' },
  { value: 'ort', label: 'Ortopedia' }
];

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

interface FormValues {
  title: string;
  description: string;
  category: string;
  recipientType: string;
}

interface Member {
  id: string;
  full_name: string;
  email: string;
  specialty?: string;
  registration_number?: string;
}

const UploadDialog = ({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) => {
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [availableMembers, setAvailableMembers] = useState<Member[]>([]);
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filteredMembers, setFilteredMembers] = useState<Member[]>([]);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const form = useForm<FormValues>({
    defaultValues: {
      title: '',
      description: '',
      category: 'comunicados',
      recipientType: 'all'
    }
  });
  
  // Fetch all available members when dialog opens
  useEffect(() => {
    if (open) {
      fetchMembers();
    }
  }, [open]);

  // Filter members based on search term
  useEffect(() => {
    if (searchTerm.trim() === '') {
      setFilteredMembers(availableMembers);
    } else {
      const lowercasedSearchTerm = searchTerm.toLowerCase();
      setFilteredMembers(
        availableMembers.filter(
          (member) =>
            member.full_name?.toLowerCase().includes(lowercasedSearchTerm) ||
            member.email?.toLowerCase().includes(lowercasedSearchTerm) ||
            member.registration_number?.toLowerCase().includes(lowercasedSearchTerm)
        )
      );
    }
  }, [searchTerm, availableMembers]);

  const fetchMembers = async () => {
    try {
      setIsLoadingMembers(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, email, specialty, registration_number')
        .eq('role', 'member');

      if (error) {
        console.error('Error fetching members:', error);
        toast({
          title: 'Erro ao carregar associados',
          description: 'Não foi possível carregar a lista de associados.',
          variant: 'destructive',
        });
        return;
      }

      setAvailableMembers(data || []);
      setFilteredMembers(data || []);
    } catch (error) {
      console.error('Exception fetching members:', error);
    } finally {
      setIsLoadingMembers(false);
    }
  };

  const resetForm = () => {
    form.reset();
    setSelectedSpecialties([]);
    setSelectedMembers([]);
    setFile(null);
    setUploading(false);
    setSearchTerm('');
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  const onClose = () => {
    if (!uploading) {
      resetForm();
      onOpenChange(false);
    }
  };

  const handleSpecialtyChange = (specialty: string) => {
    setSelectedSpecialties(prev => 
      prev.includes(specialty)
        ? prev.filter(item => item !== specialty)
        : [...prev, specialty]
    );
  };

  const handleMemberSelection = (member: Member) => {
    setSelectedMembers(prev => {
      const isMemberSelected = prev.some(m => m.id === member.id);
      if (isMemberSelected) {
        return prev.filter(m => m.id !== member.id);
      } else {
        return [...prev, member];
      }
    });
  };

  const handleFileChange = (uploadedFile: File | null) => {
    console.log("File selected:", uploadedFile);
    setFile(uploadedFile);
  };

  const onSubmit = async (values: FormValues) => {
    if (!values.title) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título do documento.",
        variant: "destructive",
      });
      return;
    }

    let fileUrl = '';
    let fileType = '';
    let fileSize = 0;
    const now = new Date().toISOString();

    setUploading(true);

    try {
      // Upload file if provided
      if (file) {
        const fileExt = file.name.split('.').pop();
        const uniquePrefix = Math.random().toString(36).substring(2, 10);
        const filePath = `documents/${uniquePrefix}_${Date.now()}.${fileExt}`;
        
        console.log("Uploading file to:", filePath);
        console.log("File name:", file.name);
        console.log("File size:", file.size);
        console.log("File type:", file.type);
        
        const { error: uploadError, data: uploadData } = await supabase
          .storage
          .from('documents')
          .upload(filePath, file, {
            cacheControl: '3600',
            upsert: false
          });

        if (uploadError) {
          console.error("File upload error:", uploadError);
          throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
        }

        // Get the public URL for the file
        const { data: urlData } = supabase
          .storage
          .from('documents')
          .getPublicUrl(filePath);

        fileUrl = urlData.publicUrl;
        fileType = file.type;
        fileSize = file.size;
        
        console.log("File uploaded successfully. Public URL:", fileUrl);
      }

      // Save document to database
      const { data: documentData, error: documentError } = await supabase
        .from('documents')
        .insert({
          title: values.title,
          description: values.description,
          category: values.category,
          file_url: fileUrl,
          file_type: fileType,
          file_size: fileSize,
          created_at: now,
          updated_at: now
        })
        .select('id')
        .single();

      if (documentError) {
        throw documentError;
      }

      // Handle recipients based on selection type
      if (documentData?.id) {
        if (values.recipientType === 'all') {
          // Add document for all users
          const { error: recipientError } = await supabase
            .from('document_recipients')
            .insert({
              document_id: documentData.id,
              recipient_type: 'all',
              created_at: now
            });

          if (recipientError) {
            console.error("Error adding recipients:", recipientError);
          }
        } 
        else if (values.recipientType === 'specialty' && selectedSpecialties.length > 0) {
          // Add document for selected specialties
          for (const specialty of selectedSpecialties) {
            const { error: recipientError } = await supabase
              .from('document_recipients')
              .insert({
                document_id: documentData.id,
                specialty: specialty,
                recipient_type: 'specialty',
                created_at: now
              });

            if (recipientError) {
              console.error("Error adding recipient:", recipientError);
            }
          }
        } 
        else if (values.recipientType === 'specific' && selectedMembers.length > 0) {
          // Add document for specific members
          for (const member of selectedMembers) {
            const { error: recipientError } = await supabase
              .from('document_recipients')
              .insert({
                document_id: documentData.id,
                recipient_id: member.id,
                recipient_type: 'specific',
                created_at: now
              });

            if (recipientError) {
              console.error("Error adding specific recipient:", recipientError);
            }
          }
        }
      }

      toast({
        title: "Documento enviado com sucesso",
        description: "O documento foi adicionado à biblioteca.",
      });

      onUploadSuccess();
      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Upload error:", error);
      toast({
        title: "Erro ao enviar documento",
        description: error instanceof Error ? error.message : "Ocorreu um erro ao enviar o documento. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Enviar nova comunicação ou documento</DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form ref={formRef} onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Título</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Título do documento"
                      disabled={uploading}
                      required
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="Descrição opcional do documento"
                      disabled={uploading}
                      {...field}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="category"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Categoria</FormLabel>
                  <Select 
                    onValueChange={field.onChange}
                    defaultValue={field.value}
                    disabled={uploading}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione a categoria" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {fileCategories.map(cat => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="recipientType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Destinatários</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      defaultValue={field.value}
                      className="space-y-3 border rounded-md p-3"
                      disabled={uploading}
                    >
                      {recipientTypes.map((type) => (
                        <div key={type.value} className="flex items-center space-x-2">
                          <RadioGroupItem value={type.value} id={`recipient-${type.value}`} />
                          <Label htmlFor={`recipient-${type.value}`} className="font-normal">
                            {type.label}
                          </Label>
                        </div>
                      ))}
                      
                      {form.watch('recipientType') === 'specialty' && (
                        <div className="mt-2 space-y-2 pl-6 border-t pt-2">
                          <p className="text-sm text-muted-foreground mb-2">Selecione as especialidades:</p>
                          <div className="grid grid-cols-2 gap-2">
                            {specialties.map((specialty) => (
                              <div key={specialty.value} className="flex items-center space-x-2">
                                <Checkbox 
                                  id={`spec-${specialty.value}`}
                                  checked={selectedSpecialties.includes(specialty.value)}
                                  onCheckedChange={() => handleSpecialtyChange(specialty.value)}
                                  disabled={uploading}
                                />
                                <Label htmlFor={`spec-${specialty.value}`} className="font-normal">
                                  {specialty.label}
                                </Label>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                      
                      {form.watch('recipientType') === 'specific' && (
                        <div className="mt-2 space-y-2 pl-6 border-t pt-2">
                          <div className="flex items-center space-x-2 mb-2">
                            <Search className="h-4 w-4 text-muted-foreground" />
                            <Input
                              placeholder="Buscar associados..."
                              value={searchTerm}
                              onChange={(e) => setSearchTerm(e.target.value)}
                              disabled={uploading || isLoadingMembers}
                              className="h-8"
                            />
                          </div>
                          
                          {selectedMembers.length > 0 && (
                            <div className="mb-2">
                              <p className="text-sm text-muted-foreground mb-1">Selecionados ({selectedMembers.length}):</p>
                              <div className="flex flex-wrap gap-1">
                                {selectedMembers.map(member => (
                                  <div 
                                    key={member.id}
                                    className="bg-muted text-xs flex items-center gap-1 px-2 py-1 rounded-full"
                                  >
                                    <span className="truncate max-w-[100px]">{member.full_name || member.email}</span>
                                    <Button
                                      type="button"
                                      variant="ghost"
                                      size="sm"
                                      className="h-4 w-4 p-0 hover:bg-transparent"
                                      onClick={() => handleMemberSelection(member)}
                                      disabled={uploading}
                                    >
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          <div className="border rounded-md h-48 overflow-hidden">
                            <ScrollArea className="h-full">
                              {isLoadingMembers ? (
                                <div className="flex justify-center items-center h-full">
                                  <Loader2 className="h-6 w-6 text-muted-foreground animate-spin" />
                                </div>
                              ) : filteredMembers.length > 0 ? (
                                <div className="p-1">
                                  {filteredMembers.map(member => (
                                    <div 
                                      key={member.id} 
                                      className={`flex items-center space-x-2 p-2 hover:bg-accent rounded-md cursor-pointer ${
                                        selectedMembers.some(m => m.id === member.id) 
                                          ? 'bg-accent/50' 
                                          : ''
                                      }`}
                                      onClick={() => handleMemberSelection(member)}
                                    >
                                      <Checkbox 
                                        checked={selectedMembers.some(m => m.id === member.id)}
                                        onCheckedChange={() => {}}
                                        disabled={uploading}
                                      />
                                      <div className="flex items-center space-x-2 overflow-hidden">
                                        <Avatar className="h-6 w-6 text-xs">
                                          <div className="bg-primary text-primary-foreground h-full w-full flex items-center justify-center">
                                            {(member.full_name?.charAt(0) || member.email?.charAt(0) || '').toUpperCase()}
                                          </div>
                                        </Avatar>
                                        <div className="space-y-0.5 overflow-hidden">
                                          <p className="text-sm font-medium truncate">
                                            {member.full_name || member.email}
                                          </p>
                                          {member.specialty && (
                                            <p className="text-xs text-muted-foreground truncate">
                                              {specialties.find(s => s.value === member.specialty)?.label || member.specialty}
                                            </p>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex justify-center items-center h-full text-sm text-muted-foreground">
                                  Nenhum associado encontrado
                                </div>
                              )}
                            </ScrollArea>
                          </div>
                        </div>
                      )}
                    </RadioGroup>
                  </FormControl>
                </FormItem>
              )}
            />

            <div className="space-y-2">
              <Label>Arquivo</Label>
              <FileUploader 
                bucket="documents"
                acceptedFileTypes={[
                  'application/pdf',
                  'application/msword',
                  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
                  'application/vnd.ms-excel',
                  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
                ]}
                maxFileSize={10}
                onFileUploaded={handleFileChange}
                onUploadProgress={(isUploading) => setUploading(isUploading)}
              />
              {file && (
                <div className="flex items-center justify-between rounded-md border px-3 py-2 bg-gray-50">
                  <span className="truncate text-sm">{file.name}</span>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setFile(null)}
                    disabled={uploading}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <DialogFooter className="pt-4">
              <DialogClose asChild>
                <Button variant="outline" type="button" disabled={uploading}>
                  Cancelar
                </Button>
              </DialogClose>
              <Button type="submit" disabled={uploading}>
                {uploading && (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                )}
                {uploading ? 'Enviando...' : 'Enviar documento'}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
