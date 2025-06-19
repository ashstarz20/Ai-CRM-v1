import { format, isBefore, isAfter, addDays } from 'date-fns';
import { Calendar, Clock, Phone, X } from 'lucide-react';
import { useMeet } from '../../context/MeetContext';

const Meet = () => {
  const { scheduledLeads, removeFromMeet } = useMeet();

  const formatDisplayDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM dd, yyyy');
    } catch {
      return dateString;
    }
  };

  const isMeetingPast = (dateString: string, timeString: string) => {
    try {
      const dateTime = new Date(`${dateString}T${timeString}`);
      return isBefore(dateTime, new Date());
    } catch {
      return false;
    }
  };

  const isMeetingFarFuture = (dateString: string, timeString: string) => {
    try {
      const dateTime = new Date(`${dateString}T${timeString}`);
      const twoDaysLater = addDays(new Date(), 2);
      return isAfter(dateTime, twoDaysLater);
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
          {scheduledLeads.map((lead) => {
            const meetingIsPast = isMeetingPast(lead.date, lead.time);
            const meetingIsFarFuture = isMeetingFarFuture(lead.date, lead.time);

            return (
              <div
                key={lead.id}
                className={`border rounded-lg p-4 transition-shadow relative ${
                  meetingIsPast
                    ? 'bg-muted text-muted-foreground opacity-60'
                    : meetingIsFarFuture
                    ? 'bg-blue-50 dark:bg-blue-900/10'
                    : 'hover:shadow-md'
                }`}
              >
                <div className="absolute top-2 right-2">
                  <button
                    onClick={() => removeFromMeet(lead.id)}
                    className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                    aria-label="Delete meeting"
                  >
                    <X className="h-4 w-4 text-muted-foreground" />
                  </button>
                </div>

                <div className="flex items-center justify-between mb-3 pr-8">
                  <h3 className="font-semibold text-lg truncate">{lead.name}</h3>
                  <div className="flex space-x-2">
                    <span
                      className={`text-xs px-2 py-1 rounded-full ${
                        meetingIsPast
                          ? 'bg-gray-200 text-gray-500'
                          : meetingIsFarFuture
                          ? 'bg-blue-200 text-blue-700'
                          : 'bg-primary/10 text-primary'
                      }`}
                    >
                      {meetingIsPast ? 'Completed' : meetingIsFarFuture ? 'Upcoming' : 'Scheduled'}
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