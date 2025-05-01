
import Documents from '@/components/modules/Documents';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContentTimestamps } from '@/hooks/use-content-timestamps';

const DocumentsPage = () => {
  const { user } = useAuth();
  const [timestamps, newContent, markAllAsRead] = useContentTimestamps();

  useEffect(() => {
    // Log user status to help debug document access
    if (user) {
      console.log("User authenticated, can access documents", user.id);
    } else {
      console.log("User not authenticated, limited document access");
    }
    
    // Update the timestamp for documents when this page is visited
    if (user && timestamps.documents) {
      const updateTimestamp = (contentType: 'news' | 'documents' | 'events') => {
        const now = new Date();
        const updatedTimestamps = {
          ...timestamps,
          [contentType]: now
        };
        
        // Save to localStorage
        localStorage.setItem(
          `content_timestamps_${user.id}`, 
          JSON.stringify({
            ...updatedTimestamps,
            [contentType]: now.toISOString()
          })
        );
      };
      
      updateTimestamp('documents');
    }
  }, [user, timestamps]);

  return <Documents />;
};

export default DocumentsPage;
