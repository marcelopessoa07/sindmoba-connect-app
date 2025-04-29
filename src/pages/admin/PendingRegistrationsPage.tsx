
import { useState, useEffect } from 'react';
import AdminLayout from '@/components/admin/AdminLayout';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { useToast } from '@/hooks/use-toast';
import { Database } from '@/integrations/supabase/types';
import { RefreshCw, Mail } from 'lucide-react';

// Define our own type for profile data that includes the status field
type ProfileWithStatus = {
  id: string;
  full_name: string | null;
  email: string;
  cpf: string | null;
  specialty: Database['public']['Enums']['specialty_type'] | null;
  created_at: string | null;
  status: string;
};

// Define a type for raw profile data from database with required status field
type RawProfile = {
  id: string;
  full_name: string | null;
  email: string;
  cpf: string | null;
  specialty: Database['public']['Enums']['specialty_type'] | null;
  created_at: string | null;
  status: string;
  // Add other profile properties that might come from the database
  phone?: string;
  registration_number?: string;
  address?: string;
  role?: string;
  updated_at?: string;
};

const PendingRegistrationsPage = () => {
  const [pendingUsers, setPendingUsers] = useState<ProfileWithStatus[]>([]);
  const [loading, setLoading] = useState(true);
  const [resendingEmail, setResendingEmail] = useState<string | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      if (data) {
        // Map the data to our ProfileWithStatus type
        const mappedData: ProfileWithStatus[] = data.map((item: any) => ({
          id: item.id,
          full_name: item.full_name,
          email: item.email || '',
          cpf: item.cpf,
          specialty: item.specialty,
          created_at: item.created_at,
          status: item.status || 'pending'
        }));
        
        setPendingUsers(mappedData);
      } else {
        setPendingUsers([]);
      }
    } catch (error) {
      console.error('Error fetching pending users:', error);
      toast({
        title: 'Erro ao carregar solicitações',
        description: 'Não foi possível carregar a lista de solicitações pendentes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (userId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'active' } as Record<string, any>)
        .eq('id', userId);

      if (updateError) throw updateError;

      toast({
        title: 'Usuário aprovado',
        description: 'O usuário foi aprovado com sucesso.',
      });

      // Refresh the list
      fetchPendingUsers();
    } catch (error) {
      console.error('Error approving user:', error);
      toast({
        title: 'Erro ao aprovar usuário',
        description: 'Não foi possível aprovar o usuário. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleResendInvite = async (userId: string, email: string) => {
    try {
      setResendingEmail(userId);
      
      const { data, error } = await supabase.functions.invoke('send-invite', {
        body: { email }
      });

      if (error) throw error;
      
      toast({
        title: 'Email reenviado',
        description: `Um novo email de convite foi enviado para ${email}.`,
      });
    } catch (error: any) {
      console.error('Error resending invite:', error);
      toast({
        title: 'Erro ao reenviar email',
        description: 'Edge Function returned a non-2xx status code',
        variant: 'destructive',
      });
    } finally {
      setResendingEmail(null);
    }
  };

  return (
    <AdminLayout title="Solicitações de Filiação Pendentes">
      <div className="space-y-4">
        <p className="text-gray-600">
          Gerencie as solicitações de filiação pendentes. Analise os dados e entre em contato com os solicitantes.
        </p>

        {loading ? (
          <div className="text-center py-8">
            <p>Carregando solicitações...</p>
          </div>
        ) : pendingUsers.length > 0 ? (
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>E-mail</TableHead>
                  <TableHead>CPF</TableHead>
                  <TableHead>Especialidade</TableHead>
                  <TableHead>Data da Solicitação</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.full_name || 'Não informado'}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{user.cpf || 'Não informado'}</TableCell>
                    <TableCell>
                      {user.specialty === 'pml' ? 'Perito Médico Legal' : 
                       user.specialty === 'pol' ? 'Perito Odonto Legal' : 
                       'Não informado'}
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at || '').toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell className="text-right flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleResendInvite(user.id, user.email)}
                        disabled={resendingEmail === user.id}
                      >
                        {resendingEmail === user.id ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Mail className="h-4 w-4" />}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleApprove(user.id)}
                      >
                        Aprovar
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
            <p>Não há solicitações pendentes.</p>
          </div>
        )}
      </div>
    </AdminLayout>
  );
};

export default PendingRegistrationsPage;
