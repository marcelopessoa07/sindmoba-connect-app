import { useState, useRef } from 'react';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import FileUploader from '@/components/FileUploader';
import { supabase } from '@/integrations/supabase/client';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  first_name: z.string().min(1, 'Nome é obrigatório'),
  last_name: z.string().min(1, 'Sobrenome é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().optional(),
  birth_date: z.string().optional(),
  registration_number: z.string().min(1, 'Número de registro é obrigatório'),
  specialty: z.enum(['pml', 'pol']),
  address: z.string().optional(),
  bio: z.string().optional(),
  notes: z.string().optional()
});

type FormValues = z.infer<typeof formSchema>;

interface MemberRegistrationProps {
  onRegistrationSuccess?: () => void;
}

const MemberRegistration = ({ onRegistrationSuccess }: MemberRegistrationProps) => {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [documentFile, setDocumentFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset
  } = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      specialty: 'pml'
    }
  });

  const handleAvatarChange = (file: File | null) => {
    setAvatarFile(file);
  };

  const handleDocumentChange = (file: File | null) => {
    setDocumentFile(file);
  };

  const onSubmit = async (data: FormValues) => {
    setIsLoading(true);
    
    try {
      // Generate a random password for the user
      const password = Math.random().toString(36).slice(-12);
      
      console.log("Creating user with email:", data.email);

      // Create the user with Supabase Auth
      const { data: authData, error: authError } = await supabase.auth.admin.createUser({
        email: data.email,
        password,
        email_confirm: true,
        user_metadata: {
          first_name: data.first_name,
          last_name: data.last_name,
          full_name: `${data.first_name} ${data.last_name}`,
          phone: data.phone,
          registration_number: data.registration_number,
          specialty: data.specialty,
          address: data.address,
          birth_date: data.birth_date
        }
      });

      if (authError) {
        throw new Error(`Erro ao criar usuário: ${authError.message}`);
      }

      const userId = authData.user.id;
      console.log("User created with ID:", userId);

      // Update the public profile in the profiles table
      const profileData = {
        role: 'member',
        approved_at: new Date().toISOString(),
        full_name: `${data.first_name} ${data.last_name}`,
        phone: data.phone,
        registration_number: data.registration_number,
        specialty: data.specialty,
        address: data.address,
        bio: data.bio,
        birth_date: data.birth_date,
        notes: data.notes,
        is_active: true
      };

      const { error: profileError } = await supabase
        .from('profiles')
        .update(profileData)
        .eq('id', userId);

      if (profileError) {
        throw new Error(`Erro ao atualizar perfil: ${profileError.message}`);
      }

      // Upload avatar if provided
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const filePath = `avatars/${userId}.${fileExt}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('avatars')
          .upload(filePath, avatarFile, {
            upsert: true
          });

        if (uploadError) {
          console.error("Avatar upload error:", uploadError);
          // Continue with document upload
        }
      }

      // Upload document if provided
      if (documentFile) {
        const fileExt = documentFile.name.split('.').pop();
        const filePath = `documents/${userId}_id.${fileExt}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('documents')
          .upload(filePath, documentFile, {
            upsert: true
          });

        if (uploadError) {
          console.error("Document upload error:", uploadError);
        }
      }

      // Send welcome email with password
      const { error: functionError } = await supabase.functions.invoke('send-invite', {
        body: {
          email: data.email,
          password,
          name: data.first_name
        }
      });

      if (functionError) {
        console.error("Error sending welcome email:", functionError);
      }

      toast({
        title: "Membro registrado com sucesso",
        description: "Um e-mail de boas-vindas foi enviado com as informações de login.",
      });

      // Reset form
      reset();
      setAvatarFile(null);
      setDocumentFile(null);
      if (formRef.current) {
        formRef.current.reset();
      }
      
      // Call onRegistrationSuccess if provided
      if (onRegistrationSuccess) {
        onRegistrationSuccess();
      }
      
    } catch (error: any) {
      console.error("Registration error:", error);
      toast({
        title: "Erro ao registrar membro",
        description: error.message || "Ocorreu um erro ao registrar o novo membro.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} ref={formRef} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações Pessoais</h3>
          
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="first_name">Nome</Label>
              <Input 
                id="first_name" 
                {...register('first_name')} 
                disabled={isLoading}
              />
              {errors.first_name && (
                <p className="text-sm text-destructive">{errors.first_name.message}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="last_name">Sobrenome</Label>
              <Input 
                id="last_name" 
                {...register('last_name')} 
                disabled={isLoading}
              />
              {errors.last_name && (
                <p className="text-sm text-destructive">{errors.last_name.message}</p>
              )}
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input 
              id="email" 
              type="email"
              {...register('email')} 
              disabled={isLoading}
            />
            {errors.email && (
              <p className="text-sm text-destructive">{errors.email.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">Telefone</Label>
            <Input 
              id="phone" 
              {...register('phone')} 
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="birth_date">Data de Nascimento</Label>
            <Input 
              id="birth_date" 
              type="date"
              {...register('birth_date')} 
              disabled={isLoading}
            />
          </div>
        </div>
        
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Informações Profissionais</h3>
          
          <div className="space-y-2">
            <Label htmlFor="registration_number">Número de Registro</Label>
            <Input 
              id="registration_number" 
              {...register('registration_number')} 
              disabled={isLoading}
            />
            {errors.registration_number && (
              <p className="text-sm text-destructive">{errors.registration_number.message}</p>
            )}
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="specialty">Especialidade</Label>
            <Select 
              disabled={isLoading}
              onValueChange={(value) => {}}
              defaultValue="pml"
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma especialidade" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="pml">Perícia Médica Legal</SelectItem>
                <SelectItem value="pol">Polícia Ostensiva Local</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="address">Endereço</Label>
            <Textarea 
              id="address" 
              {...register('address')} 
              disabled={isLoading}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="bio">Biografia/Resumo Profissional</Label>
            <Textarea 
              id="bio" 
              {...register('bio')} 
              disabled={isLoading}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-4">
        <h3 className="text-lg font-medium">Documentação</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Foto de Perfil</Label>
            <FileUploader 
              bucket="avatars"
              acceptedFileTypes={['image/jpeg', 'image/png']}
              maxFileSize={2} // 2MB
              onFileUploaded={handleAvatarChange}
            />
          </div>
          
          <div className="space-y-2">
            <Label>Documento de Identidade</Label>
            <FileUploader 
              bucket="documents"
              acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
              maxFileSize={5} // 5MB
              onFileUploaded={handleDocumentChange}
            />
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        <Label htmlFor="notes">Observações Adicionais</Label>
        <Textarea 
          id="notes" 
          {...register('notes')}
          disabled={isLoading}
        />
      </div>
      
      <Button type="submit" className="w-full" disabled={isLoading}>
        {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {isLoading ? "Registrando..." : "Registrar Membro"}
      </Button>
    </form>
  );
};

export default MemberRegistration;
