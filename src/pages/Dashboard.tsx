import React, { useEffect, useState, useCallback, ChangeEvent } from "react";
import KPICard from "../components/dashboard/KPICard";
import LeadsTable from "../components/dashboard/LeadsTable";
import { Lead, CustomKpi } from "../types/types";
import { KPI } from "../types";
import {
  syncLeadsFromSheets,
  fetchLeadsFromFirestore,
  importLeadsFromCSV,
} from "../services/api";
import { exportToCSV } from "../utils/exportCsv";
import axios from "axios";
import Papa from "papaparse";
import { getAuth } from "firebase/auth";
import { db, fetchAllUsers } from "../services/firebase";
import { doc, getDoc } from "firebase/firestore";
import ReactSelect, { components } from "react-select";
import { SyncLoader } from "react-spinners";
import { StylesConfig, GroupBase } from "react-select";
import { fetchCustomKpis } from "../services/customKpis";
import {
  Users,
  Check,
  Award,
  ChevronDown,
  IndianRupee,
  Calendar,
  CheckCircle,
  Home,
  Mail,
  FileText,
  MapPin,
} from "lucide-react";

const Dashboard: React.FC = () => {
  // State variables
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [warning, setWarning] = useState<string | null>(null);
  const [kpis, setKpis] = useState<KPI[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [allUsers, setAllUsers] = useState<
    Array<{
      phoneNumber: string;
      displayName: string;
    }>
  >([]);
  const [selectedUser, setSelectedUser] = useState<string | null>(null);
  const [usersLoading, setUsersLoading] = useState(false);
  const [userSwitchLoading, setUserSwitchLoading] = useState(false);
  const [viewingUserPhone, setViewingUserPhone] = useState("");
  const [customKpis, setCustomKpis] = useState<CustomKpi[]>([]);
  const [showPopup, setShowPopup] = useState(false);
  const [importError, setImportError] = useState("");

  // Combined KPI computation
  const computeKPIs = useCallback(
    (list: Lead[]) => {
      const meetingDone = list.filter(
        (l) => l.lead_status === "Meeting Done"
      ).length;
      const dealDone = list.filter((l) => l.lead_status === "Deal Done").length;

      // Default cards
      const defaultKpis: KPI[] = [
        {
          title: "Total Leads",
          value: list.length,
          icon: <Users size={24} />,
          color: "primary",
        },
        {
          title: "Meeting Done",
          value: meetingDone,
          icon: <Check size={24} />,
          color: "orange",
        },
        {
          title: "Deal Done",
          value: dealDone,
          icon: <Award size={24} />,
          color: "success",
        },
      ];

      // Custom cards
      const customCards: KPI[] = customKpis.map((kpi) => {
        const count = list.filter((l) => l.lead_status === kpi.label).length;
        let iconComponent: React.ReactNode;

        switch (kpi.icon) {
          case "home":
            iconComponent = <Home size={24} />;
            break;
          case "mail":
            iconComponent = <Mail size={24} />;
            break;
          case "file-text":
            iconComponent = <FileText size={24} />;
            break;
          case "map-pin":
            iconComponent = <MapPin size={24} />;
            break;
          case "calendar":
            iconComponent = <Calendar size={24} />;
            break;
          case "indian-rupee":
            iconComponent = <IndianRupee size={24} />;
            break;
          case "users":
            iconComponent = <Users size={24} />;
            break;
          case "check-circle":
            iconComponent = <CheckCircle size={24} />;
            break;
          default:
            iconComponent = <Home size={24} />;
        }

        return {
          title: kpi.label,
          value: count,
          icon: iconComponent,
          color: kpi.color,
        };
      });

      return [...defaultKpis, ...customCards];
    },
    [customKpis]
  );

  useEffect(() => {
    setKpis(computeKPIs(leads));
  }, [leads, computeKPIs]);

  // Combined data loading
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const auth = getAuth();
        const user = auth.currentUser;

        if (!user || !user.phoneNumber) {
          throw new Error("User not authenticated or phone number missing");
        }

        const sanitizedPhone = user.phoneNumber.replace(/[^\d]/g, "");
        setViewingUserPhone(sanitizedPhone);
        const userDocRef = doc(db, "crm_users", sanitizedPhone);
        const docSnap = await getDoc(userDocRef);

        if (docSnap.exists() && docSnap.data().isAdmin) {
          setIsAdmin(true);
          setUsersLoading(true);
          try {
            const users = await fetchAllUsers();
            setAllUsers(users);
          } catch (err) {
            console.error("Failed to fetch users", err);
          } finally {
            setUsersLoading(false);
          }
        }

        // Fetch initial leads
        const initial = await fetchLeadsFromFirestore();
        setLeads(initial);

        // Sync from Sheets in background
        syncLeadsFromSheets()
          .then(async () => {
            const updated = await fetchLeadsFromFirestore();
            setLeads(updated);
          })
          .catch(console.error);

        // Fetch custom KPIs
        const kpis = await fetchCustomKpis(sanitizedPhone);
        setCustomKpis(kpis);
      } catch (err: unknown) {
        console.error("Error loading leads:", err);
        if (axios.isAxiosError(err) && err.response?.status === 500) {
          setWarning("No leads available for your account");
        } else if (err instanceof Error) {
          setError("Failed to load leads: " + err.message);
        } else {
          setError("Failed to load leads due to an unknown error");
        }
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  // CSV Import functions
  const handleCSVImport = async (e: ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setImportError("");

    try {
      const file = files[0];
      const text = await readFileAsText(file);
      const leads = parseCSV(text);

      await importLeadsFromCSV(leads);

      // Refresh leads after import
      const updatedLeads = await fetchLeadsFromFirestore();
      setLeads(updatedLeads);

      setShowPopup(false);
    } catch (err: unknown) {
      console.error("CSV import error:", err);
      if (err instanceof Error) {
        setImportError(err.message || "Failed to import CSV");
      } else {
        setImportError("Failed to import CSV");
      }
    } finally {
      e.target.value = "";
    }
  };

  const readFileAsText = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = () => reject(new Error("File reading failed"));
      reader.readAsText(file);
    });
  };

  const parseCSV = (csvText: string): Lead[] => {
    interface ParseResult<T> {
      data: T[];
      errors: Papa.ParseError[];
      meta: Papa.ParseMeta;
    }

    const results: ParseResult<Record<string, string>> = Papa.parse(csvText, {
      header: true,
      skipEmptyLines: true,
      transformHeader: (header: string) => header.trim(),
    });

    if (results.errors.length > 0) {
      throw new Error("Invalid CSV format");
    }

    return results.data.map(
      (row): Lead => ({
        created_time: row.created_time || new Date().toISOString(),
        platform: row.platform || "",
        name: row.name || "",
        whatsapp_number_: row.whatsapp_number_ || "",
        lead_status: row.lead_status || "New Lead",
        comments: row.comments || "",
      })
    );
  };

  // Event handlers
  const handleStatusUpdate = (leadId: string, newStatus: string) => {
    setLeads(
      leads.map((lead) =>
        lead.id === leadId ? { ...lead, lead_status: newStatus } : lead
      )
    );
  };

  const handleFollowUpScheduled = (
    leadId: string,
    date: string,
    time: string
  ) => {
    setLeads(
      leads.map((lead) =>
        lead.id === leadId
          ? { ...lead, followUpDate: date, followUpTime: time }
          : lead
      )
    );
  };

  const handleUpdateCustomerComment = (leadId: string, comment: string) => {
    setLeads(
      leads.map((lead) =>
        lead.id === leadId ? { ...lead, customerComment: comment } : lead
      )
    );
  };

  const handleExportCSV = () => {
    exportToCSV(
      leads,
      `leads_export_${new Date().toISOString().split("T")[0]}`
    );
  };

  const handleDownloadSample = () => {
    const headers = [
      "created_time",
      "platform",
      "name",
      "whatsapp_number_",
      "lead_status",
      "comments",
    ];
    const csvContent = headers.join(",") + "\n";
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "sample_leads.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUserChange = async (
    selectedOption: { value: string; label: string } | null
  ) => {
    if (selectedOption) {
      setUserSwitchLoading(true);
      try {
        const userPhone = selectedOption.value;
        setSelectedUser(userPhone);
        setViewingUserPhone(userPhone);
        const userLeads = await fetchLeadsFromFirestore(userPhone);
        setLeads(userLeads);
      } catch (error) {
        console.error("Failed to switch user", error);
      } finally {
        setUserSwitchLoading(false);
      }
    } else {
      // Reset to current user
      const auth = getAuth();
      const user = auth.currentUser;
      if (user?.phoneNumber) {
        const sanitizedPhone = user.phoneNumber.replace(/[^\d]/g, "");
        setViewingUserPhone(sanitizedPhone);
      }
    }
  };

  // UserDropdown component
  const UserDropdown = () => {
    type UserOption = {
      value: string;
      label: string;
    };

    const selectStyles: StylesConfig<
      UserOption,
      false,
      GroupBase<UserOption>
    > = {
      control: (provided) => ({
        ...provided,
        minWidth: "240px",
        borderRadius: "0.375rem",
        borderColor: "hsl(var(--border))",
        "&:hover": { borderColor: "hsl(var(--ring))" },
        boxShadow: "none",
        backgroundColor: "hsl(var(--input))",
        minHeight: "42px",
      }),
      option: (provided, state) => ({
        ...provided,
        backgroundColor: state.isSelected
          ? "hsl(var(--primary))"
          : state.isFocused
          ? "hsl(var(--accent))"
          : "hsl(var(--background))",
        color: state.isSelected
          ? "hsl(var(--primary-foreground))"
          : "hsl(var(--foreground))",
        padding: "10px 15px",
        fontSize: "0.875rem",
      }),
      input: (provided) => ({
        ...provided,
        "input:focus": { boxShadow: "none" },
        fontSize: "0.875rem",
        color: "hsl(var(--foreground))",
      }),
      placeholder: (provided) => ({
        ...provided,
        color: "hsl(var(--muted-foreground))",
        fontSize: "0.875rem",
      }),
      singleValue: (provided) => ({
        ...provided,
        color: "hsl(var(--foreground))",
        fontSize: "0.875rem",
        fontWeight: 500,
      }),
      menu: (provided) => ({
        ...provided,
        borderRadius: "0.375rem",
        backgroundColor: "hsl(var(--popover))",
        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
        zIndex: 10,
      }),
      indicatorSeparator: () => ({ display: "none" }),
    };

    return (
      <div className="relative w-64">
        <ReactSelect
          options={allUsers.map((user) => ({
            value: user.phoneNumber,
            label: user.displayName || user.phoneNumber,
          }))}
          value={
            selectedUser
              ? {
                  value: selectedUser,
                  label:
                    allUsers.find((u) => u.phoneNumber === selectedUser)
                      ?.displayName || selectedUser,
                }
              : null
          }
          onChange={handleUserChange}
          placeholder={usersLoading ? "Loading users..." : "Select user..."}
          isSearchable
          isLoading={usersLoading}
          loadingMessage={() => "Loading users..."}
          noOptionsMessage={({ inputValue }: { inputValue: string }) =>
            inputValue ? "No matching users" : "No users available"
          }
          components={{
            DropdownIndicator: (props) => (
              <components.DropdownIndicator {...props}>
                {usersLoading ? (
                  <div className="px-2">
                    <SyncLoader size={8} color="hsl(var(--primary))" />
                  </div>
                ) : (
                  <ChevronDown className="h-5 w-5 text-muted-foreground" />
                )}
              </components.DropdownIndicator>
            ),
            LoadingIndicator: () => (
              <div className="px-2">
                <SyncLoader size={8} color="hsl(var(--primary))" />
              </div>
            ),
          }}
          styles={selectStyles}
        />
        {userSwitchLoading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center rounded-md border border-border">
            <SyncLoader size={8} color="hsl(var(--primary))" />
          </div>
        )}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <SyncLoader size={12} color="hsl(var(--primary))" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="mb-4 rounded border-destructive bg-destructive/10 px-4 py-3 flex items-start">
        <svg
          className="h-5 w-5 flex-shrink-0 text-destructive"
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path
            fillRule="evenodd"
            d="M8.257 3.099c.366-.756 1.4-.756 1.766 0l6.518 13.452A.75.75 0 0115.75 18h-11.5a.75.75 0 01-.791-1.449l6.518-13.452zM11 14a1 1 0 10-2 0 1 1 0 002 0zm-1-4a.75.75 0 01.75.75v2.5a.75.75 0 01-1.5 0v-2.5A.75.75 0 0110 10z"
            clipRule="evenodd"
          />
        </svg>
        <div className="ml-3 text-destructive">
          <p className="font-medium">Warning</p>
          <p className="mt-1 text-sm">⚠️ {warning}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-1 py-3">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
        {kpis.map((kpi, index) => (
          <KPICard
            key={index}
            title={kpi.title}
            value={kpi.value}
            icon={kpi.icon}
            color={kpi.color}
          />
        ))}
      </div>

      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <div>
          <h2 className="text-xl font-semibold text-foreground">Recent Leads</h2>
          <p className="text-sm text-muted-foreground mt-1">
            {leads.length} records found
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-col sm:flex-row gap-3">
          {isAdmin && <UserDropdown />}
          <button
            onClick={() => setShowPopup(true)}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-primary-foreground bg-primary hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-ring transition-all duration-200 ${
              userSwitchLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            Import CSV
          </button>
          <button
            onClick={handleExportCSV}
            disabled={userSwitchLoading}
            className={`inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-success-foreground bg-success hover:bg-success/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-success transition-all duration-200 ${
              userSwitchLoading ? "opacity-70 cursor-not-allowed" : ""
            }`}
          >
            Export to CSV
          </button>
        </div>
      </div>

      {showPopup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md transition-all duration-300">
          <div className="bg-card rounded-2xl shadow-2xl p-8 max-w-md w-full relative border border-border">
            <button
              onClick={() => setShowPopup(false)}
              className="absolute top-3 right-3 text-muted-foreground hover:text-destructive text-3xl transition-colors"
            >
              &times;
            </button>

            <h3 className="text-xl font-bold mb-6 text-foreground text-center">
              📂 Import CSV File
            </h3>

            {importError && (
              <div className="mb-4 rounded border border-destructive bg-destructive/10 px-4 py-2 text-destructive shadow text-sm">
                {importError}
              </div>
            )}

            <ol className="list-decimal space-y-6 text-foreground text-sm pl-6">
              <li>
                <p className="mb-2 font-medium">Download the sample file:</p>
                <button
                  onClick={handleDownloadSample}
                  className="bg-success text-success-foreground text-sm px-4 py-2 rounded-md hover:bg-success/90 shadow transition"
                >
                  Download
                </button>
              </li>

              <li>
                <p className="font-medium">
                  Add your data to the file using the same format as shown in
                  the sample.
                </p>
              </li>

              <li>
                <p className="mb-2 font-medium">Import your updated file:</p>
                <label className="inline-block bg-primary text-primary-foreground text-sm px-4 py-2 rounded-md cursor-pointer hover:bg-primary/90 shadow transition">
                  Import
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={handleCSVImport}
                  />
                </label>
              </li>
            </ol>
          </div>
        </div>
      )}

      <LeadsTable
        leads={leads}
        onStatusUpdate={handleStatusUpdate}
        onFollowUpScheduled={handleFollowUpScheduled}
        onUpdateCustomerComment={handleUpdateCustomerComment}
        isLoading={userSwitchLoading}
        viewingUserPhone={viewingUserPhone}
        customKpis={customKpis}
      />
    </div>
  );
};

export default Dashboard;