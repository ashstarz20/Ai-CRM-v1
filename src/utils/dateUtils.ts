import { format, formatDistanceToNow } from 'date-fns';

export const formatDate = (dateString: string) => {
  try {
    const date = new Date(dateString);
    return format(date, 'MMM dd, yyyy h:mm a');
  } catch {
    return dateString;
  }
};

export const formatRelativeTime = (date: Date) => {
  return formatDistanceToNow(date, { addSuffix: true });
};