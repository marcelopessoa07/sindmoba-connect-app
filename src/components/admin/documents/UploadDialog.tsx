
import { useState, FormEvent } from 'react';
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
import { FileUploader } from '@/components/FileUploader';
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

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

const fileCategories = [
  { id: "estatuto", label: "Estatuto do SINDMOBA" },
  { id: "atas", label: "Atas de assembleias" },
  { id: "convenios", label: "Convênios e acordos coletivos" },
  { id: "comunicados", label: "Comunicados oficiais" },
  { id: "outros", label: "Outros documentos" }
];

const recipientTypes = [
  { id: "all", label: "Todos os associados" },
  { id: "specialty", label: "Por especialidade" },
];

// Create a File interface that extends the standard File with an id property
interface ExtendedFile extends File {
  id?: string;
}

const UploadDialog = ({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<ExtendedFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [category, setCategory] = useState('comunicados');
  const [recipientType, setRecipientType] = useState('all');
  const [selectedSpecialty, setSelectedSpecialty] = useState<string | null>(null);
  const { toast } = useToast();

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
        await supabase
          .from('document_recipients')
          .insert({
            document_id: document.id,
            recipient_type: 'all'
          });
      } else if (recipientType === 'specialty' && selectedSpecialty) {
        await supabase
          .from('document_recipients')
          .insert({
            document_id: document.id,
            recipient_type: 'specialty',
            specialty: selectedSpecialty
          });
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
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Enviar Nova Comunicação</DialogTitle>
          <DialogDescription>
            Preencha os campos abaixo para enviar um novo documento ou comunicação aos associados.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">Título da comunicação</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Digite o título do documento"
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Digite uma breve descrição do documento"
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
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
          
          <div className="space-y-2">
            <Label>Arquivo (opcional)</Label>
            <FileUploader onFileChange={handleFileChange} />
            {file && (
              <p className="text-sm text-gray-500">
                Arquivo selecionado: {file.name} ({Math.round(file.size / 1024)} KB)
              </p>
            )}
          </div>
          
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="recipients">
              <AccordionTrigger>Configurações avançadas de destinatários</AccordionTrigger>
              <AccordionContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>Tipo de destinatário</Label>
                    <Select value={recipientType} onValueChange={(value) => setRecipientType(value)}>
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
                    <div className="space-y-2">
                      <Label>Especialidade</Label>
                      <Select 
                        value={selectedSpecialty || ''} 
                        onValueChange={(value) => setSelectedSpecialty(value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a especialidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pml">Polícia Militar Local</SelectItem>
                          <SelectItem value="pol">Polícia Ordinária Local</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
          
          <DialogFooter>
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
