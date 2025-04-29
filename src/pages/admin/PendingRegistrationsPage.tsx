
import { useState, useEffect } from 'react';
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
import { useToast } from "@/hooks/use-toast";
import { Mail, CheckCircle, XCircle } from 'lucide-react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Define a simpler interface for pending registrations
interface PendingRegistration {
  id: string;
  email: string;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  registration_number: string | null;
  specialty: "pml" | "pol" | null;
  created_at: string | null;
}

const PendingRegistrationsPage = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchPendingRegistrations();
  }, []);

  const fetchPendingRegistrations = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('pending_registrations')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setPendingRegistrations(data || []);
    } catch (error: any) {
      console.error('Error fetching pending registrations:', error);
      toast({
        title: 'Erro ao carregar solicitações',
        description: error.message || 'Não foi possível carregar as solicitações pendentes.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openApprovalDialog = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setIsApprovalDialogOpen(true);
  };

  const openRejectionDialog = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setIsRejectionDialogOpen(true);
  };

  const handleApproveRegistration = async () => {
    if (!selectedRegistration) return;
    
    setProcessingAction(true);
    
    try {
      // Create the member account using the edge function
      const { error } = await supabase.functions.invoke('create-member', {
        body: { 
          email: selectedRegistration.email,
          full_name: selectedRegistration.full_name,
          cpf: selectedRegistration.cpf,
          phone: selectedRegistration.phone,
          registration_number: selectedRegistration.registration_number,
          specialty: selectedRegistration.specialty
        }
      });

      if (error) throw error;
      
      // Delete from pending registrations
      const { error: deleteError } = await supabase
        .from('pending_registrations')
        .delete()
        .eq('id', selectedRegistration.id);

      if (deleteError) throw deleteError;

      setIsApprovalDialogOpen(false);
      toast({
        title: 'Solicitação aprovada',
        description: `A solicitação de ${selectedRegistration.full_name || selectedRegistration.email} foi aprovada com sucesso.`,
      });
      
      fetchPendingRegistrations(); // Refresh the list
    } catch (error: any) {
      console.error('Error approving registration:', error);
      toast({
        title: 'Erro ao aprovar solicitação',
        description: error.message || 'Ocorreu um erro ao aprovar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };

  const handleRejectRegistration = async () => {
    if (!selectedRegistration) return;
    
    setProcessingAction(true);
    
    try {
      const { error } = await supabase
        .from('pending_registrations')
        .delete()
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      setIsRejectionDialogOpen(false);
      toast({
        title: 'Solicitação rejeitada',
        description: `A solicitação de ${selectedRegistration.full_name || selectedRegistration.email} foi rejeitada.`,
      });
      
      fetchPendingRegistrations(); // Refresh the list
    } catch (error: any) {
      console.error('Error rejecting registration:', error);
      toast({
        title: 'Erro ao rejeitar solicitação',
        description: error.message || 'Ocorreu um erro ao rejeitar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
    }
  };
  
  const handleResendInvite = async (registration: PendingRegistration) => {
    try {
      setResendingEmail(true);
      
      const { error } = await supabase.functions.invoke('send-invite', {
        body: { 
          email: registration.email,
          name: registration.full_name || registration.email
        }
      });

      if (error) throw error;
      
      toast({
        title: 'Email reenviado',
        description: `Um novo email de convite foi enviado para ${registration.email}.`,
      });
    } catch (error: any) {
      console.error('Error resending invite:', error);
      toast({
        title: 'Erro ao reenviar email',
        description: error.message || 'Não foi possível reenviar o email de convite. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setResendingEmail(false);
    }
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };
  
  const getSpecialtyLabel = (specialty: string | null) => {
    switch (specialty) {
      case 'pml':
        return 'Perito Médico Legal';
      case 'pol':
        return 'Perito Odonto Legal';
      default:
        return 'Não especificado';
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Gerencie as solicitações pendentes de filiação ao sindicato.
      </p>

      {loading ? (
        <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
          <p>Carregando solicitações...</p>
        </div>
      ) : pendingRegistrations.length > 0 ? (
        <div className="rounded-lg border bg-white shadow-sm">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[250px]">Nome</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Especialidade</TableHead>
                <TableHead>Data da Solicitação</TableHead>
                <TableHead className="text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pendingRegistrations.map((registration) => (
                <TableRow key={registration.id}>
                  <TableCell className="font-medium">{registration.full_name || 'Não informado'}</TableCell>
                  <TableCell>{registration.email}</TableCell>
                  <TableCell>{getSpecialtyLabel(registration.specialty)}</TableCell>
                  <TableCell>{formatDate(registration.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleResendInvite(registration)}
                      className="mx-1"
                      disabled={resendingEmail}
                      title="Reenviar email"
                    >
                      <Mail className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openApprovalDialog(registration)}
                      className="mx-1"
                      title="Aprovar"
                    >
                      <CheckCircle className="h-4 w-4 text-green-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openRejectionDialog(registration)}
                      className="mx-1"
                      title="Rejeitar"
                    >
                      <XCircle className="h-4 w-4 text-red-500" />
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

      <AlertDialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar esta solicitação? Um email será enviado para o usuário com instruções para definir sua senha.
              {selectedRegistration && (
                <p className="mt-2 font-medium">{selectedRegistration.full_name || selectedRegistration.email}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleApproveRegistration}
              disabled={processingAction}
              className="bg-green-600 text-white hover:bg-green-700"
            >
              {processingAction ? 'Processando...' : 'Aprovar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog open={isRejectionDialogOpen} onOpenChange={setIsRejectionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Rejeitar solicitação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar esta solicitação? Esta ação não pode ser desfeita.
              {selectedRegistration && (
                <p className="mt-2 font-medium">{selectedRegistration.full_name || selectedRegistration.email}</p>
              )}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={processingAction}>Cancelar</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleRejectRegistration}
              disabled={processingAction}
              className="bg-red-600 text-white hover:bg-red-700"
            >
              {processingAction ? 'Processando...' : 'Rejeitar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default PendingRegistrationsPage;
