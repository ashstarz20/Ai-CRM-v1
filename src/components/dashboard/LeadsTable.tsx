import React, { useState, useMemo, useEffect } from "react";
import { format, parseISO, parse, isValid } from "date-fns";
import { Lead } from "../../types";
import { CustomKpi } from "../../types/types";
import {
  Phone,
  X,
  Pencil,
  MessageSquare,
  MessagesSquare,
  MessageCircle,
  User,
} from "lucide-react";
import {
  updateLeadStatus,
  scheduleFollowUp,
  updateCustomerComment,
} from "../../services/api";
import { SyncLoader } from "react-spinners";
import { FaBell, FaWhatsapp, FaFacebookF, FaInstagram } from "react-icons/fa";

interface LeadsTableProps {
  leads: Lead[];
  onStatusUpdate: (index: string, newStatus: string) => void;
  onFollowUpScheduled: (leadId: string, date: string, time: string) => void;
  onUpdateCustomerComment: (leadId: string, comment: string) => void;
  isLoading?: boolean;
  viewingUserPhone: string;
  customKpis: CustomKpi[];
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onStatusUpdate,
  onFollowUpScheduled,
  onUpdateCustomerComment,
  isLoading = false,
  viewingUserPhone,
  customKpis,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [platformFilter, setPlatformFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);

  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [isSidePanelOpen, setIsSidePanelOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [followUpLeadId, setFollowUpLeadId] = useState<string | null>(null);
  const [followUpDate, setFollowUpDate] = useState<string>("");
  const [followUpTime, setFollowUpTime] = useState<string>("");
  const [customerComment, setCustomerComment] = useState("");
  const [isEditingCustomerComment, setIsEditingCustomerComment] =
    useState(false);

  interface CommentHistoryItem {
    user: string;
    content: string;
    timestamp: string;
  }
  const [commentsHistory, setCommentsHistory] = useState<CommentHistoryItem[]>([]);

  const itemsPerPage = 20;

  const statusOptions = useMemo(() => {
    const customStatuses = customKpis.map((kpi) => kpi.label);
    return ["New Lead", "Meeting Done", "Deal Done", ...customStatuses];
  }, [customKpis]);

  useEffect(() => {
    if (selectedLead) {
      setCustomerComment(String(selectedLead.customerComment || ""));
    }
  }, [selectedLead]);

  useEffect(() => {
    if (selectedLead && Array.isArray(selectedLead.commentsHistory)) {
      setCommentsHistory(selectedLead.commentsHistory);
    } else {
      setCommentsHistory([]);
    }
  }, [selectedLead]);

  const parseComments = (comments: string) => {
    const parts = comments.split(/📢|👤|📞|📍|💰|👶|🏆/).filter(Boolean);
    const labels = [
      "Ad Details",
      "Name",
      "Number",
      "PreSchool Owner",
      "Location",
      "Fees",
      "Strength",
      "Lead Score",
    ];
    return parts.map((txt, i) => {
      const value = txt.replace(/^[:\s]+/, "");
      return { label: labels[i] || `Field ${i + 1}`, value };
    });
  };

  const getPlatformInfo = (platform: string | undefined) => {
    if (!platform) return { icon: null, color: "bg-muted text-muted-foreground" };

    const platformLower = platform.toLowerCase();

    if (platformLower === "ig")
      return {
        icon: <FaInstagram className="w-3 h-3" />,
        color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200",
      };

    if (platformLower === "fb")
      return {
        icon: <FaFacebookF className="w-3 h-3" />,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      };

    if (platformLower === "wa")
      return {
        icon: <FaWhatsapp className="w-3 h-3" />,
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      };

    if (platformLower.includes("facebook"))
      return {
        icon: <FaFacebookF className="w-3 h-3" />,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      };

    if (platformLower.includes("instagram"))
      return {
        icon: <FaInstagram className="w-3 h-3" />,
        color: "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-200",
      };

    if (platformLower.includes("google"))
      return {
        icon: <MessageSquare className="w-3 h-3" />,
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200",
      };

    if (platformLower.includes("zalo"))
      return {
        icon: <MessagesSquare className="w-3 h-3" />,
        color: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200",
      };

    if (platformLower.includes("tiktok"))
      return {
        icon: <MessageCircle className="w-3 h-3" />,
        color: "bg-foreground text-background dark:bg-muted dark:text-foreground",
      };

    if (platformLower.includes("whatsapp"))
      return {
        icon: <FaWhatsapp className="w-3 h-3" />,
        color: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200",
      };

    return {
      icon: (
        <span className="text-xs font-bold">
          {platform.substring(0, 2).toUpperCase()}
        </span>
      ),
      color: "bg-muted text-muted-foreground",
    };
  };

  const handleStatusChange = async (leadId: string, newStatus: string) => {
    setUpdatingStatus(leadId);
    try {
      await updateLeadStatus(leadId, newStatus, viewingUserPhone);
      onStatusUpdate(leadId, newStatus);
    } catch (error) {
      console.error("Error updating status:", error);
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleFollowUpClick = (leadId: string) => {
    if (followUpLeadId === leadId) {
      setFollowUpLeadId(null);
    } else {
      const lead = leads.find((l) => l.id === leadId);
      setFollowUpLeadId(leadId);
      setFollowUpDate(lead?.followUpDate ? String(lead.followUpDate) : "");
      setFollowUpTime(lead?.followUpTime ? String(lead.followUpTime) : "");
    }
  };

  const handleSchedule = async (leadId: string) => {
    try {
      const dateTime = new Date(`${followUpDate}T${followUpTime}:00`);
      await scheduleFollowUp(leadId, dateTime, followUpTime, viewingUserPhone);
      onFollowUpScheduled(leadId, followUpDate, followUpTime);
      setFollowUpLeadId(null);
    } catch (error) {
      console.error("Scheduling error:", error);
      alert("Failed to schedule follow-up. Please try again.");
    }
  };

  const openSidePanel = (lead: Lead) => {
    setSelectedLead(lead);
    setCustomerComment(String(lead.customerComment || ""));
    setIsEditingCustomerComment(false);
    setIsSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedLead(null);
  };

  const handleSaveCustomerComment = async () => {
    if (selectedLead) {
      try {
        await updateCustomerComment(
          selectedLead.id!,
          customerComment,
          viewingUserPhone
        );
        onUpdateCustomerComment(selectedLead.id!, customerComment);
        setIsEditingCustomerComment(false);

        if (customerComment.trim()) {
          const user = viewingUserPhone || "User";
          const newComment = {
            user,
            content: customerComment.trim(),
            timestamp: new Date().toISOString(),
          };
          let updatedComments = [...commentsHistory, newComment];
          if (updatedComments.length > 30) {
            updatedComments = updatedComments.slice(updatedComments.length - 30);
          }
          setCommentsHistory(updatedComments);
        }
      } catch (error) {
        console.error("Failed to save comment:", error);
        alert("Failed to save comment. Please try again.");
      }
    }
  };

  const [sortingConfig, setSortingConfig] = useState<{
    field: "date" | "name" | "score" | null;
    direction: "asc" | "desc";
  }>({
    field: null,
    direction: "asc",
  });

  const filteredLeads = useMemo(() => {
    return leads.filter((lead) => {
      const search = searchTerm.trim().toLowerCase();

      const matchesSearch =
        lead.name?.toLowerCase().includes(search) ||
        String(lead.whatsapp_number_ || "").includes(search) ||
        lead.comments?.toLowerCase().includes(search);

      const matchesStatus =
        statusFilter === "all" || lead.lead_status === statusFilter;

      const matchesPlatform =
        platformFilter === "all" || lead.platform === platformFilter;

      return matchesSearch && matchesStatus && matchesPlatform;
    });
  }, [leads, searchTerm, statusFilter, platformFilter]);

  const parseLeadScore = (comments: string): number | null => {
    const match = comments.match(/🏆 Lead Score: (\d+)/);
    return match ? parseInt(match[1], 10) : null;
  };

  const handleSort = (field: "date" | "name" | "score") => {
    let direction: "asc" | "desc" = "asc";
    if (sortingConfig.field === field) {
      direction = sortingConfig.direction === "asc" ? "desc" : "asc";
    }
    setSortingConfig({ field, direction });
  };

  const parseLeadDate = (dateStr: string | undefined): Date | null => {
    if (!dateStr) return null;

    try {
      const isoDate = parseISO(dateStr);
      if (isValid(isoDate)) return isoDate;
    } catch {
      // Ignore parseISO errors
    }

    try {
      const customDate = parse(dateStr, "MMM dd, yyyy hh:mm a", new Date());
      if (isValid(customDate)) return customDate;
    } catch {
      // Ignore parse errors
    }

    return null;
  };

  const sortedLeads = useMemo(() => {
    return [...filteredLeads].sort((a, b) => {
      // If we have an active sort field, sort by that
      if (sortingConfig.field) {
        let valueA: string | number | Date | null = null;
        let valueB: string | number | Date | null = null;

        switch (sortingConfig.field) {
          case "date":
            valueA = a.created_time ? parseLeadDate(a.created_time) : null;
            valueB = b.created_time ? parseLeadDate(b.created_time) : null;
            break;
          case "name":
            valueA = (a.name || "").toLowerCase();
            valueB = (b.name || "").toLowerCase();
            break;
          case "score":
            valueA = parseLeadScore(a.comments || "") ?? -Infinity;
            valueB = parseLeadScore(b.comments || "") ?? -Infinity;
            break;
        }

        // Handle date comparison
        if (sortingConfig.field === "date") {
          const aTime =
            valueA instanceof Date && !isNaN(valueA.getTime())
              ? valueA.getTime()
              : 0;
          const bTime =
            valueB instanceof Date && !isNaN(valueB.getTime())
              ? valueB.getTime()
              : 0;
          return sortingConfig.direction === "asc"
            ? aTime - bTime
            : bTime - aTime;
        }

        // Handle other comparisons
        if (valueA == null && valueB == null) {
          return 0;
        }
        if (valueA == null) {
          return sortingConfig.direction === "asc" ? 1 : -1;
        }
        if (valueB == null) {
          return sortingConfig.direction === "asc" ? -1 : 1;
        }
        if (valueA < valueB) {
          return sortingConfig.direction === "asc" ? -1 : 1;
        }
        if (valueA > valueB) {
          return sortingConfig.direction === "asc" ? 1 : -1;
        }
        return 0;
      }

      // Default sorting: newest first
      const aDate = a.created_time ? parseLeadDate(a.created_time) : null;
      const bDate = b.created_time ? parseLeadDate(b.created_time) : null;
      const aTime = aDate ? aDate.getTime() : 0;
      const bTime = bDate ? bDate.getTime() : 0;
      return bTime - aTime;
    });
  }, [filteredLeads, sortingConfig]);

  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = sortedLeads.slice(
    startIndex,
    startIndex + itemsPerPage
  );

  const formatDate = (dateString: string) => {
    const date = parseLeadDate(dateString);
    if (date) {
      return format(date, "MMM dd, yyyy hh:mm a");
    }
    return dateString;
  };

  const extractLocation = (comments: string) => {
    const locationMatch = comments.match(/📍 Location: ([^\n]+)/);
    return locationMatch ? locationMatch[1] : "N/A";
  };

  const extractScore = (comments: string) => {
    const scoreMatch = comments.match(/🏆 Lead Score: (\d+)/);
    return scoreMatch ? parseInt(scoreMatch[1], 10) : null;
  };

  const getScoreColor = (score: number | null) => {
    if (score === null) return "text-muted-foreground";
    if (score < 50) return "text-destructive font-bold";
    if (score >= 50 && score <= 70) return "text-amber-600 font-bold";
    return "text-success font-bold";
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-muted text-muted-foreground";

    switch (status.toLowerCase()) {
      case "new lead":
        return "bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200";
      case "meeting done":
        return "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200";
      case "deal done":
      case "deal closed":
        return "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200";
      default:
        return "bg-muted text-muted-foreground";
    }
  };

  const formatLabel = (key: string) => {
    return key
      .replace(/_/g, " ")
      .replace(/([a-z])([A-Z])/g, "$1 $2")
      .replace(/\b\w/g, (c) => c.toUpperCase());
  };

  const formatValue = (key: string, value: unknown) => {
    if (key === "created_time" && value) {
      return formatDate(String(value));
    }
    if (["followUpDate", "followUpTime"].includes(key)) {
      return value || "Not scheduled";
    }
    return value !== undefined && value !== null ? String(value) : "N/A";
  };

  const statuses = Array.from(
    new Set(leads.map((lead) => lead.lead_status))
  ).filter(Boolean);

  const platforms = Array.from(
    new Set(leads.map((lead) => lead.platform))
  ).filter(Boolean);

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);

  if (isLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <SyncLoader color="hsl(var(--primary))" />
      </div>
    );
  }

  if (leads.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="bg-muted border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
          <X className="h-8 w-8 text-muted-foreground" />
        </div>
        <h3 className="mt-4 text-lg font-medium text-foreground">
          No leads found
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          There are no leads to display at the moment.
        </p>
      </div>
    );
  }

