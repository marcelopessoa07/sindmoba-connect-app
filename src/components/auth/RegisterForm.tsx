
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/components/ui/use-toast';

const RegisterForm = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [specialization, setSpecialization] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (password !== confirmPassword) {
      toast({
        title: "Erro de validação",
        description: "As senhas não correspondem",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      toast({
        title: "Solicitação enviada com sucesso!",
        description: "Seu cadastro está sendo analisado. Entraremos em contato em breve.",
      });
      navigate('/login');
    }, 1000);
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

  return (
    <div className="mx-auto w-full max-w-md p-6">
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
          <label htmlFor="specialization" className="block text-sm font-medium text-gray-700">
            Especialidade
          </label>
          <Select value={specialization} onValueChange={setSpecialization}>
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
          <label htmlFor="password" className="block text-sm font-medium text-gray-700">
            Senha
          </label>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700">
            Confirmar Senha
          </label>
          <Input
            id="confirmPassword"
            type="password"
            placeholder="••••••••"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
          />
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full bg-sindmoba-primary hover:bg-sindmoba-secondary"
            disabled={isLoading}
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
