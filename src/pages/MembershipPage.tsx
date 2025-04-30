
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
import { FileUploader } from '@/components/FileUploader';

const MembershipPage = () => {
  const [formData, setFormData] = useState({
    fullName: '',
    cpf: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: 'BA',
    professionalId: '',
    type: '',
    workplace: '',
    currentJob: '',
    comments: '',
  });
  
  const [fileId, setFileId] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleSelectChange = (name: string, value: string) => {
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setFormData(prevState => ({
      ...prevState,
      cpf: formattedCPF
    }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow digits
    const digits = e.target.value.replace(/\D/g, '');
    
    // Apply phone format: (00) 00000-0000
    let formattedValue = digits;
    if (digits.length > 2) {
      formattedValue = digits.replace(/^(\d{2})/, '($1) ');
    }
    if (digits.length > 7) {
      formattedValue = formattedValue.replace(/^(\(\d{2}\) )(\d{5})/, '$1$2-');
    }

    setFormData(prevState => ({
      ...prevState,
      phone: formattedValue
    }));
  };

  const handleFileUploaded = (fileData: { id: string, name: string, size: number }) => {
    setFileId(fileData.id);
    setFileName(fileData.name);
  };

  const handleUploadProgress = (isCurrentlyUploading: boolean) => {
    setIsUploading(isCurrentlyUploading);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.fullName || !formData.cpf || !formData.email || !formData.type || !fileId) {
      toast({
        title: "Erro no formulário",
        description: "Por favor, preencha todos os campos obrigatórios e envie o documento PDF.",
        variant: "destructive",
      });
      return;
    }
    
    setIsSubmitting(true);

    // Simulate API call
    setTimeout(() => {
      setIsSubmitting(false);
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Sua solicitação de filiação foi recebida. Entraremos em contato em breve.",
      });
      
      // Reset form
      setFormData({
        fullName: '',
        cpf: '',
        email: '',
        phone: '',
        address: '',
        city: '',
        state: 'BA',
        professionalId: '',
        type: '',
        workplace: '',
        currentJob: '',
        comments: '',
      });
      setFileId(null);
      setFileName(null);
    }, 1500);
  };

  return (
    <div className="sindmoba-container">
      <h2 className="mb-2">Filiação ao Sindicato</h2>
      <p className="mb-6 text-gray-600">
        Preencha o formulário abaixo com seus dados para iniciar o processo de filiação ao SINDMOBA.
      </p>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Dados Pessoais */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Dados Pessoais</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="fullName" className="block text-sm font-medium text-gray-700">
                Nome Completo *
              </label>
              <Input
                id="fullName"
                name="fullName"
                value={formData.fullName}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                CPF *
              </label>
              <Input
                id="cpf"
                name="cpf"
                value={formData.cpf}
                onChange={handleCPFChange}
                maxLength={14}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                E-mail *
              </label>
              <Input
                id="email"
                name="email"
                type="email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Telefone
              </label>
              <Input
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handlePhoneChange}
                maxLength={15}
              />
            </div>
          </div>
        </div>
        
        {/* Endereço */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Endereço</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                Endereço Completo
              </label>
              <Input
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label htmlFor="city" className="block text-sm font-medium text-gray-700">
                  Cidade
                </label>
                <Input
                  id="city"
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="state" className="block text-sm font-medium text-gray-700">
                  Estado
                </label>
                <Select 
                  value={formData.state} 
                  onValueChange={(value) => handleSelectChange('state', value)}
                >
                  <SelectTrigger id="state">
                    <SelectValue placeholder="Selecione" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BA">Bahia</SelectItem>
                    <SelectItem value="AC">Acre</SelectItem>
                    <SelectItem value="AL">Alagoas</SelectItem>
                    <SelectItem value="AP">Amapá</SelectItem>
                    <SelectItem value="AM">Amazonas</SelectItem>
                    <SelectItem value="CE">Ceará</SelectItem>
                    <SelectItem value="DF">Distrito Federal</SelectItem>
                    <SelectItem value="ES">Espírito Santo</SelectItem>
                    <SelectItem value="GO">Goiás</SelectItem>
                    <SelectItem value="MA">Maranhão</SelectItem>
                    <SelectItem value="MT">Mato Grosso</SelectItem>
                    <SelectItem value="MS">Mato Grosso do Sul</SelectItem>
                    <SelectItem value="MG">Minas Gerais</SelectItem>
                    <SelectItem value="PA">Pará</SelectItem>
                    <SelectItem value="PB">Paraíba</SelectItem>
                    <SelectItem value="PR">Paraná</SelectItem>
                    <SelectItem value="PE">Pernambuco</SelectItem>
                    <SelectItem value="PI">Piauí</SelectItem>
                    <SelectItem value="RJ">Rio de Janeiro</SelectItem>
                    <SelectItem value="RN">Rio Grande do Norte</SelectItem>
                    <SelectItem value="RS">Rio Grande do Sul</SelectItem>
                    <SelectItem value="RO">Rondônia</SelectItem>
                    <SelectItem value="RR">Roraima</SelectItem>
                    <SelectItem value="SC">Santa Catarina</SelectItem>
                    <SelectItem value="SP">São Paulo</SelectItem>
                    <SelectItem value="SE">Sergipe</SelectItem>
                    <SelectItem value="TO">Tocantins</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        </div>
        
        {/* Dados Profissionais */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Dados Profissionais</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label htmlFor="professionalId" className="block text-sm font-medium text-gray-700">
                CRM / CRO *
              </label>
              <Input
                id="professionalId"
                name="professionalId"
                value={formData.professionalId}
                onChange={handleChange}
                required
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="type" className="block text-sm font-medium text-gray-700">
                Especialidade *
              </label>
              <Select 
                value={formData.type} 
                onValueChange={(value) => handleSelectChange('type', value)}
              >
                <SelectTrigger id="type">
                  <SelectValue placeholder="Selecione sua especialidade" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="pml">Perito Médico Legal (PML)</SelectItem>
                  <SelectItem value="pol">Perito Odonto Legal (POL)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="workplace" className="block text-sm font-medium text-gray-700">
                Local de Trabalho
              </label>
              <Input
                id="workplace"
                name="workplace"
                value={formData.workplace}
                onChange={handleChange}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="currentJob" className="block text-sm font-medium text-gray-700">
                Cargo Atual
              </label>
              <Input
                id="currentJob"
                name="currentJob"
                value={formData.currentJob}
                onChange={handleChange}
              />
            </div>
          </div>
        </div>
        
        {/* Documentação */}
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h3 className="mb-4 text-lg font-semibold">Documentação</h3>
          
          <div className="space-y-4">
            <div className="space-y-2">
              <label className="block text-sm font-medium text-gray-700">
                Documento PDF *
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
          </div>
        </div>
        
        <div className="space-y-2">
          <label htmlFor="comments" className="block text-sm font-medium text-gray-700">
            Observações
          </label>
          <Textarea
            id="comments"
            name="comments"
            value={formData.comments}
            onChange={handleChange}
            placeholder="Informações adicionais que você gostaria de compartilhar"
            className="h-24"
          />
        </div>
        
        <div className="rounded-lg bg-sindmoba-light p-4 text-sm text-gray-700">
          <p>Após o envio do formulário, nossa equipe analisará seus dados e entrará em contato para 
             prosseguir com o processo de filiação. Você receberá um e-mail com as próximas etapas.</p>
        </div>
        
        <div className="flex justify-end">
          <Button 
            type="submit" 
            className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
            disabled={isSubmitting || isUploading || !fileId}
          >
            {isSubmitting ? 'Enviando...' : 'Enviar Solicitação'}
          </Button>
        </div>
      </form>
    </div>
  );
};

export default MembershipPage;
