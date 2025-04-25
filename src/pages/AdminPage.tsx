
import { useState, useEffect } from 'react';
import MemberRegistration from '@/components/admin/MemberRegistration';
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
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { useToast } from '@/hooks/use-toast';
import { Eye, Pencil, UserPlus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface Member {
  id: string;
  email: string;
  full_name: string | null;
  cpf: string | null;
  phone: string | null;
  role: string | null;
  specialty: string | null;
  registration_number: string | null;
  created_at: string | null;
}

const AdminPage = () => {
  const [members, setMembers] = useState<Member[]>([]);
  const [loading, setLoading] = useState(true);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [viewingMember, setViewingMember] = useState<Member | null>(null);
  const [editingMember, setEditingMember] = useState<Member | null>(null);
  const [formData, setFormData] = useState({
    full_name: '',
    cpf: '',
    phone: '',
    registration_number: '',
    specialty: '',
    role: '',
  });
  const { toast } = useToast();
  
  const roles = ["admin", "member"];
  const specialties = ["pml", "pol"];
  
  useEffect(() => {
    fetchMembers();
  }, []);
  
  const fetchMembers = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      setMembers(data || []);
    } catch (error) {
      console.error('Error fetching members:', error);
      toast({
        title: 'Erro ao carregar membros',
        description: 'Não foi possível carregar a lista de membros. Tente novamente mais tarde.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };
  
  const openViewDialog = (member: Member) => {
    setViewingMember(member);
    setIsViewDialogOpen(true);
  };
  
  const openEditDialog = (member: Member) => {
    setEditingMember(member);
    setFormData({
      full_name: member.full_name || '',
      cpf: member.cpf || '',
      phone: member.phone || '',
      registration_number: member.registration_number || '',
      specialty: member.specialty || '',
      role: member.role || 'member',
    });
    setIsEditDialogOpen(true);
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
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!editingMember) return;
    
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name || null,
          cpf: formData.cpf || null,
          phone: formData.phone || null,
          registration_number: formData.registration_number || null,
          specialty: formData.specialty || null,
          role: formData.role,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editingMember.id);

      if (error) throw error;
      
      toast({
        title: 'Membro atualizado',
        description: 'As informações do membro foram atualizadas com sucesso.',
      });
      
      setIsEditDialogOpen(false);
      fetchMembers(); // Refresh the list
    } catch (error) {
      console.error('Error updating member:', error);
      toast({
        title: 'Erro ao atualizar',
        description: 'Não foi possível atualizar as informações do membro. Tente novamente.',
        variant: 'destructive',
      });
    }
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('pt-BR');
  };

  const getRoleBadge = (role: string | null) => {
    switch (role) {
      case 'admin':
        return <span className="px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">Administrador</span>;
      case 'member':
        return <span className="px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">Membro</span>;
      default:
        return <span className="px-2 py-1 rounded text-xs bg-gray-100 text-gray-800">Indefinido</span>;
    }
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
    <AdminLayout title="Gerenciamento de Membros">
      <Tabs defaultValue="members">
        <TabsList className="mb-4">
          <TabsTrigger value="members">Membros Cadastrados</TabsTrigger>
          <TabsTrigger value="register">Cadastrar Novo Membro</TabsTrigger>
        </TabsList>
        
        <TabsContent value="members">
          <div className="space-y-4">
            <p className="text-gray-600">
              Gerencie os membros cadastrados no sistema.
            </p>

            {loading ? (
              <div className="text-center py-8">
                <p>Carregando membros...</p>
              </div>
            ) : members.length > 0 ? (
              <div className="rounded-lg border bg-white shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[250px]">Nome</TableHead>
                      <TableHead>E-mail</TableHead>
                      <TableHead>Função</TableHead>
                      <TableHead>Especialidade</TableHead>
                      <TableHead>Data de Cadastro</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {members.map((member) => (
                      <TableRow key={member.id}>
                        <TableCell className="font-medium">{member.full_name || 'Não informado'}</TableCell>
                        <TableCell>{member.email}</TableCell>
                        <TableCell>{getRoleBadge(member.role)}</TableCell>
                        <TableCell>{getSpecialtyLabel(member.specialty)}</TableCell>
                        <TableCell>{formatDate(member.created_at)}</TableCell>
                        <TableCell className="text-right">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openViewDialog(member)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => openEditDialog(member)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            ) : (
              <div className="text-center py-8 rounded-lg border bg-white shadow-sm">
                <p>Não há membros cadastrados.</p>
                <Button 
                  onClick={() => document.getElementById('register-tab')?.click()}
                  variant="outline" 
                  className="mt-4"
                >
                  <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Primeiro Membro
                </Button>
              </div>
            )}
          </div>
          
          {/* View Member Dialog */}
          <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Detalhes do Membro</DialogTitle>
              </DialogHeader>
              {viewingMember && (
                <div className="space-y-4 py-4">
                  <div className="flex items-center justify-center mb-4">
                    <div className="h-20 w-20 rounded-full bg-sindmoba-primary flex items-center justify-center">
                      <span className="text-2xl font-bold text-white">
                        {viewingMember.full_name 
                          ? viewingMember.full_name.split(' ').map(n => n[0]).join('').substring(0, 2).toUpperCase()
                          : viewingMember.email.substring(0, 2).toUpperCase()}
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-center mb-4">
                    <h2 className="text-xl font-bold">{viewingMember.full_name || 'Nome não informado'}</h2>
                    <p className="text-gray-500">{viewingMember.email}</p>
                    <div className="mt-2">{getRoleBadge(viewingMember.role)}</div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 border-t border-b py-4">
                    <div>
                      <h3 className="text-sm text-gray-500">Especialidade</h3>
                      <p>{getSpecialtyLabel(viewingMember.specialty)}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">Nº de Registro</h3>
                      <p>{viewingMember.registration_number || 'Não informado'}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="text-sm text-gray-500">CPF</h3>
                      <p>{viewingMember.cpf || 'Não informado'}</p>
                    </div>
                    <div>
                      <h3 className="text-sm text-gray-500">Telefone</h3>
                      <p>{viewingMember.phone || 'Não informado'}</p>
                    </div>
                  </div>
                  
                  <div>
                    <h3 className="text-sm text-gray-500">Data de Cadastro</h3>
                    <p>{formatDate(viewingMember.created_at)}</p>
                  </div>
                </div>
              )}
              <DialogFooter>
                <Button 
                  variant="outline"
                  onClick={() => {
                    setIsViewDialogOpen(false);
                    viewingMember && openEditDialog(viewingMember);
                  }}
                >
                  <Pencil className="h-4 w-4 mr-2" /> Editar
                </Button>
                <DialogClose asChild>
                  <Button>Fechar</Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          
          {/* Edit Member Dialog */}
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Editar Membro</DialogTitle>
              </DialogHeader>
              <form onSubmit={handleSubmit}>
                <div className="space-y-4 py-4">
                  {editingMember && (
                    <>
                      <div className="text-center mb-4">
                        <p className="text-gray-500">{editingMember.email}</p>
                      </div>
                      
                      <div className="grid w-full gap-2">
                        <Label htmlFor="full_name">Nome Completo</Label>
                        <Input
                          id="full_name"
                          name="full_name"
                          value={formData.full_name}
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
                            value={formData.cpf}
                            onChange={handleInputChange}
                            placeholder="Digite o CPF"
                          />
                        </div>
                        <div className="grid w-full gap-2">
                          <Label htmlFor="phone">Telefone</Label>
                          <Input
                            id="phone"
                            name="phone"
                            value={formData.phone}
                            onChange={handleInputChange}
                            placeholder="Digite o telefone"
                          />
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="grid w-full gap-2">
                          <Label htmlFor="specialty">Especialidade</Label>
                          <Select 
                            value={formData.specialty} 
                            onValueChange={(value) => handleSelectChange('specialty', value)}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione a especialidade" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="">Não especificado</SelectItem>
                              {specialties.map((specialty) => (
                                <SelectItem key={specialty} value={specialty}>
                                  {getSpecialtyLabel(specialty)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="grid w-full gap-2">
                          <Label htmlFor="registration_number">Nº de Registro</Label>
                          <Input
                            id="registration_number"
                            name="registration_number"
                            value={formData.registration_number}
                            onChange={handleInputChange}
                            placeholder="Digite o número de registro"
                          />
                        </div>
                      </div>
                      
                      <div className="grid w-full gap-2">
                        <Label htmlFor="role">Função</Label>
                        <Select 
                          value={formData.role} 
                          onValueChange={(value) => handleSelectChange('role', value)}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione a função" />
                          </SelectTrigger>
                          <SelectContent>
                            {roles.map((role) => (
                              <SelectItem key={role} value={role}>
                                {role === 'admin' ? 'Administrador' : 'Membro'}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type="button" variant="outline">
                      Cancelar
                    </Button>
                  </DialogClose>
                  <Button type="submit">
                    Salvar Alterações
                  </Button>
                </DialogFooter>
              </form>
            </DialogContent>
          </Dialog>
        </TabsContent>
        
        <TabsContent value="register" id="register-tab">
          <MemberRegistration onRegistrationSuccess={fetchMembers} />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
};

export default AdminPage;
