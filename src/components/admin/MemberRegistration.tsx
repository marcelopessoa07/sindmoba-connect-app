
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface MemberRegistrationProps {
  onRegistrationSuccess?: () => void;
}

const MemberRegistration = ({ onRegistrationSuccess }: MemberRegistrationProps) => {
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    cpf: '',
    specialization: '',
    professionalId: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSpecializationChange = (value: string) => {
    setFormData(prev => ({ ...prev, specialization: value }));
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    let formattedValue = digits;
    if (digits.length > 3) formattedValue = digits.replace(/^(\d{3})/, '$1.');
    if (digits.length > 6) formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})/, '$1.$2.');
    if (digits.length > 9) formattedValue = formattedValue.replace(/^(\d{3})\.(\d{3})\.(\d{3})/, '$1.$2.$3-');
    return formattedValue;
  };

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setFormData(prev => ({ ...prev, cpf: formattedCPF }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Create user in Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: formData.email,
        email_confirm: true,
        user_metadata: {
          full_name: formData.fullName,
          cpf: formData.cpf,
          specialty: formData.specialization,
          registration_number: formData.professionalId,
        },
      });

      if (authError) throw authError;

      // 2. Generate password reset link
      const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: formData.email,
      });

      if (resetError) throw resetError;

      // 3. Send welcome email with password reset link
      const response = await supabase.functions.invoke('send-invite', {
        body: {
          email: formData.email,
          name: formData.fullName,
          resetLink: resetData.properties.action_link,
        },
      });

      if (response.error) throw response.error;

      toast({
        title: "Membro cadastrado com sucesso!",
        description: "Um email foi enviado para o novo membro configurar sua senha.",
      });

      // Reset form
      setFormData({
        fullName: '',
        email: '',
        cpf: '',
        specialization: '',
        professionalId: '',
      });
      
      // Call the success callback if provided
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
    } catch (error: any) {
      toast({
        title: "Erro no cadastro",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-6">Cadastrar Novo Membro</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-2">
          <label htmlFor="fullName" className="text-sm font-medium text-gray-700">
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
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
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
          <label htmlFor="cpf" className="text-sm font-medium text-gray-700">
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
          <label htmlFor="specialization" className="text-sm font-medium text-gray-700">
            Especialidade *
          </label>
          <Select value={formData.specialization} onValueChange={handleSpecializationChange}>
            <SelectTrigger>
              <SelectValue placeholder="Selecione a especialidade" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pml">Perito Médico Legal (PML)</SelectItem>
              <SelectItem value="pol">Perito Odonto Legal (POL)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <label htmlFor="professionalId" className="text-sm font-medium text-gray-700">
            Número de Registro Profissional (CRM/CRO) *
          </label>
          <Input
            id="professionalId"
            name="professionalId"
            value={formData.professionalId}
            onChange={handleChange}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full"
          disabled={isLoading}
        >
          {isLoading ? 'Cadastrando...' : 'Cadastrar Membro'}
        </Button>
      </form>
    </div>
  );
};

export default MemberRegistration;
