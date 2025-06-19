import React, { useEffect, useState } from "react";
import { syncLeadsFromSheets, fetchLeadsFromFirestore } from "../services/api";
import { Lead, ChartData } from "../types";
import AnalyticsCharts from "../components/dashboard/AnalyticsCharts";
import {
  getLeadCountByStatus,
  getLeadCountByPlatform,
  getLeadsByDateRange,
  getLocationData,
} from "../utils/analytics";
import axios from "axios";

const Analytics: React.FC = () => {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState<string | null>(null);

  const [statusData, setStatusData] = useState<ChartData[]>([]);
  const [platformData, setPlatformData] = useState<ChartData[]>([]);
  const [leadsByDay, setLeadsByDay] = useState<ChartData[]>([]);
  const [locationData, setLocationData] = useState<ChartData[]>([]);

  const processCharts = (data: Lead[]) => {
    const statusCounts = getLeadCountByStatus(data);
    setStatusData(Object.entries(statusCounts).map(([name, value]) => ({ name, value })));

    const platformCounts = getLeadCountByPlatform(data);
    setPlatformData(
      Object.entries(platformCounts).map(([name, value]) => ({
        name: name.toUpperCase(),
        value,
      }))
    );

    const timeCounts = getLeadsByDateRange(data, 30);
    setLeadsByDay(Object.entries(timeCounts).map(([name, value]) => ({ name, value })));

    const locCounts = getLocationData(data);
    setLocationData(
      Object.entries(locCounts)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
        .slice(0, 6)
    );
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);

      try {
        const initialLeads = await fetchLeadsFromFirestore();
        setLeads(initialLeads);
        processCharts(initialLeads);
      } catch (err: unknown) {
        console.error("Error fetching Firestore leads:", err);
        setError("Failed to load analytics data from Firestore");
        setLoading(false);
        return;
      }

      try {
        await syncLeadsFromSheets();
        const updatedLeads = await fetchLeadsFromFirestore();
        setLeads(updatedLeads);
        processCharts(updatedLeads);
      } catch (err: unknown) {
        console.error("Error syncing with Sheets:", err);
        if (axios.isAxiosError(err) && err.response?.status === 500) {
          setWarning("No leads available for your account");
        } else if (err instanceof Error) {
          setError("Failed to sync new leads: " + err.message);
        } else {
          setError("Failed to sync new leads due to an unknown error");
        }
      } finally {
        setLoading(false);
      }
    };

    load();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (warning && leads.length === 0) {
    return (
      <div className="mb-4 rounded border border-yellow-400 bg-warning px-4 py-3 text-warning-foreground flex items-start">
        <svg className="h-5 w-5 flex-shrink-0 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.366-.756 1.4-.756 1.766 0l6.518 13.452A.75.75 0 0115.75 18h-11.5a.75.75 0 01-.791-1.449l6.518-13.452zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-4a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 10z"
            clipRule="evenodd"
          />
        </svg>
        <div className="ml-3">
          <p className="font-medium">Warning</p>
          <p className="mt-1 text-sm">⚠️ {warning}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="border border-red-500 bg-red-50 text-red-800 p-4 mb-6 rounded">
        <div className="flex">
          <svg className="h-5 w-5 flex-shrink-0 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path
              fillRule="evenodd"
              d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
              clipRule="evenodd"
            />
          </svg>
          <div className="ml-3">
            <h3 className="text-sm font-medium">Error</h3>
            <p className="mt-2 text-sm">{error}</p>
          </div>
        </div>
      </div>
    );
  }

  const dealDoneCount = leads.filter((l) => l.lead_status === "Deal Done").length;
  const conversionRate = leads.length > 0 ? Math.round((dealDoneCount / leads.length) * 100) : 0;

  return (
    <div className="space-y-6">
      <div className="bg-card text-foreground p-6 rounded-lg border border-border shadow-sm">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Total Leads</h3>
            <p className="mt-1 text-3xl font-semibold">{leads.length}</p>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Conversion Rate</h3>
            <p className="mt-1 text-3xl font-semibold">{conversionRate}%</p>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Top Platform</h3>
            <p className="mt-1 text-3xl font-semibold">
              {platformData.length
                ? platformData.sort((a, b) => b.value - a.value)[0].name
                : "N/A"}
            </p>
          </div>
          <div className="text-center">
            <h3 className="text-sm font-medium text-muted-foreground">Top Location</h3>
            <p className="mt-1 text-3xl font-semibold">
              {locationData.length ? locationData[0].name : "N/A"}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-card text-foreground p-6 rounded-lg border border-border shadow-sm">
        <AnalyticsCharts
          statusData={statusData}
          platformData={platformData}
          leadsByDay={leadsByDay}
          locationData={locationData}
        />
      </div>
    </div>
  );
};

export default Analytics;
