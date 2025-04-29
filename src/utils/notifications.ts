
import { toast } from "@/hooks/use-toast";

// Check if the browser supports notifications
const isNotificationSupported = () => {
  return 'Notification' in window;
};

// Request permission for notifications
export const requestNotificationPermission = async () => {
  if (!isNotificationSupported()) {
    console.log('This browser does not support notifications');
    return false;
  }
  
  try {
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  } catch (error) {
    console.error('Error requesting notification permission:', error);
    return false;
  }
};

// Send a push notification
export const sendNotification = (title: string, options?: NotificationOptions) => {
  if (!isNotificationSupported()) {
    // Fallback to toast notification
    toast({
      title,
      description: options?.body,
      duration: 5000,
    });
    return;
  }

  if (Notification.permission === 'granted') {
    new Notification(title, options);
  } else if (Notification.permission !== 'denied') {
    requestNotificationPermission().then(permission => {
      if (permission) {
        new Notification(title, options);
      }
    });
  } else {
    // Fallback to toast notification if permission is denied
    toast({
      title,
      description: options?.body,
      duration: 5000,
    });
  }
};

// Check for new documents and notify user
export const notifyNewDocuments = (documentTitle: string) => {
  sendNotification('Novo documento disponível', {
    body: `O documento "${documentTitle}" foi disponibilizado para você.`,
    icon: '/favicon.ico'
  });
};

// Send event reminder
export const sendEventReminder = (eventTitle: string, eventDate: string) => {
  sendNotification('Lembrete de evento', {
    body: `O evento "${eventTitle}" acontecerá em 24 horas (${eventDate}).`,
    icon: '/favicon.ico'
  });
};

// Notify about new news articles
export const notifyNewNews = (newsTitle: string) => {
  sendNotification('Nova notícia publicada', {
    body: `A notícia "${newsTitle}" foi publicada pelo SINDMOBA.`,
    icon: '/favicon.ico'
  });
};

// Notify about new events
export const notifyNewEvent = (eventTitle: string, eventDate: string) => {
  sendNotification('Novo evento agendado', {
    body: `O evento "${eventTitle}" foi agendado para ${eventDate}.`,
    icon: '/favicon.ico'
  });
};

// Check if the notification should be delivered to this user
export const shouldDeliverNotification = (userSpecialty: string | null, targetSpecialty: string | null): boolean => {
  // If no target specialty is specified (null or 'all'), deliver to everyone
  if (!targetSpecialty || targetSpecialty === 'all') {
    return true;
  }
  
  // If the notification is targeted but user has no specialty, don't deliver
  if (!userSpecialty) {
    return false;
  }
  
  // Deliver if the user's specialty matches the target specialty
  return userSpecialty === targetSpecialty;
};
