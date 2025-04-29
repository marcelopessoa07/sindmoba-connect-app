
import { useState, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Upload } from 'lucide-react';

interface FileUploaderProps {
  bucket: string;
  acceptedFileTypes: string[];
  maxFileSize: number; // in MB
  onFileUploaded: (fileData: { id: string, name: string, size: number }) => void;
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
      // Generate a unique file name to avoid collisions
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
      const filePath = fileName;
      
      // Upload the file to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);
      
      if (error) throw error;
      
      onFileUploaded({
        id: data.path,
        name: file.name,
        size: file.size
      });
      
      toast({
        title: "Arquivo enviado com sucesso",
        description: "Seu documento foi enviado com sucesso.",
      });
      
    } catch (error: any) {
      console.error("Error uploading file:", error);
      toast({
        title: "Erro ao enviar arquivo",
        description: error.message || "Houve um erro ao fazer upload do arquivo. Tente novamente.",
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
          {isUploading ? 'Enviando...' : 'Selecionar PDF'}
          <input
            type="file"
            accept={acceptedFileTypes.join(',')}
            onChange={handleFileChange}
            disabled={isUploading}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </Button>
      </div>
      <p className="text-xs text-gray-500">
        Tamanho máximo: {maxFileSize}MB. Formatos aceitos: PDF.
      </p>
    </div>
  );
};
