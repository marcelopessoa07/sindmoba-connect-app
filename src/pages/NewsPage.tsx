
import News from '@/components/modules/News';
import { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useContentTimestamps } from '@/hooks/use-content-timestamps';

const NewsPage = () => {
  const { user } = useAuth();
  const [timestamps, newContent] = useContentTimestamps();

  useEffect(() => {
    // Update the timestamp for news when this page is visited
    if (user && timestamps.news) {
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
      
      updateTimestamp('news');
    }
  }, [user, timestamps]);

  return <News />;
};

export default NewsPage;
