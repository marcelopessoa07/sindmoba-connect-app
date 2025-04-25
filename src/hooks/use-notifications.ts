
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { notifyNewDocuments, sendEventReminder } from '@/utils/notifications';
import { addDays, isBefore, parseISO, format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const useNotifications = () => {
  const { user } = useAuth();
  
  // Monitor for new documents
  useEffect(() => {
    if (!user) return;
    
    const documentChannel = supabase
      .channel('public:document_recipients')
      .on('postgres_changes', 
        {
          event: 'INSERT',
          schema: 'public',
          table: 'document_recipients',
          filter: `recipient_id=eq.${user.id}`
        },
        async (payload) => {
          // Get document information
          const { data } = await supabase
            .from('documents')
            .select('title')
            .eq('id', payload.new.document_id)
            .single();
            
          if (data) {
            notifyNewDocuments(data.title);
          }
        }
      )
      .subscribe();
    
    return () => {
      supabase.removeChannel(documentChannel);
    };
  }, [user]);
  
  // Check for upcoming events and send reminders
  useEffect(() => {
    if (!user) return;
    
    const checkUpcomingEvents = async () => {
      const tomorrow = addDays(new Date(), 1);
      tomorrow.setHours(0, 0, 0, 0);
      
      const { data: events } = await supabase
        .from('events')
        .select('*')
        .gte('start_date', tomorrow.toISOString())
        .lte('start_date', addDays(tomorrow, 1).toISOString());
      
      if (events && events.length > 0) {
        events.forEach(event => {
          const eventDate = parseISO(event.start_date);
          const formattedDate = format(eventDate, "dd 'de' MMMM 'às' HH:mm", { locale: pt });
          
          sendEventReminder(
            event.title,
            formattedDate
          );
        });
      }
    };
    
    // Check once immediately
    checkUpcomingEvents();
    
    // Then check every 12 hours
    const intervalId = setInterval(checkUpcomingEvents, 12 * 60 * 60 * 1000);
    
    return () => {
      clearInterval(intervalId);
    };
  }, [user]);
};
