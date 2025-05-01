
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
import { CheckCircle, XCircle, FileText, Eye, Pencil } from 'lucide-react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogFooter,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// Define a simpler interface for pending registrations
interface PendingRegistration {
  id: string;
  email: string;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  registration_number: string | null;
  registration_code: string | null; // Novo campo para matrícula
  specialty: "pml" | "pol" | null;
  created_at: string | null;
  address: string | null;
  current_job: string | null;
  document_id: string | null;
}

const PendingRegistrationsPage = () => {
  const [pendingRegistrations, setPendingRegistrations] = useState<PendingRegistration[]>([]);
  const [loading, setLoading] = useState(true);
  const [isApprovalDialogOpen, setIsApprovalDialogOpen] = useState(false);
  const [isRejectionDialogOpen, setIsRejectionDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRegistration, setSelectedRegistration] = useState<PendingRegistration | null>(null);
  const [processingAction, setProcessingAction] = useState(false);
  const [formData, setFormData] = useState<Partial<PendingRegistration>>({});
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

      // Cast to our PendingRegistration type
      setPendingRegistrations(data as unknown as PendingRegistration[]);
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

  const openViewDialog = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setIsViewDialogOpen(true);
  };

  const openEditDialog = (registration: PendingRegistration) => {
    setSelectedRegistration(registration);
    setFormData({
      full_name: registration.full_name,
      cpf: registration.cpf,
      phone: registration.phone,
      registration_number: registration.registration_number,
      registration_code: registration.registration_code, // Novo campo para matrícula
      specialty: registration.specialty,
      address: registration.address,
      current_job: registration.current_job,
    });
    setIsEditDialogOpen(true);
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
          registration_code: selectedRegistration.registration_code, // Novo campo para matrícula
          specialty: selectedRegistration.specialty,
          address: selectedRegistration.address,
          current_job: selectedRegistration.current_job,
          document_id: selectedRegistration.document_id
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
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  
  const handleSelectChange = (field: string, value: string) => {
    setFormData({
      ...formData,
      [field]: value,
    });
  };
  
  const handleUpdateRegistration = async () => {
    if (!selectedRegistration) return;
    
    setProcessingAction(true);
    
    try {
      const { error } = await supabase
        .from('pending_registrations')
        .update(formData)
        .eq('id', selectedRegistration.id);

      if (error) throw error;

      setIsEditDialogOpen(false);
      toast({
        title: 'Solicitação atualizada',
        description: `A solicitação de ${selectedRegistration.full_name || selectedRegistration.email} foi atualizada com sucesso.`,
      });
      
      fetchPendingRegistrations(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating registration:', error);
      toast({
        title: 'Erro ao atualizar solicitação',
        description: error.message || 'Ocorreu um erro ao atualizar a solicitação. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setProcessingAction(false);
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

  const viewDocument = (documentId: string | null) => {
    if (!documentId) return;
    
    // Get public URL for the document
    const { data } = supabase.storage
      .from('registration-documents')
      .getPublicUrl(documentId);

    if (data.publicUrl) {
      window.open(data.publicUrl, '_blank');
    }
  };

  return (
    <div className="space-y-4">
      <p className="text-gray-600">
        Gerencie as filiações pendentes ao sindicato.
      </p>

      {loading ? (
        <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
          <p>Carregando filiações pendentes...</p>
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
                      onClick={() => openViewDialog(registration)}
                      className="mx-1"
                      title="Visualizar"
                    >
                      <Eye className="h-4 w-4 text-blue-500" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => openEditDialog(registration)}
                      className="mx-1"
                      title="Editar"
                    >
                      <Pencil className="h-4 w-4 text-orange-500" />
                    </Button>
                    {registration.document_id && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => viewDocument(registration.document_id)}
                        className="mx-1"
                        title="Ver documento"
                      >
                        <FileText className="h-4 w-4 text-gray-500" />
                      </Button>
                    )}
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
          <p>Não há filiações pendentes.</p>
        </div>
      )}

      <AlertDialog open={isApprovalDialogOpen} onOpenChange={setIsApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Aprovar filiação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja aprovar esta filiação? Um email será enviado para o usuário com instruções para definir sua senha.
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
            <AlertDialogTitle>Rejeitar filiação</AlertDialogTitle>
            <AlertDialogDescription>
              Tem certeza que deseja rejeitar esta filiação? Esta ação não pode ser desfeita.
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
      
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes da Solicitação</DialogTitle>
          </DialogHeader>
          {selectedRegistration && (
            <div className="space-y-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-500">Nome Completo</h3>
                  <p className="font-medium">{selectedRegistration.full_name || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Email</h3>
                  <p>{selectedRegistration.email}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-500">CPF</h3>
                  <p>{selectedRegistration.cpf || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Telefone</h3>
                  <p>{selectedRegistration.phone || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-500">Especialidade</h3>
                  <p>{getSpecialtyLabel(selectedRegistration.specialty)}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Nº de Registro</h3>
                  <p>{selectedRegistration.registration_number || 'Não informado'}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-500">Matrícula</h3>
                  <p>{selectedRegistration.registration_code || 'Não informado'}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Cargo Atual</h3>
                  <p>{selectedRegistration.current_job || 'Não informado'}</p>
                </div>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500">Endereço</h3>
                <p>{selectedRegistration.address || 'Não informado'}</p>
              </div>
              
              <div>
                <h3 className="text-sm text-gray-500">Data da Solicitação</h3>
                <p>{formatDate(selectedRegistration.created_at)}</p>
              </div>
              
              {selectedRegistration.document_id && (
                <Button 
                  variant="outline" 
                  onClick={() => viewDocument(selectedRegistration.document_id)}
                  className="flex items-center gap-2"
                >
                  <FileText className="h-4 w-4" /> Visualizar Documento
                </Button>
              )}
            </div>
          )}
          <DialogFooter>
            <Button 
              onClick={() => {
                setIsViewDialogOpen(false);
                selectedRegistration && openEditDialog(selectedRegistration);
              }}
              variant="outline"
              className="mr-2"
            >
              <Pencil className="h-4 w-4 mr-2" /> Editar
            </Button>
            <DialogClose asChild>
              <Button>Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Editar Solicitação</DialogTitle>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); handleUpdateRegistration(); }}>
            <div className="space-y-4 py-4">
              {selectedRegistration && (
                <>
                  <div className="text-center mb-4">
                    <p className="text-gray-500">{selectedRegistration.email}</p>
                  </div>
                  
                  <div className="grid w-full gap-2">
                    <Label htmlFor="full_name">Nome Completo</Label>
                    <Input
                      id="full_name"
                      name="full_name"
                      value={formData.full_name || ''}
                      onChange={handleInputChange}
                      placeholder="Digite o nome completo"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid w-full gap-2">
                      <Label htmlFor="cpf">CPF</Label>
                      <Input
                        id="cpf"
                        name="cpf"
                        value={formData.cpf || ''}
                        onChange={handleInputChange}
                        placeholder="Digite o CPF"
                      />
                    </div>
                    <div className="grid w-full gap-2">
                      <Label htmlFor="phone">Telefone</Label>
                      <Input
                        id="phone"
                        name="phone"
                        value={formData.phone || ''}
                        onChange={handleInputChange}
                        placeholder="Digite o telefone"
                      />
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="grid w-full gap-2">
                      <Label htmlFor="specialty">Especialidade</Label>
                      <Select 
                        value={formData.specialty || ''} 
                        onValueChange={(value) => handleSelectChange('specialty', value)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a especialidade" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="">Não especificado</SelectItem>
                          <SelectItem value="pml">Perito Médico Legal</SelectItem>
                          <SelectItem value="pol">Perito Odonto Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid w-full gap-2">
                      <Label htmlFor="registration_number">Nº de Registro</Label>
                      <Input
                        id="registration_number"
                        name="registration_number"
                        value={formData.registration_number || ''}
                        onChange={handleInputChange}
                        placeholder="Digite o número de registro"
                      />
                    </div>
                  </div>
                  
                  <div className="grid w-full gap-2">
                    <Label htmlFor="registration_code">Matrícula</Label>
                    <Input
                      id="registration_code"
                      name="registration_code"
                      value={formData.registration_code || ''}
                      onChange={handleInputChange}
                      placeholder="Digite o número da matrícula"
                    />
                  </div>
                  
                  <div className="grid w-full gap-2">
                    <Label htmlFor="address">Endereço</Label>
                    <Input
                      id="address"
                      name="address"
                      value={formData.address || ''}
                      onChange={handleInputChange}
                      placeholder="Digite o endereço"
                    />
                  </div>
                  
                  <div className="grid w-full gap-2">
                    <Label htmlFor="current_job">Local de Trabalho Atual</Label>
                    <Input
                      id="current_job"
                      name="current_job"
                      value={formData.current_job || ''}
                      onChange={handleInputChange}
                      placeholder="Digite o local de trabalho atual"
                    />
                  </div>
                </>
              )}
            </div>
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsEditDialogOpen(false)}
                disabled={processingAction}
              >
                Cancelar
              </Button>
              <Button 
                type="submit"
                disabled={processingAction}
              >
                {processingAction ? 'Salvando...' : 'Salvar Alterações'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default PendingRegistrationsPage;
