
import Events from '@/components/modules/Events';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContentTimestamps } from '@/hooks/use-content-timestamps';

const EventsPage = () => {
  const { user } = useAuth();
  const [timestamps, newContent] = useContentTimestamps();

  useEffect(() => {
    // Update the timestamp for events when this page is visited
    if (user && timestamps.events) {
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
      
      updateTimestamp('events');
    }
  }, [user, timestamps]);

  return <Events />;
};

export default EventsPage;
