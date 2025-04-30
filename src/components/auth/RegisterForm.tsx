
import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter
} from '@/components/ui/card';
import { FileUploader } from '@/components/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

// Create registration schema
const registerSchema = z.object({
  email: z.string().email({ message: 'E-mail inválido' }),
  password: z.string().min(6, { message: 'A senha deve ter pelo menos 6 caracteres' }),
  confirmPassword: z.string(),
  firstName: z.string().min(1, { message: 'O nome é obrigatório' }),
  lastName: z.string().min(1, { message: 'O sobrenome é obrigatório' }),
}).refine(data => data.password === data.confirmPassword, {
  message: 'As senhas não conferem',
  path: ['confirmPassword'],
});

type RegisterForm = z.infer<typeof registerSchema>;

interface Props {
  onLogin?: () => void;
}

export const RegisterForm: React.FC<Props> = ({ onLogin }) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const [userCreated, setUserCreated] = useState(false);
  
  const { register, handleSubmit, formState: { errors }, reset } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  useEffect(() => {
    if (userCreated) {
      // Reset form after successful registration
      reset();
      setDocumentFile(null);
    }
  }, [userCreated, reset]);

  const handleFileUpload = (file: File | null) => {
    setDocumentFile(file);
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setUserCreated(false);
    
    try {
      // First create the user account with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          data: {
            first_name: data.firstName,
            last_name: data.lastName,
            full_name: `${data.firstName} ${data.lastName}`,
          }
        }
      });
      
      if (authError) throw authError;

      // Now upload the document if available
      if (documentFile && authData.user) {
        const fileExt = documentFile.name.split('.').pop();
        const fileName = `${authData.user.id}_id.${fileExt}`;
        const filePath = `registration/${fileName}`;
        
        // Upload to Supabase Storage
        const { error: uploadError } = await supabase
          .storage
          .from('registration')
          .upload(filePath, documentFile);
        
        if (uploadError) {
          console.error('Document upload failed:', uploadError);
          // We don't throw here because the account was created successfully
          // Just show a warning about the document
          toast({
            title: "Conta criada, mas falha no envio do documento",
            description: "Sua conta foi criada, mas houve um problema ao enviar seu documento de identidade. Você poderá enviá-lo mais tarde.",
            variant: "warning",
          });
        }
      }

      // Show success message
      toast({
        title: "Cadastro realizado com sucesso!",
        description: "Sua solicitação de cadastro foi recebida e está em análise. Você receberá um email quando for aprovado.",
      });
      
      setUserCreated(true);

      // Navigate to login page after a delay
      setTimeout(() => {
        navigate('/login');
        if (onLogin) onLogin();
      }, 1500);

    } catch (error: any) {
      console.error('Registration error:', error);
      toast({
        title: "Erro no cadastro",
        description: error.message || "Houve um erro ao criar sua conta. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>Solicitar Cadastro</CardTitle>
        <CardDescription>
          Preencha seus dados para solicitar acesso. Será necessária aprovação do administrador.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="firstName">Nome</Label>
              <Input 
                id="firstName"
                {...register('firstName')}
                disabled={isLoading}
              />
              {errors.firstName && (
                <p className="text-sm text-red-500">{errors.firstName.message}</p>
              )}
            </div>
            <div className="space-y-2">
              <Label htmlFor="lastName">Sobrenome</Label>
              <Input 
                id="lastName"
                {...register('lastName')}
                disabled={isLoading}
              />
              {errors.lastName && (
                <p className="text-sm text-red-500">{errors.lastName.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input 
              id="email" 
              type="email"
              {...register('email')}
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{errors.email.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Senha</Label>
            <Input 
              id="password" 
              type="password"
              {...register('password')}
              disabled={isLoading}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{errors.password.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="confirmPassword">Confirmar Senha</Label>
            <Input 
              id="confirmPassword" 
              type="password"
              {...register('confirmPassword')}
              disabled={isLoading}
            />
            {errors.confirmPassword && (
              <p className="text-sm text-red-500">{errors.confirmPassword.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="document">Documento de Identificação</Label>
            <FileUploader 
              bucket="registration"
              acceptedFileTypes={[
                'application/pdf',
                'image/jpeg',
                'image/png',
                'image/gif'
              ]}
              maxFileSize={5} // 5MB
              onFileUploaded={handleFileUpload}
            />
          </div>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? 'Enviando...' : 'Criar Conta'}
          </Button>
        </form>
      </CardContent>
      <CardFooter className="justify-center border-t pt-4">
        <Button variant="link" onClick={onLogin} disabled={isLoading}>
          Já tem uma conta? Faça login
        </Button>
      </CardFooter>
    </Card>
  );
};

export default RegisterForm;
