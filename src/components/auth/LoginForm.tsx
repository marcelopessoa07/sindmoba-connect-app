
import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const LoginForm = () => {
  const [loginType, setLoginType] = useState<'email' | 'cpf'>('email');
  const [email, setEmail] = useState('');
  const [cpf, setCpf] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // Use the appropriate identifier based on login type
      const identifier = loginType === 'email' ? email : cpf;
      
      console.log(`Attempting login with: ${identifier} and password`);
      
      // For CPF login, we need to find the user's email first
      let emailToUse = identifier;
      
      if (loginType === 'cpf') {
        // Get the email associated with this CPF
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('email')
          .eq('cpf', identifier.replace(/\D/g, ''))
          .single();
          
        if (profileError || !profileData?.email) {
          throw new Error('CPF não encontrado no sistema');
        }
        
        emailToUse = profileData.email;
        console.log(`Found email ${emailToUse} for CPF ${identifier}`);
      }
      
      // Now sign in with the email
      const { error } = await supabase.auth.signInWithPassword({
        email: emailToUse,
        password,
      });

      if (error) throw error;

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao SINDMOBA Connect",
      });
      navigate('/main');
    } catch (error: any) {
      console.error('Login error:', error);
      toast({
        title: "Erro ao fazer login",
        description: error.message || "Verifique suas credenciais e tente novamente",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const digits = value.replace(/\D/g, '');
    
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
      <div className="mb-6 flex justify-center">
        <div className="h-24 w-24 rounded-full bg-sindmoba-primary p-3">
          <div className="flex h-full w-full items-center justify-center rounded-full bg-white text-3xl font-bold text-sindmoba-primary">
            SM
          </div>
        </div>
      </div>
      
      <h1 className="mb-2 text-center text-2xl font-bold text-sindmoba-dark">
        Bem-vindo
      </h1>
      <p className="mb-6 text-center text-gray-600">
        Entre com seu {loginType === 'email' ? 'e-mail' : 'CPF'} e senha para acessar sua conta
      </p>

      <div className="mb-6 flex rounded-lg border">
        <button
          className={`flex-1 py-2 text-center ${
            loginType === 'email'
              ? 'bg-sindmoba-primary text-white'
              : 'bg-white text-gray-700'
          }`}
          onClick={() => setLoginType('email')}
        >
          E-mail
        </button>
        <button
          className={`flex-1 py-2 text-center ${
            loginType === 'cpf'
              ? 'bg-sindmoba-primary text-white'
              : 'bg-white text-gray-700'
          }`}
          onClick={() => setLoginType('cpf')}
        >
          CPF
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {loginType === 'email' ? (
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
        ) : (
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
        )}

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              Senha
            </label>
            <Link to="/forgot-password" className="text-xs text-sindmoba-primary hover:underline">
              Esqueceu a senha?
            </Link>
          </div>
          <Input
            id="password"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        <Button 
          type="submit" 
          className="w-full bg-sindmoba-primary hover:bg-sindmoba-secondary"
          disabled={isLoading}
        >
          {isLoading ? 'Entrando...' : 'Entrar'}
        </Button>
      </form>

      <div className="mt-8 text-center">
        <p className="text-sm text-gray-600">
          Ainda não é sindicalizado?{' '}
          <Link to="/register" className="font-medium text-sindmoba-primary hover:underline">
            Filie-se agora
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginForm;
