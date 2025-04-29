
import Documents from '@/components/modules/Documents';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

const DocumentsPage = () => {
  const { user } = useAuth();

  useEffect(() => {
    // Log user status to help debug document access
    if (user) {
      console.log("User authenticated, can access documents");
    } else {
      console.log("User not authenticated, limited document access");
    }
  }, [user]);

  return <Documents />;
};

export default DocumentsPage;
