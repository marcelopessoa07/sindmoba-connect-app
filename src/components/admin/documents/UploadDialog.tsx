
import { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { uploadDocument } from './utils/documentUploaders';
import { DocumentForm, FormValues } from './DocumentForm';
import { SpecialtyType } from './recipients/SpecialtySelector';
import { Member } from './recipients/RecipientSelector';

interface UploadDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUploadSuccess: () => void;
}

const UploadDialog = ({ open, onOpenChange, onUploadSuccess }: UploadDialogProps) => {
  const [selectedSpecialties, setSelectedSpecialties] = useState<SpecialtyType[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<Member[]>([]);
  const [uploading, setUploading] = useState(false);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const resetForm = () => {
    setSelectedSpecialties([]);
    setSelectedMembers([]);
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

  const handleSubmit = async (values: FormValues, file: File | null) => {
    if (!values.title) {
      toast({
        title: "Campos obrigatórios",
        description: "Por favor, preencha o título do documento.",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      await uploadDocument(values, file, selectedSpecialties, selectedMembers);
      
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
        <DocumentForm 
          onSubmit={handleSubmit}
          uploading={uploading}
        />
        <DialogFooter className="pt-2">
          <DialogClose asChild>
            <Button variant="outline" type="button" disabled={uploading}>
              Cancelar
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default UploadDialog;
