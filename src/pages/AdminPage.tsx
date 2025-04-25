
import MemberRegistration from '@/components/admin/MemberRegistration';
import AdminLayout from '@/components/admin/AdminLayout';

const AdminPage = () => {
  return (
    <AdminLayout title="Gerenciamento de Membros">
      <MemberRegistration />
    </AdminLayout>
  );
};

export default AdminPage;
