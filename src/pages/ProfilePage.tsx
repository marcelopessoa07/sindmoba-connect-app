
import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Database } from '@/integrations/supabase/types';

type SpecialtyType = Database["public"]["Enums"]["specialty_type"];

const ProfilePage = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [profile, setProfile] = useState({
    full_name: '',
    email: '',
    cpf: '',
    phone: '',
    address: '',
    registration_number: '',
    specialty: '' as SpecialtyType | ''
  });
  
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchUserProfile();
    }
  }, [user]);

  const fetchUserProfile = async () => {
    try {
      setIsLoading(true);
      
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user?.id)
        .single();
      
      if (error) {
        throw error;
      }
      
      if (data) {
        setProfile({
          full_name: data.full_name || '',
          email: data.email || '',
          cpf: data.cpf || '',
          phone: data.phone || '',
          address: data.address || '',
          registration_number: data.registration_number || '',
          specialty: data.specialty || ''
        });
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível carregar os dados do perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile(prev => ({ ...prev, [name]: value }));
  };

  const handleSelectChange = (value: string) => {
    setProfile(prev => ({ 
      ...prev, 
      specialty: (value === 'pml' || value === 'pol' ? value : null) as SpecialtyType | null 
    }));
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

  const handleCPFChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formattedCPF = formatCPF(e.target.value);
    setProfile(prev => ({ ...prev, cpf: formattedCPF }));
  };

  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const digits = e.target.value.replace(/\D/g, '');
    
    let formattedValue = digits;
    if (digits.length > 2) {
      formattedValue = digits.replace(/^(\d{2})/, '($1) ');
    }
    if (digits.length > 7) {
      formattedValue = formattedValue.replace(/^(\(\d{2}\) )(\d{5})/, '$1$2-');
    }

    setProfile(prev => ({ ...prev, phone: formattedValue }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) return;
    
    setIsSubmitting(true);
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: profile.full_name,
          cpf: profile.cpf,
          phone: profile.phone,
          address: profile.address,
          registration_number: profile.registration_number,
          specialty: profile.specialty || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);
      
      if (error) throw error;
      
      toast({
        title: 'Perfil atualizado',
        description: 'Seus dados foram atualizados com sucesso.',
      });
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: 'Erro',
        description: 'Não foi possível atualizar o perfil.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="sindmoba-container">
      <h2 className="mb-2">Meu Perfil</h2>
      <p className="mb-6 text-gray-600">
        Visualize e edite suas informações cadastrais.
      </p>
      
      {isLoading ? (
        <div className="flex justify-center p-8">
          <p>Carregando dados do perfil...</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Dados Pessoais</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="full_name" className="block text-sm font-medium text-gray-700">
                  Nome Completo
                </label>
                <Input
                  id="full_name"
                  name="full_name"
                  value={profile.full_name}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                  E-mail
                </label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  value={profile.email}
                  disabled
                  className="bg-gray-100"
                />
                <p className="text-xs text-gray-500">O e-mail não pode ser alterado</p>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="cpf" className="block text-sm font-medium text-gray-700">
                  CPF
                </label>
                <Input
                  id="cpf"
                  name="cpf"
                  value={profile.cpf}
                  onChange={handleCPFChange}
                  maxLength={14}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                  Telefone
                </label>
                <Input
                  id="phone"
                  name="phone"
                  value={profile.phone}
                  onChange={handlePhoneChange}
                  maxLength={15}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="address" className="block text-sm font-medium text-gray-700">
                  Endereço
                </label>
                <Input
                  id="address"
                  name="address"
                  value={profile.address}
                  onChange={handleChange}
                />
              </div>
            </div>
          </div>
          
          <div className="rounded-lg border bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-lg font-semibold">Dados Profissionais</h3>
            
            <div className="space-y-4">
              <div className="space-y-2">
                <label htmlFor="registration_number" className="block text-sm font-medium text-gray-700">
                  CRM / CRO
                </label>
                <Input
                  id="registration_number"
                  name="registration_number"
                  value={profile.registration_number}
                  onChange={handleChange}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="specialty" className="block text-sm font-medium text-gray-700">
                  Especialidade
                </label>
                <Select 
                  value={profile.specialty || null} 
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger id="specialty">
                    <SelectValue placeholder="Selecione sua especialidade" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">Não especificado</SelectItem>
                    <SelectItem value="pml">Perito Médico Legal (PML)</SelectItem>
                    <SelectItem value="pol">Perito Odonto Legal (POL)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button 
              type="submit" 
              className="bg-sindmoba-primary hover:bg-sindmoba-secondary"
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Salvando...' : 'Salvar Alterações'}
            </Button>
          </div>
        </form>
      )}
    </div>
  );
};

export default ProfilePage;
