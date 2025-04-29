
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Trash2, AlertCircle } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';

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
  const fileNotAvailable = !documentUrl || documentUrl === '';

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
              {!fileNotAvailable && document?.file_type?.includes('pdf') ? (
                <iframe 
                  src={`${documentUrl}#toolbar=0`}
                  className="w-full h-[500px] border rounded"
                  title={document?.title}
                />
              ) : !fileNotAvailable ? (
                <p className="mb-4 text-center">
                  Este tipo de arquivo não pode ser pré-visualizado.
                </p>
              ) : (
                <div className="text-center p-6 border border-dashed rounded-lg bg-gray-50">
                  <AlertCircle className="mx-auto h-12 w-12 text-amber-500 mb-3" />
                  <p className="mb-2 font-medium">Este arquivo não está disponível.</p>
                  <p className="text-sm text-gray-500">
                    O arquivo pode ter sido removido ou não está mais disponível no storage.
                  </p>
                </div>
              )}
              
              {!fileNotAvailable && (
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
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="destructive" 
                  onClick={onDelete}
                >
                  <Trash2 className="mr-2 h-4 w-4" />
                  Excluir Documento
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Remover este documento permanentemente</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
          <DialogClose asChild>
            <Button variant="outline">Fechar</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default DocumentPreviewDialog;
