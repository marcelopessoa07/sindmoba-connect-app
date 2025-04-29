
import AdminLayout from '@/components/admin/AdminLayout';
import ContactSettingsForm from '@/components/admin/ContactSettingsForm';

const AdminContactsPage = () => {
  return (
    <AdminLayout title="Gerenciamento de Contatos">
      <div className="space-y-6">
        <div className="rounded-lg border bg-white p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold">Informações de Contato do Sindicato</h2>
          <p className="mb-4 text-gray-600">
            Configure os emails e números de contato que serão exibidos para os membros.
          </p>
          
          <ContactSettingsForm />
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminContactsPage;
