
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!email) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe seu e-mail",
        variant: "destructive",
      });
      return false;
    }

    if (!password) {
      toast({
        title: "Campo obrigatório",
        description: "Por favor, informe sua senha",
        variant: "destructive",
      });
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsLoading(true);

    try {      
      console.log(`Attempting login with: ${email} and password`);
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Supabase auth error:', error);
        throw error;
      }

      if (!data.user || !data.session) {
        throw new Error('Falha na autenticação');
      }

      toast({
        title: "Login realizado com sucesso!",
        description: "Bem-vindo ao SINDMOBA Connect",
      });
      
      setTimeout(() => {
        navigate('/main');
      }, 500);
      
    } catch (error: any) {
      console.error('Login error:', error);
      
      let errorMessage = "Verifique suas credenciais e tente novamente";
      
      if (error.message?.includes('Invalid login credentials')) {
        errorMessage = "E-mail ou senha incorretos";
      } else if (error.message) {
        errorMessage = error.message;
      }
      
      toast({
        title: "Erro ao fazer login",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="mx-auto w-full max-w-md p-6">
      <div className="mb-8 flex justify-center">
        <div className="h-40 w-40">
          <img 
            src="/lovable-uploads/f871b032-f7fc-43cb-83e4-3f6d2381d1e6.png" 
            alt="SINDMOBA Logo" 
            className="w-full h-full object-contain"
          />
        </div>
      </div>
      
      <h1 className="mb-2 text-center text-2xl font-bold text-sindmoba-dark">
        Bem-vindo
      </h1>
      <p className="mb-6 text-center text-gray-600">
        Entre com seu e-mail e senha para acessar sua conta
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
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
