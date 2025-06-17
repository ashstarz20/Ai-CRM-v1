// import { 
//   createContext, 
//   useContext, 
//   useState, 
//   useEffect, 
//   ReactNode,
//   useCallback
// } from 'react';
// import { v4 as uuidv4 } from 'uuid';

// export type NotificationType = 'lead' | 'meeting';

// export interface Notification {
//   id: string;
//   type: NotificationType;
//   title: string;
//   message: string;
//   date: Date;
//   read: boolean;
//   link?: string;
// }

// interface NotificationContextType {
//   notifications: Notification[];
//   addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
//   markAsRead: (id: string) => void;
//   markAllAsRead: () => void;
//   unreadCount: number;
// }

// const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// export const useNotification = () => {
//   const context = useContext(NotificationContext);
//   if (!context) {
//     throw new Error('useNotification must be used within a NotificationProvider');
//   }
//   return context;
// };

// export const NotificationProvider = ({ children }: { children: ReactNode }) => {
//   const [notifications, setNotifications] = useState<Notification[]>([]);
  
//   useEffect(() => {
//     const stored = localStorage.getItem('notifications');
//     if (stored) {
//       try {
//         const parsed = JSON.parse(stored);
//         // Convert date strings back to Date objects
//         const withDates = parsed.map((n: any) => ({
//           ...n,
//           date: new Date(n.date)
//         }));
//         setNotifications(withDates);
//       } catch (e) {
//         console.error("Failed to parse notifications", e);
//       }
//     }
//   }, []);

//   useEffect(() => {
//     localStorage.setItem('notifications', JSON.stringify(notifications));
//   }, [notifications]);

//   const addNotification = useCallback((notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
//     const newNotification: Notification = {
//       ...notification,
//       id: uuidv4(),
//       date: new Date(),
//       read: false,
//     };
    
//     setNotifications(prev => [newNotification, ...prev]);
//   }, []);

//   const markAsRead = useCallback((id: string) => {
//     setNotifications(prev =>
//       prev.map(notif => 
//         notif.id === id ? { ...notif, read: true } : notif
//       )
//     );
//   }, []);

//   const markAllAsRead = useCallback(() => {
//     setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
//   }, []);

//   const unreadCount = notifications.filter(notif => !notif.read).length;

//   return (
//     <NotificationContext.Provider
//       value={{
//         notifications,
//         addNotification,
//         markAsRead,
//         markAllAsRead,
//         unreadCount
//       }}
//     >
//       {children}
//     </NotificationContext.Provider>
//   );
// };




import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useCallback
} from 'react';
import { v4 as uuidv4 } from 'uuid';

export type NotificationType = 'lead' | 'meeting';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  date: Date;
  read: boolean;
  link?: string;
}

interface NotificationContextType {
  notifications: Notification[];
  addNotification: (notification: Omit<Notification, 'id' | 'date' | 'read'>) => void;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  unreadCount: number;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }: { children: ReactNode }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const stored = localStorage.getItem('notifications');
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        const withDates = parsed.map((n: any) => ({
          ...n,
          date: new Date(n.date)
        }));
        setNotifications(withDates);
      } catch (e) {
        console.error("Failed to parse notifications", e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  }, [notifications]);

  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'date' | 'read'>) => {
    const newNotification: Notification = {
      ...notification,
      id: uuidv4(),
      date: new Date(),
      read: false,
    };
    
    setNotifications(prev => [newNotification, ...prev]);
  }, []);

  const markAsRead = useCallback((id: string) => {
    setNotifications(prev =>
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  }, []);

  const markAllAsRead = useCallback(() => {
    setNotifications(prev => prev.map(notif => ({ ...notif, read: true })));
  }, []);

  const unreadCount = notifications.filter(notif => !notif.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        addNotification,
        markAsRead,
        markAllAsRead,
        unreadCount
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};