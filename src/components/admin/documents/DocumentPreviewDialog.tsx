
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Trash2 } from 'lucide-react';

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  document: any | null;
  documentUrl: string;
  onDelete: () => void;
}

const DocumentPreviewDialog = ({ 
  open, 
  onOpenChange, 
  document, 
  documentUrl,
  onDelete
}: DocumentPreviewDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{document?.title}</DialogTitle>
          {document?.description && (
            <DialogDescription>{document.description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="mt-4">
          {document && (
            <div className="flex flex-col items-center justify-center">
              {documentUrl && document?.file_type?.includes('pdf') ? (
                <iframe 
                  src={`${documentUrl}#toolbar=0`}
                  className="w-full h-[500px] border rounded"
                  title={document?.title}
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
                  <a href={documentUrl} download={document?.title} target="_blank" rel="noreferrer">
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
            onClick={onDelete}
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
  );
};

export default DocumentPreviewDialog;
