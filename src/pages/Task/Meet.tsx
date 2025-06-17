import { format, isBefore} from 'date-fns';
import { Calendar, Clock, Phone } from 'lucide-react';
import { useMeet } from '../../context/MeetContext';
import { useNotification } from '../../context/NotificationContext';
import { useEffect } from 'react';

const Meet = () => {
  const { scheduledLeads } = useMeet();
  const { addNotification } = useNotification();

  // Notification logic to check for upcoming or overdue meetings
  useEffect(() => {
  scheduledLeads.forEach(meeting => {
    try {
      const now = new Date();
      const meetingDateTime = new Date(`${meeting.date}T${meeting.time}`);
      
      // Check if meeting is within the next hour
      const timeDiff = meetingDateTime.getTime() - now.getTime();
      const hoursDiff = timeDiff / (1000 * 60 * 60);
      
      if (hoursDiff > 0 && hoursDiff <= 1) {
        addNotification({
          type: 'meeting',
          title: 'Meeting Reminder',
          message: `Meeting with ${meeting.name} is coming up in ${Math.ceil(hoursDiff * 60)} minutes`,
          link: `/dashboard/taskmeet`
        });
      }
      
      // Check if meeting is overdue
      if (timeDiff < 0 && Math.abs(hoursDiff) <= 1) {
        addNotification({
          type: 'meeting',
          title: 'Meeting Overdue',
          message: `Meeting with ${meeting.name} was scheduled ${Math.ceil(Math.abs(hoursDiff) * 60)} minutes ago`,
          link: `/dashboard/taskmeet`
        });
      }
    } catch (e) {
      console.error("Error processing meeting notification", e);
    }
  });
}, [scheduledLeads, addNotification]);

  // Helper to format date for display
  const formatDisplayDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  // Helper to check if the meeting is in the past
  const isMeetingPast = (dateString: string, timeString: string) => {
    try {
      // Combine date and time into a single Date object
      const dateTimeString = `${dateString}T${timeString}`;
      const meetingDate = new Date(dateTimeString);
      const now = new Date();
      return isBefore(meetingDate, now);
    } catch {
      return false;
    }
  };

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">Scheduled Meetings</h1>

      {scheduledLeads.length === 0 ? (
        <div className="text-center py-12">
          <div className="bg-muted border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
          <h3 className="mt-4 text-lg font-medium text-foreground">
            No meetings scheduled
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Schedule follow-ups from the Leads table to see them here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {scheduledLeads.map((lead, index) => {
            const meetingIsPast = isMeetingPast(lead.date, lead.time);

            return (
              <div
                key={index}
                className={`border rounded-lg p-4 transition-shadow ${
                  meetingIsPast
                    ? 'bg-muted text-muted-foreground opacity-60 cursor-not-allowed'
                    : 'hover:shadow-md'
                }`}
                aria-disabled={meetingIsPast}
                tabIndex={meetingIsPast ? -1 : 0}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-semibold text-lg truncate">{lead.name}</h3>
                  <div className="flex space-x-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        meetingIsPast
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {meetingIsPast ? 'Completed' : 'Scheduled'}
                    </span>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center text-sm">
                    <Phone className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span className="truncate">{lead.contact}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Calendar className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{formatDisplayDate(lead.date)}</span>
                  </div>

                  <div className="flex items-center text-sm">
                    <Clock className="h-4 w-4 mr-2 text-muted-foreground" />
                    <span>{lead.time}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default Meet;