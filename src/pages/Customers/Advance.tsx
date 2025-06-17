import React, { useEffect, useState } from "react";
import { useCustomerType } from "../../context/CustomerTypeContext";
import LeadsTable from "../../components/dashboard/LeadsTable";
import { fetchLeads } from "../../services/api";
import { SyncLoader } from "react-spinners";
import { Lead } from "../../types";

const Advance: React.FC = () => {
  const { customerTypes } = useCustomerType();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        const allLeads = await fetchLeads();
        const advanceLeads = allLeads.filter(
          (lead) => customerTypes[lead.id!] === "Advance"
        );
        setLeads(advanceLeads);
      } catch (error) {
        console.error("Failed to fetch leads:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [customerTypes]);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SyncLoader color="hsl(var(--primary))" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">Advance Customers</h1>
        <p className="text-muted-foreground">
          {leads.length} advance customer{leads.length !== 1 ? "s" : ""}
        </p>
      </div>
      
      <LeadsTable 
        leads={leads} 
        onStatusUpdate={() => {}}
        onFollowUpScheduled={() => {}}
        onUpdateCustomerComment={() => {}}
        viewingUserPhone=""
        viewingUserDisplayName=""
        customKpis={[]}
        onUpdateCustomField={() => {}}
      />
    </div>
  );
};

export default Advance;