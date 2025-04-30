
import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  bucket: string;
  acceptedFileTypes: string[];
  maxFileSize: number; // in MB
  onFileUploaded: (fileData: { id: string; name: string; size: number }) => void;
  onUploadProgress?: (isUploading: boolean) => void;
}

export const FileUploader = ({
  bucket,
  acceptedFileTypes,
  maxFileSize,
  onFileUploaded,
  onUploadProgress
}: FileUploaderProps) => {
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    
    if (!file) return;
    
    // Check file type
    if (!acceptedFileTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: `Por favor, envie um arquivo dos seguintes tipos: ${acceptedFileTypes.join(', ')}`,
        variant: "destructive",
      });
      return;
    }
    
    // Check file size (convert maxFileSize from MB to bytes)
    if (file.size > maxFileSize * 1024 * 1024) {
      toast({
        title: "Arquivo muito grande",
        description: `O tamanho máximo permitido é ${maxFileSize}MB`,
        variant: "destructive",
      });
      return;
    }
    
    setIsUploading(true);
    if (onUploadProgress) onUploadProgress(true);
    
    try {
      // Create an object with the expected properties
      const fileData = {
        id: `temp_${Date.now()}_${file.name.replace(/\s+/g, '_')}`, // Generate a temporary ID
        name: file.name,
        size: file.size
      };
      
      // Pass the file data to the parent component
      onFileUploaded(fileData);
      
      toast({
        title: "Arquivo selecionado com sucesso",
        description: "Seu documento foi anexado ao formulário.",
      });
      
    } catch (error: any) {
      console.error("Error selecting file:", error);
      toast({
        title: "Erro ao selecionar arquivo",
        description: error.message || "Houve um erro ao selecionar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      if (onUploadProgress) onUploadProgress(false);
      // Reset the file input
      e.target.value = '';
    }
  };
  
  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          className={`w-full relative ${isUploading ? 'opacity-50' : ''}`}
          disabled={isUploading}
        >
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? 'Enviando...' : 'Selecionar arquivo'}
          <input
            ref={fileInputRef}
            type="file"
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Tamanho máximo: {maxFileSize}MB. Formatos aceitos: PDF, Word, Excel.
      </p>
    </div>
  );
};

// Export the FileUploader component as both default and named export
// This ensures backward compatibility
export default FileUploader;
