// import { format } from 'date-fns';
// import { Bell, Check, X } from 'lucide-react';
// import { useNotification } from '../context/NotificationContext';
// import { Link } from 'react-router-dom';
// import { formatDate, formatRelativeTime } from '../../utils/dateUtils';

// const NotificationPage = () => {
//   const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotification();

//   return (
//     <div className="container mx-auto px-4 py-6 max-w-4xl">
//       <div className="flex items-center justify-between mb-6">
//         <div className="flex items-center gap-3">
//           <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
//             <Bell className="text-blue-600 dark:text-blue-400" size={24} />
//           </div>
//           <div>
//             <h1 className="text-2xl font-bold">Notifications</h1>
//             <p className="text-sm text-gray-600 dark:text-gray-400">
//               {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
//             </p>
//           </div>
//         </div>
        
//         <button
//           onClick={markAllAsRead}
//           className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2 transition-colors"
//           disabled={unreadCount === 0}
//         >
//           <Check size={16} />
//           Mark all as read
//         </button>
//       </div>
      
//       <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border overflow-hidden">
//         {notifications.length > 0 ? (
//           notifications.map(notification => (
//             <div 
//               key={notification.id} 
//               className={`p-5 border-b border-border flex items-start gap-4 ${
//                 notification.read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'
//               }`}
//             >
//               <div className="mt-1">
//                 <div className={`w-3 h-3 rounded-full ${
//                   notification.read ? 'bg-gray-300' : 'bg-blue-500'
//                 }`}></div>
//               </div>
              
//               <div className="flex-1">
//                 <div className="flex justify-between">
//                   <h3 className={`font-medium ${
//                     notification.read 
//                       ? 'text-gray-700 dark:text-gray-300' 
//                       : 'text-blue-700 dark:text-blue-300'
//                   }`}>
//                     {notification.title}
//                   </h3>
//                   <span className="text-xs text-gray-500">
//                     {format(notification.date, 'MMM d, yyyy h:mm a')}
//                   </span>
//                 </div>
                
//                 <p className="mt-2 text-gray-600 dark:text-gray-400">
//                   {notification.message}
//                 </p>
                
//                 {notification.link && (
//                   <Link 
//                     to={notification.link}
//                     className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
//                   >
//                     View details
//                   </Link>
//                 )}
//               </div>
              
//               <button
//                 onClick={() => markAsRead(notification.id)}
//                 className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
//                 title="Mark as read"
//               >
//                 <X size={16} />
//               </button>
//             </div>
//           ))
//         ) : (
//           <div className="py-12 text-center">
//             <Bell className="mx-auto text-gray-400 dark:text-gray-600" size={48} />
//             <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
//               No notifications yet
//             </h3>
//             <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
//               Notifications about leads and meetings will appear here
//             </p>
//           </div>
//         )}
//       </div>
//     </div>
//   );
// };

// export default NotificationPage;



import { Bell, Check, X } from 'lucide-react';
import { useNotification } from '../context/NotificationContext';
import { Link } from 'react-router-dom';
import { formatDate } from '../utils/dateutils';

const NotificationPage = () => {
  const { notifications, markAsRead, markAllAsRead, unreadCount } = useNotification();

  return (
    <div className="container mx-auto px-4 py-6 max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="bg-blue-100 dark:bg-blue-900/30 p-3 rounded-full">
            <Bell className="text-blue-600 dark:text-blue-400" size={24} />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Notifications</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {unreadCount} unread {unreadCount === 1 ? 'notification' : 'notifications'}
            </p>
          </div>
        </div>
        
        <button
          onClick={markAllAsRead}
          className="px-4 py-2 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300 rounded-lg flex items-center gap-2 transition-colors"
          disabled={unreadCount === 0}
        >
          <Check size={16} />
          Mark all as read
        </button>
      </div>
      
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-border overflow-hidden">
        {notifications.length > 0 ? (
          notifications.map(notification => (
            <div 
              key={notification.id} 
              className={`p-5 border-b border-border flex items-start gap-4 ${
                notification.read ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/20'
              }`}
            >
              <div className="mt-1">
                <div className={`w-3 h-3 rounded-full ${
                  notification.read ? 'bg-gray-300' : 'bg-blue-500'
                }`}></div>
              </div>
              
              <div className="flex-1">
                <div className="flex justify-between">
                  <h3 className={`font-medium ${
                    notification.read 
                      ? 'text-gray-700 dark:text-gray-300' 
                      : 'text-blue-700 dark:text-blue-300'
                  }`}>
                    {notification.title}
                  </h3>
                  <span className="text-xs text-gray-500">
                    {formatDate(notification.date.toString())}
                  </span>
                </div>
                
                <p className="mt-2 text-gray-600 dark:text-gray-400">
                  {notification.message}
                </p>
                
                {notification.link && (
                  <Link 
                    to={notification.link}
                    className="inline-block mt-3 text-sm text-blue-600 hover:text-blue-800 dark:text-blue-400"
                  >
                    View details
                  </Link>
                )}
              </div>
              
              <button
                onClick={() => markAsRead(notification.id)}
                className="text-gray-400 hover:text-gray-600 dark:text-gray-500 dark:hover:text-gray-300 p-1"
                title="Mark as read"
              >
                <X size={16} />
              </button>
            </div>
          ))
        ) : (
          <div className="py-12 text-center">
            <Bell className="mx-auto text-gray-400 dark:text-gray-600" size={48} />
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-white">
              No notifications yet
            </h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Notifications about leads and meetings will appear here
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPage;