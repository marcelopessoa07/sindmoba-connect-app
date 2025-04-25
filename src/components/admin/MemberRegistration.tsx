
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { InfoIcon } from 'lucide-react';

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
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    // Clear error when user starts typing again
    if (error) setError(null);
  };

  const handleSpecializationChange = (value: string) => {
    setFormData(prev => ({ ...prev, specialization: value }));
    if (error) setError(null);
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
    if (error) setError(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use the create-member edge function instead of direct admin API
      const { data, error: fnError } = await supabase.functions.invoke('create-member', {
        body: {
          email: formData.email,
          full_name: formData.fullName,
          cpf: formData.cpf,
          specialty: formData.specialization,
          registration_number: formData.professionalId,
        },
      });

      if (fnError) throw new Error(fnError.message);
      
      if (data?.error) throw new Error(data.error);

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
      console.error('Registration error:', error);
      setError(error.message);
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
      
      {error && (
        <Alert variant="destructive" className="mb-6">
          <InfoIcon className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
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