  const DetailCard = ({
    label,
    value,
    statusColor,
  }: {
    label: string;
    value: string;
    statusColor?: string;
  }) => (
    <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary">
      <div className="flex items-start">
        <span className="font-medium text-muted-foreground flex-shrink-0 w-32">
          {label}:
        </span>
        {statusColor ? (
          <span
            className={`${statusColor} px-2 py-1 rounded-full text-xs font-semibold`}
          >
            {value}
          </span>
        ) : (
          <span className="text-foreground font-medium flex-grow break-words">
            {value}
          </span>
        )}
      </div>
    </div>
  );

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden relative">
      <div className="p-4 sm:p-6 border-b border-border">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads by name, number, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 pl-10 text-sm shadow-sm placeholder:text-muted-foreground focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring transition"
              />
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-4 w-4"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="mt-4 sm:mt-0 sm:ml-4 flex space-x-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="focus:ring-ring focus:border-ring block sm:text-sm border-input rounded-md bg-background"
            >
              <option value="all">All Statuses</option>
              {statuses.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>

            <select
              value={platformFilter}
              onChange={(e) => setPlatformFilter(e.target.value)}
              className="focus:ring-ring focus:border-ring block sm:text-sm border-input rounded-md bg-background"
            >
              <option value="all">All Platforms</option>
              {platforms.map((platform) => (
                <option key={platform} value={platform}>
                  {platform.toUpperCase()}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex flex-col md:flex-row h-[calc(100vh-150px)]">
        <div
          className={`transition-all duration-300 ease-in-out ${
            isSidePanelOpen ? "w-full md:w-2/6" : "w-full"
          } overflow-hidden flex flex-col`}
        >
          <div className="overflow-auto flex-grow">
            <table className="min-w-full divide-y divide-border">
              {!isSidePanelOpen && (
                <thead className="bg-card sticky top-0 z-10">
                  <tr>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-28 cursor-pointer"
                      onClick={() => handleSort("date")}
                    >
                      <div className="flex items-center">
                        Date
                        <span className="ml-1">
                          {sortingConfig.field === "date" &&
                            (sortingConfig.direction === "asc" ? "↑" : "↓")}
                        </span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Platform
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider w-24 cursor-pointer"
                      onClick={() => handleSort("name")}
                    >
                      <div className="flex items-center">
                        Name
                        <span className="ml-1">
                          {sortingConfig.field === "name" &&
                            (sortingConfig.direction === "asc" ? "↑" : "↓")}
                        </span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Contact
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Location
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider cursor-pointer"
                      onClick={() => handleSort("score")}
                    >
                      <div className="flex items-center">
                        Lead Score
                        <span className="ml-1">
                          {sortingConfig.field === "score" &&
                            (sortingConfig.direction === "asc" ? "↑" : "↓")}
                        </span>
                      </div>
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider"
                    >
                      Status
                    </th>
                    <th
                      scope="col"
                      className="px-4 py-3 text-right text-xs font-medium text-muted-foreground uppercase tracking-wider w-32"
                    >
                      Actions
                    </th>
                  </tr>
                </thead>
              )}
              <tbody className="bg-background divide-y divide-border">
                {paginatedItems.length > 0 ? (
                  paginatedItems.map((lead) => {
                    const score = extractScore(lead.comments || "");
                    const scoreColor = getScoreColor(score);
                    const platformInfo = getPlatformInfo(lead.platform);

                    const getInitial = () => {
                      if (!lead.name) return "?";
                      const match = lead.name.match(/[a-zA-Z]/);
                      return match ? match[0].toUpperCase() : "?";
                    };

                    return (
                      <tr
                        key={lead.id}
                        className={`transition-colors duration-150 ${
                          isSidePanelOpen && selectedLead?.id === lead.id
                            ? "bg-primary/10"
                            : "hover:bg-accent"
                        }`}
                      >
                        {isSidePanelOpen ? (
                          <td className="px-4 py-3">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => openSidePanel(lead)}
                            >
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-blue-200 flex items-center justify-center mr-3">
                                <span className="text-blue-900 font-medium">
                                  {getInitial()}
                                </span>
                              </div>
                              <div className="min-w-0 flex-grow">
                                <div className="flex justify-between items-baseline">
                                  <span className="text-sm font-bold truncate text-foreground">
                                    {lead.name || "N/A"}
                                  </span>
                                  <span className="text-xs text-muted-foreground whitespace-nowrap ml-2">
                                    {lead.created_time
                                      ? formatDate(lead.created_time)
                                      : "N/A"}
                                  </span>
                                </div>
                                <div className="text-xs text-muted-foreground truncate mt-1">
                                  {lead.whatsapp_number_ || "N/A"}
                                </div>
                              </div>
                            </div>
                          </td>
                        ) : (
                          <>
                            <td className="px-4 py-3 whitespace-nowrap text-sm text-muted-foreground w-28">
                              {lead.created_time
                                ? formatDate(lead.created_time)
                                : "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div
                                className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${platformInfo.color} font-bold`}
                                title={lead.platform || "Platform"}
                              >
                                {platformInfo.icon}
                              </div>
                            </td>
                            <td
                              className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary hover:text-primary/80 hover:underline cursor-pointer w-24 truncate"
                              onClick={() => openSidePanel(lead)}
                              title={lead.name || "N/A"}
                            >
                              {lead.name || "N/A"}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="flex items-center">
                                <Phone
                                  size={16}
                                  className="text-muted-foreground mr-2"
                                />
                                <div className="text-sm text-muted-foreground truncate max-w-[120px]">
                                  {lead.whatsapp_number_ || "N/A"}
                                </div>
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className="text-sm text-muted-foreground truncate max-w-[140px]">
                                {extractLocation(lead.comments || "")}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap">
                              <div className={`text-sm ${scoreColor}`}>
                                {score ?? "N/A"}
                              </div>
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap relative">
                              <select
                                value={lead.lead_status || ""}
                                onChange={(e) =>
                                  handleStatusChange(lead.id!, e.target.value)
                                }
                                disabled={updatingStatus === lead.id}
                                className={`px-2 py-1 text-xs leading-5 font-semibold rounded-md ${getStatusColor(
                                  lead.lead_status
                                )} focus:outline-none focus:ring-1 focus:ring-ring w-full ${
                                  updatingStatus === lead.id
                                    ? "cursor-not-allowed opacity-70"
                                    : ""
                                }`}
                              >
                                {statusOptions.map((status) => (
                                  <option key={status} value={status}>
                                    {status}
                                  </option>
                                ))}
                              </select>
                              {updatingStatus === lead.id && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted rounded">
                                  <SyncLoader size={5} color="hsl(var(--primary))" />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium w-32">
                              <div className="flex items-center justify-end space-x-2">
                                <a
                                  href={`https://wa.me/${lead.whatsapp_number_}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-green-600 hover:text-green-800"
                                  title="Open WhatsApp"
                                >
                                  <FaWhatsapp className="text-lg" />
                                </a>

                                <div
                                  className={`cursor-pointer p-1 rounded-full ${
                                    lead.followUpDate || lead.followUpTime
                                      ? "text-green-600 bg-green-100 dark:bg-green-900/30"
                                      : "text-muted-foreground bg-muted"
                                  } hover:bg-accent transition`}
                                  onClick={() => handleFollowUpClick(lead.id!)}
                                  title="Schedule Follow-up"
                                >
                                  <FaBell className="text-lg" />
                                </div>
                              </div>

                              {followUpLeadId === lead.id && (
                                <div
                                  className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50"
                                  onClick={() => setFollowUpLeadId(null)}
                                >
                                  <div
                                    className="bg-card border border-border rounded-md p-6 shadow-lg w-80 relative"
                                    onClick={(e) => e.stopPropagation()}
                                  >
                                    <button
                                      onClick={() => setFollowUpLeadId(null)}
                                      className="absolute top-3 right-3 text-muted-foreground hover:text-foreground"
                                      aria-label="Close"
                                    >
                                      ✕
                                    </button>
                                    <div className="flex justify-center mb-4">
                                      <h3 className="text-lg font-semibold text-foreground">
                                        Follow Up
                                      </h3>
                                    </div>
                                    <div className="mb-4">
                                      <label
                                        htmlFor="followUpDate"
                                        className="block text-sm font-medium text-muted-foreground"
                                      >
                                        Date
                                      </label>
                                      <input
                                        type="date"
                                        id="followUpDate"
                                        value={followUpDate}
                                        onChange={(e) =>
                                          setFollowUpDate(e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-input bg-background shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                                      />
                                    </div>
                                    <div className="mb-6">
                                      <label
                                        htmlFor="followUpTime"
                                        className="block text-sm font-medium text-muted-foreground"
                                      >
                                        Time
                                      </label>
                                      <input
                                        type="time"
                                        id="followUpTime"
                                        value={followUpTime}
                                        onChange={(e) =>
                                          setFollowUpTime(e.target.value)
                                        }
                                        className="mt-1 block w-full rounded-md border-input bg-background shadow-sm focus:border-ring focus:ring-ring sm:text-sm"
                                      />
                                    </div>
                                    <button
                                      onClick={() => handleSchedule(lead.id!)}
                                      className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition"
                                      disabled={!followUpDate || !followUpTime}
                                    >
                                      Schedule
                                    </button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan={8}
                      className="px-6 py-4 text-center text-sm text-muted-foreground"
                    >
                      No leads found matching your criteria
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div
          className={`bg-card border-l border-border transition-all duration-300 ease-in-out overflow-hidden flex ${
            isSidePanelOpen ? "w-full md:w-4/6" : "w-0"
          }`}
        >
          {isSidePanelOpen && selectedLead && (
            <div className="flex flex-col w-full">
              <div className="p-4 border-b border-border flex justify-between items-center bg-card">
                <div>
                  <h2 className="text-xl font-semibold flex items-center gap-2 text-foreground">
                    <User size={20} className="text-primary" />
                    Lead Details
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    {selectedLead.name || "Unnamed Lead"} • {selectedLead.email}
                  </p>
                </div>
                <button
                  onClick={closeSidePanel}
                  className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-full hover:bg-muted"
                >
                  <X size={24} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Object.entries(selectedLead)
                    .filter(
                      ([key]) =>
                        ![
                          "id",
                          "commentsHistory",
                          "comments",
                          "customerComment",
                        ].includes(key)
                    )
                    .map(([key, value]) => {
                      if (key === "platform") {
                        const platformInfo = getPlatformInfo(
                          String(value) || ""
                        );
                        return (
                          <div
                            key={key}
                            className="bg-card border border-border rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary"
                          >
                            <div className="flex items-start">
                              <span className="font-medium text-muted-foreground flex-shrink-0 w-32">
                                {formatLabel(key)}:
                              </span>
                              <div className="flex items-center">
                                <div
                                  className={`inline-flex items-center justify-center w-8 h-8 rounded-full ${platformInfo.color} font-bold mr-2`}
                                >
                                  {platformInfo.icon}
                                </div>
                                <span className="text-foreground font-medium">
                                  {String(value) || "N/A"}
                                </span>
                              </div>
                            </div>
                          </div>
                        );
                      } else {
                        return (
                          <DetailCard
                            key={key}
                            label={formatLabel(key)}
                            value={String(formatValue(key, value))}
                            statusColor={
                              key === "lead_status"
                                ? getStatusColor(String(value))
                                : undefined
                            }
                          />
                        );
                      }
                    })}

                  <DetailCard
                    label="Location"
                    value={
                      extractLocation(selectedLead.comments || "") || "N/A"
                    }
                  />
                  <DetailCard
                    label="Profession"
                    value={
                      parseComments(selectedLead.comments || "").find(
                        (item) => item.label === "Profession"
                      )?.value || "N/A"
                    }
                  />
                  <DetailCard
                    label="They are"
                    value={
                      parseComments(selectedLead.comments || "").find(
                        (item) => item.label === "They are"
                      )?.value || "N/A"
                    }
                  />
                  <DetailCard
                    label="Child's Age"
                    value={
                      parseComments(selectedLead.comments || "").find(
                        (item) => item.label === "Child's Age"
                      )?.value || "N/A"
                    }
                  />

                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary">
                    <div className="flex items-start">
                      <span className="font-medium text-muted-foreground flex-shrink-0 w-32">
                        Lead Score:
                      </span>
                      <span
                        className={`${getScoreColor(
                          extractScore(selectedLead.comments || "")
                        )} font-medium flex-grow break-words`}
                      >
                        {extractScore(selectedLead.comments || "") ?? "N/A"}
                      </span>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary md:col-span-2">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-muted-foreground flex items-center">
                        <MessageSquare size={18} className="mr-2 text-muted-foreground" />
                        Comments Thread
                      </h3>
                      <span className="text-xs text-muted-foreground">
                        {commentsHistory.length} comments
                      </span>
                    </div>
                    
                    <div className="space-y-4 max-h-60 overflow-y-auto pr-2">
                      {commentsHistory.length > 0 ? (
                        commentsHistory.map((comment, index) => (
                          <div 
                            key={index} 
                            className="flex items-start gap-3 animate-fadeIn"
                          >
                            <div className="flex-shrink-0 mt-1">
                              <div className="bg-muted border-2 border-dashed rounded-xl w-8 h-8" />
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-baseline">
                                <span className="font-medium text-sm text-foreground">
                                  {comment.user || "Unknown User"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="mt-1 bg-muted rounded-lg p-3 text-sm">
                                <p className="text-foreground">{comment.content}</p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <MessageSquare size={24} className="mx-auto mb-2" />
                          <p>No comments yet</p>
                          <p className="text-xs mt-1">Be the first to comment</p>
                        </div>
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 text-right">
                      {commentsHistory.length}/30 comments
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-xl p-4 shadow-sm transition-all duration-200 hover:shadow-md hover:border-primary md:col-span-2">
                    <div className="flex items-start">
                      <span className="font-medium text-muted-foreground flex-shrink-0 w-32">
                        Customer Comment:
                      </span>
                      {isEditingCustomerComment ? (
                        <div className="flex-grow">
                          <textarea
                            value={customerComment}
                            onChange={(e) => setCustomerComment(e.target.value)}
                            rows={4}
                            className="w-full px-3 py-2 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-ring"
                            autoFocus
                            placeholder="Add your comment here"
                          />
                          <div className="flex justify-end space-x-2 mt-2">
                            <button
                              onClick={() => {
                                setIsEditingCustomerComment(false);
                                setCustomerComment(
                                  String(selectedLead.customerComment || "")
                                );
                              }}
                              className="px-3 py-1 text-sm text-muted-foreground hover:text-foreground"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={handleSaveCustomerComment}
                              className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                            >
                              Save
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex-grow group relative">
                          <p className="text-foreground font-medium break-words">
                            {customerComment || "No comments yet"}
                          </p>
                          <button
                            className="absolute top-0 right-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 text-muted-foreground hover:text-primary"
                            onClick={() => setIsEditingCustomerComment(true)}
                            title="Edit comment"
                          >
                            <Pencil size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {totalPages > 1 && (
        <div className="bg-card px-4 py-3 flex items-center justify-between border-t border-border">
          <div className="flex-1 flex justify-between items-center">
            <p className="text-sm text-muted-foreground">
              Showing{" "}
              <span className="font-medium text-foreground">
                {(currentPage - 1) * itemsPerPage + 1}
              </span>{" "}
              to{" "}
              <span className="font-medium text-foreground">
                {Math.min(currentPage * itemsPerPage, sortedLeads.length)}
              </span>{" "}
              of <span className="font-medium text-foreground">{sortedLeads.length}</span> leads
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm rounded-md ${
                  currentPage === 1
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-background text-primary hover:bg-accent border border-border"
                }`}
              >
                Previous
              </button>
              <button
                onClick={() =>
                  setCurrentPage(Math.min(totalPages, currentPage + 1))
                }
                disabled={currentPage === totalPages}
                className={`px-4 py-2 text-sm rounded-md ${
                  currentPage === totalPages
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                }`}
              >
                Next
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LeadsTable;