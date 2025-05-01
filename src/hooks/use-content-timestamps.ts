
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ContentTimestamps {
  news: Date | null;
  documents: Date | null;
  events: Date | null;
}

interface NewContentFlags {
  hasNewNews: boolean;
  hasNewDocuments: boolean;
  hasNewEvents: boolean;
  isLoading: boolean;
}

export function useContentTimestamps(): [ContentTimestamps, NewContentFlags, () => void] {
  const { user } = useAuth();
  const [timestamps, setTimestamps] = useState<ContentTimestamps>({
    news: null,
    documents: null,
    events: null,
  });
  const [newContent, setNewContent] = useState<NewContentFlags>({
    hasNewNews: false,
    hasNewDocuments: false,
    hasNewEvents: false,
    isLoading: true,
  });

  // Load and check timestamps
  useEffect(() => {
    if (!user) return;

    const loadTimestamps = async () => {
      try {
        // Get user's timestamps from local storage
        const storedTimestamps = localStorage.getItem(`content_timestamps_${user.id}`);
        const parsedTimestamps = storedTimestamps ? JSON.parse(storedTimestamps) : {
          news: null,
          documents: null,
          events: null,
        };
        
        // Convert string dates to Date objects
        const formattedTimestamps = {
          news: parsedTimestamps.news ? new Date(parsedTimestamps.news) : null,
          documents: parsedTimestamps.documents ? new Date(parsedTimestamps.documents) : null,
          events: parsedTimestamps.events ? new Date(parsedTimestamps.events) : null,
        };
        
        setTimestamps(formattedTimestamps);
        
        // Check for new content
        await checkForNewContent(formattedTimestamps);
      } catch (error) {
        console.error('Error loading content timestamps:', error);
      }
    };

    loadTimestamps();
  }, [user]);

  // Check if there's new content by comparing with the latest content dates
  const checkForNewContent = async (currentTimestamps: ContentTimestamps) => {
    if (!user) return;
    
    try {
      // Get user profile for specialty filtering
      const { data: profile } = await supabase
        .from('profiles')
        .select('specialty')
        .eq('id', user.id)
        .single();
      
      const userSpecialty = profile?.specialty || null;
      
      // Fetch latest news date
      const { data: latestNews } = await supabase
        .from('news')
        .select('created_at')
        .or(`notify_target.eq.all,and(notify_target.eq.specialty,specialty.eq.${userSpecialty || ''})`)
        .order('created_at', { ascending: false })
        .limit(1);

      // Fetch latest documents date
      const { data: documentRecipients } = await supabase
        .from('document_recipients')
        .select(`
          document_id,
          recipient_type,
          specialty,
          recipient_id
        `)
        .or(`recipient_type.eq.all,and(recipient_type.eq.specialty,specialty.eq.${userSpecialty || ''}),and(recipient_type.eq.specific,recipient_id.eq.${user.id})`);

      let latestDocumentDate = null;
      
      if (documentRecipients && documentRecipients.length > 0) {
        const documentIds = documentRecipients.map(dr => dr.document_id);
        
        const { data: documents } = await supabase
          .from('documents')
          .select('created_at')
          .in('id', documentIds)
          .order('created_at', { ascending: false })
          .limit(1);
          
        latestDocumentDate = documents && documents.length > 0 ? documents[0].created_at : null;
      }

      // Fetch latest events date
      const { data: latestEvents } = await supabase
        .from('events')
        .select('created_at')
        .or(`notify_target.eq.all,notify_target.eq.${userSpecialty || ''}`)
        .order('created_at', { ascending: false })
        .limit(1);

      setNewContent({
        hasNewNews: latestNews && latestNews.length > 0 && currentTimestamps.news ? 
          new Date(latestNews[0].created_at) > currentTimestamps.news : false,
        hasNewDocuments: latestDocumentDate && currentTimestamps.documents ?
          new Date(latestDocumentDate) > currentTimestamps.documents : false,
        hasNewEvents: latestEvents && latestEvents.length > 0 && currentTimestamps.events ?
          new Date(latestEvents[0].created_at) > currentTimestamps.events : false,
        isLoading: false
      });
    } catch (error) {
      console.error('Error checking for new content:', error);
      setNewContent({
        hasNewNews: false,
        hasNewDocuments: false,
        hasNewEvents: false,
        isLoading: false
      });
    }
  };

  // Update timestamp for a specific content type
  const updateTimestamp = (contentType: keyof ContentTimestamps) => {
    if (!user) return;
    
    const now = new Date();
    const updatedTimestamps = {
      ...timestamps,
      [contentType]: now
    };
    
    // Update state
    setTimestamps(updatedTimestamps);
    
    // Reset new content flag
    setNewContent(prev => ({
      ...prev,
      [`hasNew${contentType.charAt(0).toUpperCase() + contentType.slice(1)}`]: false
    }));
    
    // Save to localStorage
    localStorage.setItem(
      `content_timestamps_${user.id}`, 
      JSON.stringify({
        ...updatedTimestamps,
        [contentType]: now.toISOString()
      })
    );
  };

  const markAllAsRead = () => {
    if (!user) return;
    
    const now = new Date();
    const allRead = {
      news: now,
      documents: now,
      events: now
    };
    
    // Update state
    setTimestamps(allRead);
    
    // Reset all new content flags
    setNewContent(prev => ({
      hasNewNews: false,
      hasNewDocuments: false,
      hasNewEvents: false,
      isLoading: false
    }));
    
    // Save to localStorage
    localStorage.setItem(
      `content_timestamps_${user.id}`, 
      JSON.stringify({
        news: now.toISOString(),
        documents: now.toISOString(),
        events: now.toISOString()
      })
    );
  };

  return [timestamps, newContent, markAllAsRead];
}
