
import { useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { 
  notifyNewDocuments, 
  sendEventReminder, 
  notifyNewNews,
  notifyNewEvent,
  shouldDeliverNotification
} from '@/utils/notifications';
import { addDays, isBefore, parseISO, format } from 'date-fns';
import { pt } from 'date-fns/locale';

export const useNotifications = () => {
  const { user } = useAuth();
  
  // Monitor for new documents
  useEffect(() => {
    if (!user) return;
    
    // Get the user's specialty from the profile
    const fetchUserProfile = async () => {
      const { data: profile } = await supabase
        .from('profiles')
        .select('specialty')
        .eq('id', user.id)
        .single();
        
      const userSpecialty = profile?.specialty || null;
      
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
        
      // Monitor for new documents for all users
      const allDocumentsChannel = supabase
        .channel('public:documents:all')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'documents'
          },
          async (payload) => {
            // Check if this is a document for all users
            const { data } = await supabase
              .from('document_recipients')
              .select('recipient_type')
              .eq('document_id', payload.new.id)
              .eq('recipient_type', 'all')
              .single();
              
            if (data) {
              notifyNewDocuments(payload.new.title);
            }
          }
        )
        .subscribe();
      
      // Monitor for new news
      const newsChannel = supabase
        .channel('public:news')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'news'
          },
          (payload) => {
            // Check if this notification is for this user based on specialty
            if (shouldDeliverNotification(userSpecialty, payload.new.notify_target)) {
              notifyNewNews(payload.new.title);
            }
          }
        )
        .subscribe();
        
      // Monitor for new events
      const eventsChannel = supabase
        .channel('public:events')
        .on('postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'events'
          },
          (payload) => {
            // The notify_target property is now available on the events table
            if (shouldDeliverNotification(userSpecialty, payload.new.notify_target)) {
              const eventDate = format(
                parseISO(payload.new.start_date), 
                "dd/MM/yyyy 'às' HH:mm",
                { locale: pt }
              );
              notifyNewEvent(payload.new.title, eventDate);
            }
          }
        )
        .subscribe();
      
      // Check for upcoming events and send reminders
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
            // The notify_target property is now available on the events table
            if (shouldDeliverNotification(userSpecialty, event.notify_target)) {
              const eventDate = parseISO(event.start_date);
              const formattedDate = format(eventDate, "dd 'de' MMMM 'às' HH:mm", { locale: pt });
              
              sendEventReminder(
                event.title,
                formattedDate
              );
            }
          });
        }
      };
      
      // Check once immediately
      checkUpcomingEvents();
      
      // Then check every 12 hours
      const intervalId = setInterval(checkUpcomingEvents, 12 * 60 * 60 * 1000);
      
      return () => {
        supabase.removeChannel(documentChannel);
        supabase.removeChannel(allDocumentsChannel);
        supabase.removeChannel(newsChannel);
        supabase.removeChannel(eventsChannel);
        clearInterval(intervalId);
      };
    };
    
    fetchUserProfile();
  }, [user]);
};
