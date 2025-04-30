
import { useState, useEffect, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { FileUploader } from '@/components/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/contexts/AuthContext';

// Define a more specific profile type that includes matricula
interface ProfileData {
  id: string;
  full_name?: string;
  email: string;
  phone?: string;
  registration_number?: string;
  matricula?: string;
  address?: string;
  notes?: string;
  document_id?: string;
  updated_at?: string;
  cpf?: string;
  created_at?: string;
  current_job?: string;
  role?: string;
  specialty?: "pml" | "pol";
}

const membershipSchema = z.object({
  name: z.string().min(1, 'Nome completo é obrigatório'),
  email: z.string().email('Email inválido'),
  phone: z.string().min(1, 'Telefone é obrigatório'),
  registration_number: z.string().min(1, 'Número de registro é obrigatório'),
  matricula: z.string().min(1, 'Matrícula é obrigatória'),
  address: z.string().min(1, 'Endereço é obrigatório'),
  notes: z.string().optional(),
});

type MembershipForm = z.infer<typeof membershipSchema>;

const MembershipPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [idDocumentFile, setIdDocumentFile] = useState<File | null>(null);
  const [registrationDocumentFile, setRegistrationDocumentFile] = useState<File | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [hasExistingRequest, setHasExistingRequest] = useState(false);
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset
  } = useForm<MembershipForm>({
    resolver: zodResolver(membershipSchema)
  });

  useEffect(() => {
    const checkExistingRequest = async () => {
      if (!user) return;

      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .maybeSingle();

        if (error) throw error;
        
        if (data) {
          // Explicitly cast data to our ProfileData interface that includes matricula
          const profileData = data as ProfileData;

          setValue('name', profileData.full_name || '');
          setValue('email', user.email || '');
          setValue('phone', profileData.phone || '');
          setValue('registration_number', profileData.registration_number || '');
          setValue('matricula', profileData.matricula || '');
          setValue('address', profileData.address || '');
        } else {
          if (user.user_metadata?.full_name) {
            setValue('name', user.user_metadata.full_name);
          }
          setValue('email', user.email || '');
        }
      } catch (error) {
        console.error('Error checking existing data:', error);
      }
    };

    checkExistingRequest();
  }, [user, setValue]);

  const handleIdDocumentUpload = (file: File | null) => {
    setIdDocumentFile(file);
  };

  const handleRegistrationDocumentUpload = (file: File | null) => {
    setRegistrationDocumentFile(file);
  };

  const onSubmit = async (data: MembershipForm) => {
    if (!user) {
      toast({
        title: "Erro de autenticação",
        description: "Você precisa estar logado para enviar uma solicitação de filiação.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const now = new Date().toISOString();
      const userId = user.id;

      // Upload documents if provided
      let idDocumentUrl = '';
      let registrationDocumentUrl = '';

      if (idDocumentFile) {
        const fileExt = idDocumentFile.name.split('.').pop();
        const filePath = `membership/${userId}_id_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('membership')
          .upload(filePath, idDocumentFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase
          .storage
          .from('membership')
          .getPublicUrl(filePath);

        idDocumentUrl = urlData.publicUrl;
      }

      if (registrationDocumentFile) {
        const fileExt = registrationDocumentFile.name.split('.').pop();
        const filePath = `membership/${userId}_reg_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase
          .storage
          .from('membership')
          .upload(filePath, registrationDocumentFile);

        if (uploadError) throw uploadError;

        const { data: urlData } = supabase
          .storage
          .from('membership')
          .getPublicUrl(filePath);

        registrationDocumentUrl = urlData.publicUrl;
      }

      // Update profile instead of using membership_requests
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: data.name,
          phone: data.phone,
          registration_number: data.registration_number,
          matricula: data.matricula,
          address: data.address,
          notes: data.notes,
          document_id: idDocumentUrl || undefined,
          updated_at: now
        })
        .eq('id', userId);

      if (error) throw error;

      toast({
        title: hasExistingRequest ? "Solicitação atualizada" : "Solicitação enviada",
        description: hasExistingRequest 
          ? "Sua solicitação de filiação foi atualizada com sucesso." 
          : "Sua solicitação de filiação foi enviada com sucesso.",
      });

      // Reset form and files
      setIdDocumentFile(null);
      setRegistrationDocumentFile(null);
      if (formRef.current) {
        formRef.current.reset();
      }
    } catch (error: any) {
      console.error('Error submitting membership request:', error);
      toast({
        title: "Erro ao enviar solicitação",
        description: error.message || "Ocorreu um erro ao enviar sua solicitação de filiação. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleIdDocumentUpload = (file: File | null) => {
    setIdDocumentFile(file);
  };

  const handleRegistrationDocumentUpload = (file: File | null) => {
    setRegistrationDocumentFile(file);
  };

  return (
    <AppLayout>
      <div className="container py-8">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-bold mb-2">Filiação ao Sindicato</h1>
          <p className="text-gray-600 mb-8">
            Preencha o formulário abaixo para solicitar sua filiação ao SINDMOBA. 
            Nossa equipe analisará sua solicitação e entrará em contato em breve.
          </p>
          
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit(onSubmit)} ref={formRef} className="space-y-6">
              
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome Completo</Label>
                    <Input
                      id="name"
                      {...register('name')}
                      disabled={isSubmitting}
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      disabled={isSubmitting}
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="phone">Telefone</Label>
                    <Input
                      id="phone"
                      {...register('phone')}
                      disabled={isSubmitting}
                    />
                    {errors.phone && (
                      <p className="text-sm text-destructive">{errors.phone.message}</p>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="registration_number">Número de Registro Profissional</Label>
                    <Input
                      id="registration_number"
                      {...register('registration_number')}
                      disabled={isSubmitting}
                    />
                    {errors.registration_number && (
                      <p className="text-sm text-destructive">{errors.registration_number.message}</p>
                    )}
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="matricula">Matrícula</Label>
                  <Input
                    id="matricula"
                    {...register('matricula')}
                    disabled={isSubmitting}
                  />
                  {errors.matricula && (
                    <p className="text-sm text-destructive">{errors.matricula.message}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="address">Endereço Completo</Label>
                  <Textarea
                    id="address"
                    {...register('address')}
                    disabled={isSubmitting}
                    rows={3}
                  />
                  {errors.address && (
                    <p className="text-sm text-destructive">{errors.address.message}</p>
                  )}
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Documento de Identidade (RG ou CNH)</Label>
                    <FileUploader
                      bucket="membership"
                      acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
                      maxFileSize={5}
                      onFileUploaded={handleIdDocumentUpload}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Carteira de Registro Profissional</Label>
                    <FileUploader
                      bucket="membership"
                      acceptedFileTypes={['application/pdf', 'image/jpeg', 'image/png']}
                      maxFileSize={5}
                      onFileUploaded={handleRegistrationDocumentUpload}
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="notes">Observações Adicionais</Label>
                  <Textarea
                    id="notes"
                    {...register('notes')}
                    disabled={isSubmitting}
                    placeholder="Informações adicionais que possam ser relevantes para sua filiação"
                    rows={4}
                  />
                </div>
              </div>
              
              <Button type="submit" size="lg" className="w-full" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {hasExistingRequest ? (isSubmitting ? "Atualizando..." : "Atualizar Solicitação") : 
                 (isSubmitting ? "Enviando..." : "Enviar Solicitação")}
              </Button>
            </form>
          </div>
          
          <div className="mt-8 bg-muted p-4 rounded-md">
            <h3 className="font-medium mb-2">Informações Importantes</h3>
            <ul className="list-disc pl-5 space-y-1 text-sm">
              <li>Sua solicitação será analisada pela diretoria do sindicato.</li>
              <li>Documentos anexados devem estar legíveis e completos.</li>
              <li>O processo de aprovação pode levar até 7 dias úteis.</li>
              <li>Em caso de dúvidas, entre em contato através do email <span className="font-medium">filiacao@sindmoba.org.br</span>.</li>
            </ul>
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default MembershipPage;
