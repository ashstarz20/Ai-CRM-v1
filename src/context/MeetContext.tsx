import { 
  createContext, 
  useContext, 
  useState, 
  useEffect, 
  ReactNode,
  useCallback
} from 'react';
import { v4 as uuidv4 } from 'uuid';

export interface ScheduledLead {
  id: string;
  name: string;
  contact: string;
  date: string;
  time: string;
  location?: string;
}

interface MeetContextType {
  scheduledLeads: ScheduledLead[];
  addToMeet: (lead: Omit<ScheduledLead, 'id'>) => void;
  removeFromMeet: (id: string) => void;
  updateMeet: (id: string, updates: Partial<Omit<ScheduledLead, 'id'>>) => void;
}

const MeetContext = createContext<MeetContextType | undefined>(undefined);

const LOCAL_STORAGE_KEY = 'scheduledLeads';

export const MeetProvider = ({ children }: { children: ReactNode }) => {
  const [scheduledLeads, setScheduledLeads] = useState<ScheduledLead[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        const validLeads = parsed.map((lead: any) => ({
          ...lead,
          id: lead.id || uuidv4()
        }));
        setScheduledLeads(validLeads);
      }
    } catch (error) {
      console.error('Failed to load scheduled leads:', error);
      localStorage.removeItem(LOCAL_STORAGE_KEY);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(scheduledLeads));
      } catch (error) {
        console.error('Failed to save scheduled leads:', error);
      }
    }
  }, [scheduledLeads, isLoaded]);

  const addToMeet = useCallback((lead: Omit<ScheduledLead, 'id'>) => {
    const newLead: ScheduledLead = {
      ...lead,
      id: uuidv4()
    };
    
    setScheduledLeads(prev => {
      const exists = prev.some(item => 
        item.name === newLead.name && 
        item.date === newLead.date && 
        item.time === newLead.time
      );
      return exists ? prev : [...prev, newLead];
    });
  }, []);

  const removeFromMeet = useCallback((id: string) => {
    setScheduledLeads(prev => prev.filter(lead => lead.id !== id));
  }, []);

  const updateMeet = useCallback((
    id: string, 
    updates: Partial<Omit<ScheduledLead, 'id'>>
  ) => {
    setScheduledLeads(prev => 
      prev.map(lead => lead.id === id ? { ...lead, ...updates } : lead)
    );
  }, []);

  return (
    <MeetContext.Provider value={{ 
      scheduledLeads, 
      addToMeet,
      removeFromMeet,
      updateMeet
    }}>
      {children}
    </MeetContext.Provider>
  );
};

export const useMeet = () => {
  const context = useContext(MeetContext);
  if (!context) {
    throw new Error('useMeet must be used within a MeetProvider');
  }
  return context;
};
