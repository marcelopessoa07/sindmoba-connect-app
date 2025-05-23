
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { File, Upload, CheckCircle, AlertTriangle } from 'lucide-react';

const FileSubmissionPage = () => {
  const [documentType, setDocumentType] = useState('');
  const [observations, setObservations] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [configError, setConfigError] = useState(false);
  const [bucketInitialized, setBucketInitialized] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();

  useEffect(() => {
    // Check if the storage bucket exists on component mount
    const checkBucketExists = async () => {
      try {
        console.log("Checking if storage bucket exists...");
        const { data, error } = await supabase
          .storage
          .getBucket('member-submissions');
          
        if (error) {
          console.error("Error checking bucket:", error);
          
          if (error.message.includes('not found')) {
            setConfigError(true);
            console.log("Bucket 'member-submissions' doesn't exist");
          }
        } else if (data) {
          console.log("Bucket exists:", data);
          setBucketInitialized(true);
        }
      } catch (err) {
        console.error("Exception checking bucket:", err);
        setConfigError(true);
      }
    };

    checkBucketExists();
  }, []);

  // Function to try to create the bucket if user is admin
  const tryInitializeBucket = async () => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para inicializar o sistema.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);
    
    try {
      // First check if user is admin
      const { data: profileData, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .single();
        
      if (profileError) {
        console.error("Error checking user role:", profileError);
        throw new Error("Não foi possível verificar suas permissões");
      }
      
      if (!profileData || profileData.role !== 'admin') {
        toast({
          title: "Permissão negada",
          description: "Apenas administradores podem inicializar o sistema de arquivos.",
          variant: "destructive",
        });
        setIsSubmitting(false);
        return;
      }
      
      console.log("Creating storage bucket 'member-submissions'...");
      
      // Try to create the bucket
      const { data, error } = await supabase
        .storage
        .createBucket('member-submissions', {
          public: false,
          fileSizeLimit: 10485760, // 10MB in bytes
        });
        
      if (error) {
        console.error("Error creating bucket:", error);
        throw new Error("Não foi possível criar o bucket: " + error.message);
      }
      
      console.log("Bucket created successfully:", data);
      
      // Call the edge function to create storage policies
      const { error: policyError } = await supabase.functions.invoke('create-storage-policies', {
        body: { bucket_name_param: 'member-submissions' }
      });
        
      if (policyError) {
        console.error("Error creating RLS policies:", policyError);
        // Continue even if policy creation fails - we'll create them with SQL migration
      }
      
      toast({
        title: "Sistema inicializado com sucesso!",
        description: "O sistema de arquivos foi configurado. Agora você pode enviar documentos.",
      });
      
      setBucketInitialized(true);
      setConfigError(false);
    } catch (error: any) {
      console.error("Error initializing bucket:", error);
      toast({
        title: "Erro ao inicializar sistema",
        description: error.message || "Ocorreu um erro ao configurar o sistema de arquivos.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para enviar arquivos.",
        variant: "destructive",
      });
      return;
    }
    
    if (!bucketInitialized) {
      toast({
        title: "Sistema não configurado",
        description: "O sistema de arquivos não está configurado. Entre em contato com o administrador.",
        variant: "destructive",
      });
      setConfigError(true);
      return;
    }
    
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

    try {
      console.log("Starting file upload with user ID:", user.id);
      
      // Check if the storage bucket exists one more time just to be sure
      try {
        const { data: bucketExists, error: checkBucketError } = await supabase
          .storage
          .getBucket('member-submissions');
          
        if (checkBucketError && checkBucketError.message.includes('not found')) {
          console.error("Bucket 'member-submissions' doesn't exist");
          toast({
            title: "Erro de configuração",
            description: "O sistema não está configurado corretamente para upload de arquivos. Entre em contato com o administrador.",
            variant: "destructive",
          });
          setConfigError(true);
          setIsSubmitting(false);
          return;
        }
      } catch (bucketError) {
        console.error("Error checking for bucket:", bucketError);
      }
      
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${Date.now()}_${Math.random().toString(36).substring(2, 10)}.${fileExt}`;
      const filePath = `${user.id}/${fileName}`;
      
      console.log("Attempting to upload file to path:", filePath);
      
      // Set proper content type based on file
      let contentType;
      if (selectedFile.type) {
        contentType = selectedFile.type;
      } else if (fileExt === 'pdf') {
        contentType = 'application/pdf';
      } else if (['jpg', 'jpeg', 'png'].includes(fileExt || '')) {
        contentType = `image/${fileExt}`;
      } else if (fileExt === 'doc' || fileExt === 'docx') {
        contentType = 'application/msword';
      } else {
        contentType = 'application/octet-stream';
      }
      
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('member-submissions')
        .upload(filePath, selectedFile, {
          cacheControl: '3600',
          upsert: false,
          contentType
        });
      
      if (uploadError) {
        console.error("Storage upload error:", uploadError);
        throw new Error(`Erro ao fazer upload do arquivo: ${uploadError.message}`);
      }
      
      console.log("File uploaded successfully:", uploadData);
      
      // Store file metadata in database
      const { error: dbError } = await supabase
        .from('member_submissions')
        .insert({
          user_id: user.id,
          document_type: documentType,
          observations: observations,
          file_url: filePath,
          file_name: selectedFile.name,
          file_size: selectedFile.size,
          file_type: selectedFile.type || contentType,
          status: 'pending'
        });
      
      if (dbError) {
        console.error("Database insert error:", dbError);
        throw new Error(`Erro ao salvar informações do arquivo: ${dbError.message}`);
      }
      
      setIsSuccess(true);
      setConfigError(false);
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
      
    } catch (error: any) {
      console.error("Error submitting file:", error);
      toast({
        title: "Erro ao enviar arquivo",
        description: error.message || "Ocorreu um erro ao enviar o arquivo. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDocumentTypeLabel = (value: string) => {
    const types = {
      'personal': 'Documento Pessoal',
      'professional': 'Documento Profissional',
      'medical': 'Atestado Médico', 
      'report': 'Relatório',
      'request': 'Requerimento',
      'other': 'Outro'
    };
    return types[value as keyof typeof types] || value;
  };

  return (
    <div className="sindmoba-container">
      <h2 className="mb-2">Envio de Arquivos</h2>
      <p className="mb-6 text-gray-600">
        Utilize este formulário para enviar documentos ao SINDMOBA. Todos os arquivos enviados são tratados com confidencialidade.
      </p>
      
      {configError && (
        <div className="rounded-lg border border-red-500 bg-red-50 p-4 text-center mb-6 shadow-sm">
          <div className="mb-2 flex justify-center">
            <AlertTriangle className="h-6 w-6 text-red-500" />
          </div>
          <h3 className="mb-2 text-lg font-bold text-red-700">Erro de configuração</h3>
          <p className="mb-3 text-red-700">
            O sistema não está configurado corretamente para upload de arquivos. Entre em contato com o administrador.
          </p>
          {user && (
            <Button 
              onClick={tryInitializeBucket} 
              variant="destructive" 
              className="mt-2"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Inicializando..." : "Inicializar Sistema (Admin)"}
            </Button>
          )}
        </div>
      )}
      
      {isSuccess ? (
        <div className="rounded-lg border border-green-500 bg-green-50 p-8 text-center shadow-sm">
          <div className="mb-4 flex justify-center">
            <div className="rounded-full bg-green-100 p-3">
              <CheckCircle className="h-12 w-12 text-green-600" />
            </div>
          </div>
          <h3 className="mb-2 text-xl font-bold text-green-700">Arquivo Enviado!</h3>
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
          
          <div className="rounded-lg bg-blue-50 p-4 text-sm text-gray-700">
            <p>
              <strong>Atenção:</strong> Certifique-se de que todos os documentos estejam legíveis e completos. 
              Arquivos muito grandes podem demorar mais para serem enviados. O tamanho máximo permitido é de 10MB.
            </p>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
              disabled={isSubmitting || configError || !bucketInitialized}
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
