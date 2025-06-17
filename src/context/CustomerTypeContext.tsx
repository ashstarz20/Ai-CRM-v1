import React, { createContext, useContext, useState, useEffect, ReactNode } from "react";

interface CustomerTypeContextType {
  customerTypes: Record<string, string>;
  setCustomerType: (leadId: string, type: string) => void;
  getLeadsByType: (type: string) => Lead[];
  leads: Lead[];
  setLeads: React.Dispatch<React.SetStateAction<Lead[]>>;
}

const CustomerTypeContext = createContext<CustomerTypeContextType | undefined>(undefined);

interface CustomerTypeProviderProps {
  children: ReactNode;
}

interface Lead {
  id: string;
  [key: string]: unknown;
}

export const CustomerTypeProvider: React.FC<CustomerTypeProviderProps> = ({ children }) => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [customerTypes, setCustomerTypes] = useState<Record<string, string>>(() => {
    try {
      const stored = localStorage.getItem("leadCustomerTypes");
      return stored ? JSON.parse(stored) : {};
    } catch {
      return {};
    }
  });

  useEffect(() => {
    localStorage.setItem("leadCustomerTypes", JSON.stringify(customerTypes));
  }, [customerTypes]);

  const setCustomerType = (leadId: string, type: string) => {
    setCustomerTypes(prev => ({
      ...prev,
      [leadId]: type,
    }));
  };

  const getLeadsByType = (type: string) => {
    return leads.filter(lead => customerTypes[lead.id] === type);
  };

  return (
    <CustomerTypeContext.Provider value={{ 
      customerTypes, 
      setCustomerType, 
      getLeadsByType,
      leads,
      setLeads
    }}>
      {children}
    </CustomerTypeContext.Provider>
  );
};

export const useCustomerType = () => {
  const context = useContext(CustomerTypeContext);
  if (!context) {
    throw new Error("useCustomerType must be used within a CustomerTypeProvider");
  }
  return context;
};