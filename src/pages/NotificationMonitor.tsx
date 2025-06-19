import { useEffect } from 'react';
import { differenceInHours } from 'date-fns';
import { useMeet } from '../context/MeetContext';
import { useNotification } from '../context/NotificationContext';

const MeetingNotificationMonitor = () => {
  const { scheduledLeads } = useMeet();
  const { addNotification, notifications } = useNotification();

  useEffect(() => {
    const checkMeetingNotifications = () => {
      const now = new Date();
      
      scheduledLeads.forEach(meeting => {
        try {
          const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
          const timeDiff = meetingDateTime.getTime() - now.getTime();
          const minutesDiff = Math.abs(timeDiff) / (1000 * 60);
          const hoursUntilMeeting = timeDiff > 0 ? differenceInHours(meetingDateTime, now) : 0;
          
          // Generate unique notification IDs
          const overdueId = `meeting-overdue-${meeting.id}`;
          const reminderId = `meeting-reminder-${meeting.id}`;
          
          // 1. Check if meeting is overdue (0-60 minutes ago)
          if (timeDiff < 0 && minutesDiff <= 60) {
            const exists = notifications.some(n => n.id === overdueId);
            if (!exists) {
              addNotification({
                id: overdueId,
                type: 'meeting',
                title: 'Meeting Overdue',
                message: `Meeting with ${meeting.name} was ${Math.ceil(minutesDiff)} minutes ago`,
                link: `/dashboard/taskmeet`
              });
            }
          }
          
          // 2. Check for upcoming meetings (more than 48 hours away)
          if (hoursUntilMeeting > 48) {
            // Calculate hours since last reminder
            const lastReminder = notifications.find(n => n.id === reminderId);
            const hoursSinceLastReminder = lastReminder 
              ? differenceInHours(now, new Date(lastReminder.date)) 
              : 999; // Arbitrary large number if no reminder
            
            // Send reminder every 12 hours
            if (hoursSinceLastReminder >= 12) {
              addNotification({
                id: reminderId,
                type: 'meeting',
                title: 'Meeting Reminder',
                message: `Meeting with ${meeting.name} is in ${hoursUntilMeeting} hours`,
                link: `/dashboard/taskmeet`
              });
            }
          }
        } catch (e) {
          console.error("Error processing meeting notification", e);
        }
      });
    };

    // Run immediately and every minute
    checkMeetingNotifications();
    const interval = setInterval(checkMeetingNotifications, 60000);
    
    return () => clearInterval(interval);
  }, [scheduledLeads, addNotification, notifications]);

  return null;
};

export default MeetingNotificationMonitor;