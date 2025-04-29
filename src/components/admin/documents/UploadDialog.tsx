
import { useState, useRef } from 'react';
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
import { FileUploader } from '@/components/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2, X } from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';

// Export file categories for use in other components
export const fileCategories = [
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
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('comunicados');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [forAllUsers, setForAllUsers] = useState(true);
  const [selectedSpecialties, setSelectedSpecialties] = useState<string[]>([]);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setCategory('comunicados');
    setFile(null);
    setForAllUsers(true);
    setSelectedSpecialties([]);
    setUploading(false);
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

  const handleFileChange = (uploadedFile: File | null) => {
    console.log("File selected:", uploadedFile);
    setFile(uploadedFile);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title) {
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
          title,
          description,
          category,
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

      // Add recipients
      if (documentData?.id) {
        if (forAllUsers) {
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
        } else if (selectedSpecialties.length > 0) {
          // Add document for selected specialties - Fix for type safety
          // Insert each recipient individually with proper type checking
          for (const specialty of selectedSpecialties) {
            // Only insert if the specialty is one of the allowed values
            if (specialty === 'pml' || specialty === 'pol') {
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
            } else {
              console.warn(`Skipping non-supported specialty: ${specialty}`);
              // Handle non-supported specialties by adding them without a specialty field
              const { error: recipientError } = await supabase
                .from('document_recipients')
                .insert({
                  document_id: documentData.id,
                  recipient_type: 'specialty',
                  created_at: now
                });

              if (recipientError) {
                console.error("Error adding generic recipient:", recipientError);
              }
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
        <form ref={formRef} onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input 
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Título do documento"
              disabled={uploading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea 
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Descrição opcional do documento"
              disabled={uploading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="category">Categoria</Label>
            <Select 
              value={category} 
              onValueChange={setCategory}
              disabled={uploading}
            >
              <SelectTrigger id="category">
                <SelectValue placeholder="Selecione a categoria" />
              </SelectTrigger>
              <SelectContent>
                {fileCategories.map(cat => (
                  <SelectItem key={cat.value} value={cat.value}>
                    {cat.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label>Destinatários</Label>
            <div className="space-y-2 border rounded-md p-3">
              <div className="flex items-center space-x-2">
                <Checkbox 
                  id="all-users" 
                  checked={forAllUsers} 
                  onCheckedChange={(checked) => setForAllUsers(checked === true)}
                  disabled={uploading}
                />
                <Label htmlFor="all-users" className="font-normal">Todos os associados</Label>
              </div>
              
              {!forAllUsers && (
                <div className="mt-2 space-y-1 pl-6">
                  <p className="text-sm text-muted-foreground mb-1">Selecione as especialidades:</p>
                  
                  {['pml', 'pol', 'onc', 'cir', 'psq', 'ort'].map((specialty) => (
                    <div key={specialty} className="flex items-center space-x-2">
                      <Checkbox 
                        id={`spec-${specialty}`}
                        checked={selectedSpecialties.includes(specialty)}
                        onCheckedChange={() => handleSpecialtyChange(specialty)}
                        disabled={uploading || forAllUsers}
                      />
                      <Label htmlFor={`spec-${specialty}`} className="font-normal">
                        {specialty === 'pml' && 'Perícia Médica Legal'}
                        {specialty === 'pol' && 'Polícia Ostensiva Local'}
                        {specialty === 'onc' && 'Oncologia'}
                        {specialty === 'cir' && 'Cirurgia'}
                        {specialty === 'psq' && 'Psiquiatria'}
                        {specialty === 'ort' && 'Ortopedia'}
                      </Label>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

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
              onFileUploaded={({ name, size }) => setFile({ name, size } as File)}
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
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
