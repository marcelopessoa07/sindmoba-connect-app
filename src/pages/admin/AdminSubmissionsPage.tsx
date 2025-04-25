
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Eye, Trash2, CheckCircle, XCircle, File as FileIcon } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Submission {
  id: string;
  user_id: string;
  document_type: string;
  observations: string | null;
  file_url: string;
  file_name: string;
  file_size: number;
  file_type: string;
  status: string;
  created_at: string | null;
  updated_at: string | null;
  user_email?: string;
  user_name?: string;
}

const AdminSubmissionsPage = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingSubmission, setViewingSubmission] = useState<Submission | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { toast } = useToast();

  // Document types for filtering
  const documentTypes = [
    'Documento Pessoal',
    'Documento Profissional',
    'Atestado Médico',
    'Relatório',
    'Requerimento',
    'Outro'
  ];

  // Status options
  const statusOptions = [
    { value: 'pending', label: 'Pendente', color: 'bg-yellow-100 text-yellow-800' },
    { value: 'approved', label: 'Aprovado', color: 'bg-green-100 text-green-800' },
    { value: 'rejected', label: 'Rejeitado', color: 'bg-red-100 text-red-800' },
    { value: 'reviewed', label: 'Revisado', color: 'bg-blue-100 text-blue-800' }
  ];

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      
      // Fetch submissions
      const { data, error } = await supabase
        .from('member_submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      // Fetch user details for each submission
      const submissionsWithUserDetails = await Promise.all(
        (data || []).map(async (submission) => {
          try {
            const { data: profileData } = await supabase
              .from('profiles')
              .select('email, full_name')
              .eq('id', submission.user_id)
              .single();
              
            return {
              ...submission,
              user_email: profileData?.email || 'Usuário não encontrado',
              user_name: profileData?.full_name || 'Nome não disponível'
            };
          } catch (err) {
            console.error('Error fetching user details:', err);
            return {
              ...submission,
              user_email: 'Erro ao carregar',
              user_name: 'Erro ao carregar'
            };
          }
        })
      );

      setSubmissions(submissionsWithUserDetails);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast({
        title: 'Erro ao carregar envios',
        description: 'Não foi possível carregar a lista de arquivos enviados. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const openViewDialog = (submission: Submission) => {
    setViewingSubmission(submission);
    setIsViewDialogOpen(true);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('pt-BR');
  };

  const handleStatusChange = async (submissionId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('member_submissions')
        .update({ 
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', submissionId);

      if (error) throw error;
      
      // Update local state
      setSubmissions(submissions.map(sub => 
        sub.id === submissionId ? { ...sub, status: newStatus } : sub
      ));
      
      if (viewingSubmission && viewingSubmission.id === submissionId) {
        setViewingSubmission({ ...viewingSubmission, status: newStatus });
      }
      
      toast({
        title: 'Status atualizado',
        description: `O status do documento foi alterado para "${statusOptions.find(opt => opt.value === newStatus)?.label}".`,
      });
    } catch (error) {
      console.error('Error updating status:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar o status do documento. Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Tem certeza que deseja excluir este arquivo? Esta ação não pode ser desfeita.')) {
      try {
        const submissionToDelete = submissions.find(sub => sub.id === id);
        
        if (submissionToDelete) {
          // Delete file from storage
          await supabase
            .storage
            .from('member-submissions')
            .remove([submissionToDelete.file_url]);
          
          // Delete record from database
          const { error } = await supabase
            .from('member_submissions')
            .delete()
            .eq('id', id);

          if (error) throw error;
          
          // Remove from local state
          setSubmissions(submissions.filter(sub => sub.id !== id));
          
          toast({
            title: 'Arquivo excluído',
            description: 'O arquivo foi excluído com sucesso.',
          });
        }
      } catch (error) {
        console.error('Error deleting submission:', error);
        toast({
          title: 'Erro ao excluir',
          description: 'Não foi possível excluir o arquivo. Tente novamente.',
          variant: 'destructive',
        });
      }
    }
  };

  const getStatusBadge = (status: string) => {
    const statusOption = statusOptions.find(opt => opt.value === status);
    return (
      <span className={`px-2 py-1 rounded text-xs ${statusOption?.color || 'bg-gray-100 text-gray-800'}`}>
        {statusOption?.label || status}
      </span>
    );
  };

  const filteredSubmissions = statusFilter === 'all' 
    ? submissions 
    : submissions.filter(sub => sub.status === statusFilter);

  return (
    <AdminLayout title="Gerenciamento de Arquivos Enviados">
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <p className="text-gray-600">
            Gerencie os arquivos enviados pelos membros do sindicato.
          </p>
          <div className="w-64">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filtrar por status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os status</SelectItem>
                {statusOptions.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p>Carregando arquivos enviados...</p>
          </div>
        ) : filteredSubmissions.length > 0 ? (
          <div className="rounded-lg border bg-white shadow-sm">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[250px]">Arquivo</TableHead>
                  <TableHead>Tipo</TableHead>
                  <TableHead>Membro</TableHead>
                  <TableHead>Data de Envio</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredSubmissions.map((submission) => (
                  <TableRow key={submission.id}>
                    <TableCell className="font-medium">{submission.file_name}</TableCell>
                    <TableCell>{submission.document_type}</TableCell>
                    <TableCell>{submission.user_name}</TableCell>
                    <TableCell>{formatDate(submission.created_at)}</TableCell>
                    <TableCell>
                      {getStatusBadge(submission.status)}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => openViewDialog(submission)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(submission.id, 'approved')}
                        className="text-green-600"
                      >
                        <CheckCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleStatusChange(submission.id, 'rejected')}
                        className="text-red-600"
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(submission.id)}
                      >
                        <Trash2 className="h-4 w-4 text-sindmoba-danger" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
            <p>Não há arquivos enviados {statusFilter !== 'all' ? `com status "${statusOptions.find(opt => opt.value === statusFilter)?.label}"` : ''}.</p>
          </div>
        )}
      </div>

      {/* View Submission Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>Detalhes do Arquivo</DialogTitle>
          </DialogHeader>
          {viewingSubmission && (
            <div className="space-y-4 py-4">
              <div className="flex items-center">
                <div className="mr-4 rounded-lg bg-sindmoba-light p-3">
                  <FileIcon className="h-6 w-6 text-sindmoba-primary" />
                </div>
                <div>
                  <h2 className="font-bold">{viewingSubmission.file_name}</h2>
                  <p className="text-sm text-gray-500">
                    {formatFileSize(viewingSubmission.file_size)} • {viewingSubmission.file_type}
                  </p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                <div>
                  <h3 className="text-sm text-gray-500">Enviado por</h3>
                  <p className="font-medium">{viewingSubmission.user_name}</p>
                  <p className="text-sm">{viewingSubmission.user_email}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Data de envio</h3>
                  <p>{formatDate(viewingSubmission.created_at)}</p>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm text-gray-500">Tipo de documento</h3>
                  <p>{viewingSubmission.document_type}</p>
                </div>
                <div>
                  <h3 className="text-sm text-gray-500">Status atual</h3>
                  <div className="mt-1">{getStatusBadge(viewingSubmission.status)}</div>
                </div>
              </div>
              
              {viewingSubmission.observations && (
                <div>
                  <h3 className="text-sm text-gray-500">Observações</h3>
                  <p>{viewingSubmission.observations}</p>
                </div>
              )}
              
              <div className="border-t pt-4">
                <h3 className="text-sm text-gray-500 mb-2">Alterar status</h3>
                <div className="flex space-x-2">
                  {statusOptions.map(option => (
                    <Button
                      key={option.value}
                      variant="outline"
                      size="sm"
                      className={viewingSubmission.status === option.value ? 'border-2 border-sindmoba-primary' : ''}
                      onClick={() => handleStatusChange(viewingSubmission.id, option.value)}
                    >
                      {option.label}
                    </Button>
                  ))}
                </div>
              </div>
              
              <div className="flex justify-center pt-2">
                <Button asChild>
                  <a 
                    href={`${supabase.storage.from('member-submissions').getPublicUrl(viewingSubmission.file_url).data.publicUrl}`} 
                    target="_blank" 
                    rel="noopener noreferrer"
                  >
                    Visualizar Arquivo
                  </a>
                </Button>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button 
              variant="destructive"
              onClick={() => viewingSubmission && handleDelete(viewingSubmission.id)}
            >
              Excluir Arquivo
            </Button>
            <DialogClose asChild>
              <Button variant="outline">Fechar</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
};

export default AdminSubmissionsPage;
