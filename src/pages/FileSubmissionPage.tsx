
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { File, Upload, CheckCircle } from 'lucide-react';

const FileSubmissionPage = () => {
  const [documentType, setDocumentType] = useState('');
  const [observations, setObservations] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const { toast } = useToast();

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!documentType) {
      toast({
        title: "Tipo de documento obrigatório",
        description: "Por favor, selecione o tipo de documento.",
        variant: "destructive",
      });
      return;
    }

    if (!selectedFile) {
      toast({
        title: "Arquivo obrigatório",
        description: "Por favor, selecione um arquivo para enviar.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    // Simulate file upload
    setTimeout(() => {
      setIsSubmitting(false);
      setIsSuccess(true);
      toast({
        title: "Arquivo enviado com sucesso!",
        description: "Seu documento foi recebido pelo SINDMOBA.",
      });
      
      // Reset form after showing success message
      setTimeout(() => {
        setDocumentType('');
        setObservations('');
        setSelectedFile(null);
        setIsSuccess(false);
      }, 3000);
    }, 1500);
  };

  return (
    <div className="sindmoba-container">
      <h2 className="mb-2">Envio de Arquivos</h2>
      <p className="mb-6 text-gray-600">
        Utilize este formulário para enviar documentos ao SINDMOBA. Todos os arquivos enviados são tratados com confidencialidade.
      </p>
      
      {isSuccess ? (
        <div className="rounded-lg border border-sindmoba-success bg-white p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-sindmoba-success bg-opacity-10 p-3">
              <CheckCircle className="h-12 w-12 text-sindmoba-success" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold text-sindmoba-success">Arquivo Enviado!</h3>
          <p className="mb-4 text-gray-600">
            Seu documento foi recebido com sucesso. Nossa equipe irá analisá-lo em breve.
          </p>
          <p className="text-sm text-gray-500">
            Um comprovante de envio foi enviado para seu e-mail cadastrado.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="documentType" className="block text-sm font-medium text-gray-700">
                  Tipo de Documento *
                </label>
                <Select value={documentType} onValueChange={setDocumentType}>
                  <SelectTrigger id="documentType">
                    <SelectValue placeholder="Selecione o tipo de documento" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="personal">Documento Pessoal</SelectItem>
                    <SelectItem value="professional">Documento Profissional</SelectItem>
                    <SelectItem value="medical">Atestado Médico</SelectItem>
                    <SelectItem value="report">Relatório</SelectItem>
                    <SelectItem value="request">Requerimento</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="observations" className="block text-sm font-medium text-gray-700">
                  Observações
                </label>
                <Textarea
                  id="observations"
                  value={observations}
                  onChange={(e) => setObservations(e.target.value)}
                  placeholder="Descreva brevemente o conteúdo do documento ou adicione informações adicionais."
                  className="h-24"
                />
              </div>
              
              <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                  Anexar Arquivo *
                </label>
                <div className="mt-1 flex items-center justify-center rounded-lg border-2 border-dashed border-gray-300 px-6 py-10">
                  <div className="space-y-1 text-center">
                    {selectedFile ? (
                      <div className="flex flex-col items-center">
                        <File className="mb-2 h-8 w-8 text-sindmoba-primary" />
                        <p className="text-sm font-medium">{selectedFile.name}</p>
                        <p className="text-xs text-gray-500">
                          {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                        </p>
                        <button
                          type="button"
                          onClick={() => setSelectedFile(null)}
                          className="mt-2 text-xs text-sindmoba-primary hover:underline"
                        >
                          Remover arquivo
                        </button>
                      </div>
                    ) : (
                      <>
                        <Upload className="mx-auto h-12 w-12 text-gray-400" />
                        <div className="mt-4 flex text-sm text-gray-600">
                          <label
                            htmlFor="file-upload"
                            className="relative cursor-pointer rounded-md font-medium text-sindmoba-primary hover:text-sindmoba-secondary"
                          >
                            <span>Selecione um arquivo</span>
                            <input
                              id="file-upload"
                              name="file-upload"
                              type="file"
                              onChange={handleFileChange}
                              className="sr-only"
                            />
                          </label>
                          <p className="pl-1">ou arraste e solte aqui</p>
                        </div>
                        <p className="text-xs text-gray-500">
                          PDF, DOC, DOCX, JPG, PNG até 10MB
                        </p>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div className="rounded-lg bg-sindmoba-light p-4 text-sm text-gray-700">
            <p>
              <strong>Atenção:</strong> Certifique-se de que todos os documentos estejam legíveis e completos. 
              Arquivos muito grandes podem demorar mais para serem enviados. O tamanho máximo permitido é de 10MB.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <svg className="mr-2 h-4 w-4 animate-spin" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                  Enviando...
                </>
              ) : (
                'Enviar Arquivo'
              )}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default FileSubmissionPage;
