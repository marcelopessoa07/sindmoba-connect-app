
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

// Updated interface that properly matches the Supabase profiles table
// and includes the status field which is being used in our code
interface ProfileData {
  id: string;
  full_name: string | null;
  email: string;
  cpf: string | null;
  specialty: 'pml' | 'pol' | null;
  created_at: string | null;
  role: string | null;
  phone: string | null;
  registration_number: string | null;
  address: string | null;
  updated_at: string | null;
  status: string | null;  // Added this missing field
}

const PendingRegistrationsPage = () => {
  const [pendingUsers, setPendingUsers] = useState<ProfileData[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingUsers();
  }, []);

  const fetchPendingUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Ensure data is properly typed
      setPendingUsers(data as ProfileData[] || []);
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
      // Update the status in the profiles table
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ status: 'active' })
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
                    <TableCell className="text-right">
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
