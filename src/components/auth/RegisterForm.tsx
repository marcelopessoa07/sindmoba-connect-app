
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/FileUploader';

const RegisterForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [professionalId, setProfessionalId] = useState('');
  const [registrationNumber, setRegistrationNumber] = useState(''); // Novo campo para matrícula
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [currentJob, setCurrentJob] = useState('');
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [fileSize, setFileSize] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    setIsLoading(true);

    try {
      console.log("Starting registration request process");
      
      // Submit to pending_registrations instead of creating a user
      const { data, error } = await supabase
        .from('pending_registrations')
        .insert({
          email,
          full_name: fullName,
          cpf,
          specialty: specialization,
          registration_number: professionalId,
          registration_code: registrationNumber, // Novo campo de matrícula
          phone,
          address,
          current_job: currentJob,
          document_id: fileId
        });

      console.log("Registration request response:", { data, error });

      if (error) throw error;

      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Sua solicitação foi recebida. Nossa equipe entrará em contato em breve.",
      });
      
      // Wait a short time before navigating to ensure the toast is seen
      setTimeout(() => {
        navigate('/login');
      }, 2000);
      
    } catch (error: any) {
      console.error("Registration error:", error);
      
      let errorMessage = error.message;
      
      // Handle specific error cases
      if (error.message.includes("duplicate key value violates unique constraint")) {
        errorMessage = "Este e-mail já está em uso. Por favor use outro e-mail ou entre em contato com o suporte.";
      }
      
      toast({
        title: "Erro ao enviar solicitação",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    // Only allow digits
    const digits = value.replace(/\D/g, '');
    
    // Apply CPF format: 000.000.000-00
    let formattedValue = digits;
    if (digits.length > 3) {
      formattedValue = digits.replace(/^(\d{3})/, '$1.');
    }
    if (digits.length > 6) {
      formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
    }
    if (digits.length > 9) {
      formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
    }

    return formattedValue;
  };

  const formatPhoneNumber = (value: string) => {
    // Remove anything that's not a digit
    const digits = value.replace(/\D/g, '');
    
    // Apply phone format: (00) 00000-0000
    let formattedValue = digits;
    if (digits.length > 2) {
      formattedValue = digits.replace(/^(\d{2})/, '($1) ');
    }
    if (digits.length > 7) {
      formattedValue = formattedValue.replace(/^(\(\d{2}\) )(\d{5})/, '$1$2-');
    }

    return formattedValue;
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPhone(formatPhoneNumber(e.target.value));
  };

  const handleFileUploaded = (fileData: { id: string, name: string, size: number }) => {
    setFileId(fileData.id);
    setFileName(fileData.name);
    setFileSize(fileData.size);
  };

  const handleUploadProgress = (isCurrentlyUploading: boolean) => {
    setIsUploading(isCurrentlyUploading);
  };

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-6 flex justify-center">
        <div className="h-24 w-24">
          <img 
            src="/lovable-uploads/f871b032-f7fc-43cb-83e4-3f6d2381d1e6.png" 
            alt="SINDMOBA Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <h1 className="mb-2 text-center text-2xl font-bold text-sindmoba-dark">
        Filiação ao Sindicato
      </h1>
      <p className="mb-6 text-center text-gray-600">
        Preencha o formulário abaixo para iniciar sua filiação
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="space-y-2">
          <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
            Nome Completo
          </label>
          <Input
            id="fullName"
            type="text"
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="email" className="block text-sm font-medium text-gray-700">
            E-mail
          </label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
            CPF
          </label>
          <Input
            id="cpf"
            type="text"
            placeholder="000.000.000-00"
            value={cpf}
            onChange={(e) => setCpf(formatCPF(e.target.value))}
            maxLength={14}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
            Telefone
          </label>
          <Input
            id="phone"
            type="text"
            placeholder="(00) 00000-0000"
            value={phone}
            onChange={handlePhoneChange}
            maxLength={15}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="address" className="block text-sm font-medium text-gray-700">
            Endereço Completo
          </label>
          <Textarea
            id="address"
            placeholder="Rua, número, bairro, cidade, estado e CEP"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
            Especialidade
          </label>
          <Select value={specialization} onValueChange={setSpecialization} required>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Selecione sua especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pml">Perito Médico Legal (PML)</SelectItem>
              <SelectItem value="pol">Perito Odonto Legal (POL)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="professionalId" className="block text-sm font-medium text-gray-700">
            Número de Registro Profissional (CRM/CRO)
          </label>
          <Input
            id="professionalId"
            type="text"
            placeholder="Seu número de registro"
            value={professionalId}
            onChange={(e) => setProfessionalId(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="registrationNumber" className="block text-sm font-medium text-gray-700">
            Matrícula
          </label>
          <Input
            id="registrationNumber"
            type="text"
            placeholder="Número da sua matrícula"
            value={registrationNumber}
            onChange={(e) => setRegistrationNumber(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="currentJob" className="block text-sm font-medium text-gray-700">
            Cargo Atual
          </label>
          <Input
            id="currentJob"
            type="text"
            placeholder="Seu cargo atual"
            value={currentJob}
            onChange={(e) => setCurrentJob(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">
            Documentação (PDF)
          </label>
          <FileUploader 
            bucket="registration-documents"
            acceptedFileTypes={["application/pdf"]}
            maxFileSize={5}
            onFileUploaded={handleFileUploaded}
            onUploadProgress={handleUploadProgress}
          />
          {fileName && (
            <p className="text-sm text-green-600">
              Arquivo enviado: {fileName}
            </p>
          )}
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full bg-sindmoba-primary hover:bg-sindmoba-secondary"
            disabled={isLoading || isUploading || !fileId}
          >
            {isLoading ? 'Enviando...' : 'Solicitar Filiação'}
          </Button>
        </div>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Já é sindicalizado?{' '}
          <Link to="/login" className="font-medium text-sindmoba-primary hover:underline">
            Faça login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default RegisterForm;
