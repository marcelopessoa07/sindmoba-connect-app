
import Documents from '@/components/modules/Documents';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

const DocumentsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    // Log user status to help debug document access
    if (user) {
      console.log("User authenticated, can access documents");
    } else {
      console.log("User not authenticated, limited document access");
      
      // Show a toast informing non-authenticated users
      toast({
        title: "Acesso limitado",
        description: "Faça login para ter acesso completo aos documentos",
        duration: 5000,
      });
    }
  }, [user, toast]);

  return <Documents />;
};

export default DocumentsPage;
