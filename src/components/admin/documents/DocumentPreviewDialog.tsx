
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Download, Trash2, AlertCircle, FileX, ExternalLink } from 'lucide-react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { useEffect, useState } from 'react';
import { useToast } from '@/hooks/use-toast';

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
  const [isPdfLoading, setIsPdfLoading] = useState(true);
  const [pdfError, setPdfError] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Reset states when dialog opens or document changes
    if (open) {
      setIsPdfLoading(true);
      setPdfError(false);
    }
  }, [open, document]);

  const handlePdfLoad = () => {
    setIsPdfLoading(false);
  };

  const handlePdfError = () => {
    setIsPdfLoading(false);
    setPdfError(true);
    
    toast({
      title: "Erro ao carregar PDF",
      description: "Não foi possível visualizar o arquivo. Tente baixá-lo diretamente ou abrir em nova janela.",
      variant: "destructive",
    });
  };

  // Function to open document in new tab
  const openInNewTab = () => {
    if (documentUrl) {
      window.open(documentUrl, '_blank');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>{document?.title || 'Visualizar Documento'}</DialogTitle>
          {document?.description && (
            <DialogDescription>{document.description}</DialogDescription>
          )}
        </DialogHeader>
        
        <div className="mt-4">
          {document && (
            <div className="flex flex-col items-center justify-center">
              {!fileNotAvailable ? (
                <div className="relative w-full">
                  {isPdfLoading && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100 border rounded">
                      <div className="flex flex-col items-center">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mb-2"></div>
                        <p className="text-sm text-gray-600">Carregando documento...</p>
                      </div>
                    </div>
                  )}
                  
                  {document?.file_type?.includes('pdf') ? (
                    <iframe 
                      src={`${documentUrl}#toolbar=0`}
                      className="w-full h-[500px] border rounded"
                      title={document?.title || 'Documento'}
                      onLoad={handlePdfLoad}
                      onError={handlePdfError}
                    />
                  ) : (
                    <div className="p-6 text-center border rounded bg-gray-50">
                      <p className="mb-4">Este tipo de arquivo não pode ser pré-visualizado.</p>
                      <div className="flex justify-center space-x-2">
                        <Button onClick={openInNewTab}>
                          <ExternalLink className="mr-2 h-4 w-4" />
                          Abrir em Nova Janela
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  {pdfError && (
                    <div className="absolute inset-0 flex items-center justify-center bg-gray-100/80 border rounded">
                      <div className="text-center p-6">
                        <FileX className="mx-auto h-12 w-12 text-red-500 mb-3" />
                        <p className="mb-2 font-medium">Erro ao carregar o documento</p>
                        <p className="text-sm text-gray-500 mb-4">
                          O documento não pôde ser visualizado no momento.
                        </p>
                        <div className="flex justify-center space-x-2">
                          <Button onClick={openInNewTab}>
                            <ExternalLink className="mr-2 h-4 w-4" />
                            Abrir em Nova Janela
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
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
                  <a href={documentUrl} download={document?.title || 'documento'} target="_blank" rel="noreferrer">
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
