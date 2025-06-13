import React, { useState, useMemo, useEffect } from "react";
import { format, parseISO, parse, isValid } from "date-fns";
import { Lead } from "../../types";
import { CustomKpi } from "../../types/types";
import {
  Phone,
  X,
  MessageSquare,
  MessagesSquare,
  MessageCircle,
  User,
  Award,
  ChevronDown,
  Calendar,
} from "lucide-react";
import {
  updateLeadStatus,
  scheduleFollowUp,
  appendCustomerComment,
} from "../../services/api";
import { SyncLoader } from "react-spinners";
import { FaBell, FaWhatsapp, FaFacebookF, FaInstagram } from "react-icons/fa";
import { CollapsibleQualifierSection } from "../../../src/components/collapsiblesection";

interface LeadsTableProps {
  leads: Lead[];
  onStatusUpdate: (index: string, newStatus: string) => void;
  onFollowUpScheduled: (leadId: string, date: string, time: string) => void;
  onUpdateCustomerComment: (leadId: string, comment: string) => void;
  isLoading?: boolean;
  viewingUserPhone: string;
  viewingUserDisplayName: string;
  customKpis: CustomKpi[];
}

const LeadsTable: React.FC<LeadsTableProps> = ({
  leads,
  onStatusUpdate,
  onFollowUpScheduled,
  onUpdateCustomerComment,
  isLoading = false,
  viewingUserPhone,
  viewingUserDisplayName,
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
  const [activeTab, setActiveTab] = useState<
    "Overview" | "Contact" | "Qualifiers" | "Comments"
  >("Overview");
  const [commentsHistory, setCommentsHistory] = useState<CommentHistoryItem[]>(
    []
  );

  // Status update modal state
  const [statusUpdateModalOpen, setStatusUpdateModalOpen] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  // const [statusUpdateComment, setStatusUpdateComment] = useState("");
  const [leadForStatusUpdate, setLeadForStatusUpdate] = useState<string | null>(
    null
  );

  interface CommentHistoryItem {
    user: string;
    displayName: string;
    content: string;
    timestamp: string;
  }

  const itemsPerPage = 20;

  const statusOptions = useMemo(() => {
    const customStatuses = customKpis.map((kpi) => kpi.label);
    return ["New Lead", "Meeting Done", "Deal Done", ...customStatuses];
  }, [customKpis]);

  // FIX: Simplified comment initialization
  useEffect(() => {
    if (selectedLead) {
      if (
        Array.isArray(selectedLead.customerComments) &&
        selectedLead.customerComments.length > 0
      ) {
        setCommentsHistory(selectedLead.customerComments);
      } else {
        setCommentsHistory([]);
      }
      setCustomerComment("");
    }
  }, [selectedLead]);

  const getPlatformInfo = (platform: string | undefined) => {
    if (!platform) return { icon: null, color: "bg-muted text-foreground" };

    const platformLower = platform.toLowerCase();

    if (platformLower === "ig")
      return {
        icon: <FaInstagram className="w-3 h-3" />,
        color:
          "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      };

    if (platformLower === "fb")
      return {
        icon: <FaFacebookF className="w-3 h-3" />,
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      };

    if (platformLower === "wa")
      return {
        icon: <FaWhatsapp className="w-3 h-3" />,
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      };

    if (platformLower.includes("facebook"))
      return {
        icon: <FaFacebookF className="w-3 h-3" />,
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      };

    if (platformLower.includes("instagram"))
      return {
        icon: <FaInstagram className="w-3 h-3" />,
        color:
          "bg-pink-100 text-pink-800 dark:bg-pink-900/30 dark:text-pink-300",
      };

    if (platformLower.includes("google"))
      return {
        icon: <MessageSquare className="w-3 h-3" />,
        color: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
      };

    if (platformLower.includes("zalo"))
      return {
        icon: <MessagesSquare className="w-3 h-3" />,
        color:
          "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
      };

    if (platformLower.includes("tiktok"))
      return {
        icon: <MessageCircle className="w-3 h-3" />,
        color: "bg-black text-white dark:bg-gray-800 dark:text-gray-200",
      };

    if (platformLower.includes("whatsapp"))
      return {
        icon: <FaWhatsapp className="w-3 h-3" />,
        color:
          "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
      };

    return {
      icon: (
        <span className="text-xs font-bold">
          {platform.substring(0, 2).toUpperCase()}
        </span>
      ),
      color: "bg-muted text-foreground",
    };
  };

  // FIXED: Only open modal for statuses that require comments
  const handleStatusSelection = async (leadId: string, status: string) => {
    setLeadForStatusUpdate(leadId);
    setSelectedStatus(status);
    setStatusUpdateModalOpen(true);
  };

  const handleStatusUpdateSubmit = async (comment: string) => {
    if (!leadForStatusUpdate || !selectedStatus) return;

    setUpdatingStatus(leadForStatusUpdate);
    setStatusUpdateModalOpen(false);

    try {
      await updateLeadStatus(
        leadForStatusUpdate,
        selectedStatus,
        viewingUserPhone
      );
      onStatusUpdate(leadForStatusUpdate, selectedStatus);

      if (comment.trim()) {
        const newComment: CommentHistoryItem = {
          user: viewingUserPhone,
          displayName: viewingUserDisplayName,
          content: `Status updated to ${selectedStatus}: ${comment.trim()}`,
          timestamp: new Date().toISOString(),
        };

        await appendCustomerComment(
          leadForStatusUpdate,
          newComment,
          viewingUserPhone
        );
      }
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
    setIsSidePanelOpen(true);
  };

  const closeSidePanel = () => {
    setIsSidePanelOpen(false);
    setSelectedLead(null);
  };

  const handleSaveCustomerComment = async () => {
    if (selectedLead && customerComment.trim()) {
      try {
        const user = viewingUserPhone || "User";
        const newComment: CommentHistoryItem = {
          user,
          displayName: viewingUserDisplayName,
          content: customerComment.trim(),
          timestamp: new Date().toISOString(),
        };

        await appendCustomerComment(
          selectedLead.id!,
          newComment,
          viewingUserPhone
        );

        onUpdateCustomerComment(selectedLead.id!, customerComment);

        let updatedComments = [...commentsHistory, newComment];
        if (updatedComments.length > 30) {
          updatedComments = updatedComments.slice(updatedComments.length - 30);
        }
        setCommentsHistory(updatedComments);
        setCustomerComment(""); // Clear input after sending
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
    if (score >= 50 && score <= 70) return "text-warning font-bold";
    return "text-success font-bold";
  };

  const getStatusColor = (status: string | undefined) => {
    if (!status) return "bg-muted text-foreground";

    switch (status.toLowerCase()) {
      case "meeting done":
        return "bg-primary/10 text-primary";
      case "deal done":
      case "deal closed":
        return "bg-success/10 text-success";
      case "interested":
        return "bg-warning/10 text-warning";
      default:
        return "bg-muted text-foreground";
    }
  };

  const formatLabel = (key: string) => {
    let formatted = key
      .replace(/_/g, " ")
      .replace(/[^\w\s]/gi, "")
      .replace(/([a-z])([A-Z])/g, "$1 $2");

    formatted = formatted.replace(/\b\w/g, (c) => c.toUpperCase());

    formatted = formatted
      .replace("Whatsapp Number", "WhatsApp")
      .replace("Full Name", "Name")
      .replace("They Are", "Role")
      .replace("Childs Age", "Child's Age");

    return formatted;
  };

  const formatValue = (key: string, value: unknown) => {
    if (typeof value === "boolean") {
      return value ? "Yes" : "No";
    }

    switch (key.toLowerCase()) {
      case "gender":
        return value === "m" ? "Male" : value === "f" ? "Female" : value;
      case "is_organic":
        return value ? "Organic" : "Paid";
      case "phone_number_verified":
        return value ? "Verified" : "Unverified";
      default:
        if (
          key.toLowerCase().includes("date") ||
          key.toLowerCase().includes("time")
        ) {
          return value ? formatDate(String(value)) : "Not scheduled";
        }
        return value !== undefined && value !== null ? String(value) : "N/A";
    }
  };

  const statuses = Array.from(
    new Set(leads.map((lead) => lead.lead_status))
  ).filter(Boolean);

  const platforms = Array.from(
    new Set(leads.map((lead) => lead.platform))
  ).filter(Boolean);

  const totalPages = Math.ceil(sortedLeads.length / itemsPerPage);

  const isContactField = (key: string) => {
    const contactPatterns = [
      /name/i,
      /phone/i,
      /whatsapp/i,
      /email/i,
      /age/i,
      /gender/i,
      /city/i,
      /location/i,
      /address/i,
      /child's age/i,
      /full name/i,
      /contact/i,
    ];

    return contactPatterns.some((pattern) => pattern.test(key));
  };

  // const isQualifierField = (key: string) => {
  //   const qualifierPatterns = [
  //     /ad_/i,
  //     /campaign_/i,
  //     /form_/i,
  //     /is_/i,
  //     /platform/i,
  //     /where/i,
  //     /how/i,
  //     /are you/i,
  //     /what is/i,
  //     /profession/i,
  //     /owner/i,
  //     /students/i,
  //     /fees/i,
  //     /question/i,
  //     /conditional/i,
  //     /verif/i,
  //     /enroll/i,
  //   ];

  //   return qualifierPatterns.some((pattern) => pattern.test(key));
  // };

  interface CollapsibleSectionProps {
    title: string;
    icon?: React.ReactNode;
    children: React.ReactNode;
    defaultOpen?: boolean;
  }

  const CollapsibleSection: React.FC<CollapsibleSectionProps> = ({
    title,
    icon,
    children,
    defaultOpen = true,
  }) => {
    const [isOpen, setIsOpen] = useState(defaultOpen);

    return (
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <button
          className="flex items-center justify-between w-full p-4 text-left"
          onClick={() => setIsOpen(!isOpen)}
        >
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="font-semibold text-foreground">{title}</h3>
          </div>
          <ChevronDown
            className={`transition-transform text-muted-foreground ${
              isOpen ? "rotate-180" : ""
            }`}
            size={18}
          />
        </button>

        {isOpen && <div className="p-4 border-t border-border">{children}</div>}
      </div>
    );
  };

  interface MetricCardProps {
    title: string;
    value: React.ReactNode;
    icon?: React.ReactNode;
    color?: string;
    bgFrom: string;
    bgTo: string;
  }

  const MetricCard: React.FC<MetricCardProps> = ({
    title,
    value,
    icon,
    color,
    bgFrom,
    bgTo,
  }) => (
    <div
      className={`bg-gradient-to-br ${bgFrom} ${bgTo} border border-border rounded-xl p-3`}
    >
      <div className="text-xs text-muted-foreground">{title}</div>
      <div className={`flex items-center mt-1 ${color || "text-foreground"}`}>
        {icon && <span className="mr-2">{icon}</span>}
        <span className="font-medium truncate">{value}</span>
      </div>
    </div>
  );

  interface StatusUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    selectedStatus: string;
    onSubmit: (comment: string) => void;
  }

  const StatusUpdateModal: React.FC<StatusUpdateModalProps> = ({
    isOpen,
    onClose,
    selectedStatus,
    onSubmit,
  }) => {
    const [comment, setComment] = useState("");

    if (!isOpen) return null;

    const handleSubmit = () => {
      onSubmit(comment);
      onClose();
    };

    return (
      <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50 transition-opacity duration-300 animate-fadeIn">
        <div className="bg-card border border-border rounded-lg p-6 shadow-xl w-full max-w-md relative transform transition-all duration-300 animate-slideUp">
          <button
            onClick={onClose}
            className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors duration-200"
            aria-label="Close"
          >
            ✕
          </button>

          <div className="flex justify-center mb-4">
            <h3 className="text-lg font-semibold text-foreground">
              Update Status to {selectedStatus}
            </h3>
          </div>

          <div className="mb-4">
            <label
              htmlFor="statusComment"
              className="block text-sm font-medium text-foreground mb-1"
            >
              Add Comment
            </label>
            <textarea
              id="statusComment"
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              className="mt-1 block w-full rounded-md border border-input bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm min-h-[100px] resize-y"
              placeholder="Enter comment for stage update..."
              autoFocus
            />
          </div>

          <button
            onClick={handleSubmit}
            className="w-full bg-primary text-primary-foreground py-2 rounded-md hover:bg-primary/90 transition-colors duration-200"
          >
            Update Status
          </button>
        </div>
      </div>
    );
  };

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

  return (
    <div className="bg-card rounded-lg shadow overflow-hidden relative">
      {/* Status update modal - UPDATED */}
      <StatusUpdateModal
        isOpen={statusUpdateModalOpen}
        onClose={() => setStatusUpdateModalOpen(false)}
        selectedStatus={selectedStatus}
        onSubmit={handleStatusUpdateSubmit}
      />

      <div className="p-4 sm:p-6 border-b border-border">
        <div className="sm:flex sm:items-center sm:justify-between">
          <div className="flex-1">
            <div className="relative">
              <input
                type="text"
                placeholder="Search leads by name, number, or location..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-input bg-background px-4 py-2 pl-10 text-sm shadow-sm placeholder:text-muted-foreground focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary transition"
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
              className="focus:ring-primary focus:border-primary block sm:text-sm border-input rounded-md bg-background"
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
              className="focus:ring-primary focus:border-primary block sm:text-sm border-input rounded-md bg-background"
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
                <thead className="bg-muted sticky top-0 z-10">
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
              <tbody className="bg-card divide-y divide-border">
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
                            : "hover:bg-muted"
                        }`}
                      >
                        {isSidePanelOpen ? (
                          <td className="px-4 py-3">
                            <div
                              className="flex items-center cursor-pointer"
                              onClick={() => openSidePanel(lead)}
                            >
                              <div className="flex-shrink-0 h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center mr-3">
                                <span className="text-primary font-medium">
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
                                  handleStatusSelection(
                                    lead.id!,
                                    e.target.value
                                  )
                                }
                                disabled={updatingStatus === lead.id}
                                className={`px-2 py-1 text-xs leading-5 font-semibold rounded-md ${getStatusColor(
                                  lead.lead_status
                                )} focus:outline-none focus:ring-1 focus:ring-primary w-full ${
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
                                <div className="absolute inset-0 flex items-center justify-center bg-accent rounded">
                                  <SyncLoader
                                    size={5}
                                    color="hsl(var(--primary))"
                                  />
                                </div>
                              )}
                            </td>
                            <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium w-32">
                              <div className="flex items-center justify-end space-x-2">
                                <a
                                  href={`https://wa.me/${lead.whatsapp_number_}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-success hover:text-success/80"
                                  title="Open WhatsApp"
                                >
                                  <FaWhatsapp className="text-lg" />
                                </a>

                                <div
                                  className={`cursor-pointer p-1 rounded-full ${
                                    lead.followUpDate || lead.followUpTime
                                      ? "text-success bg-success/10"
                                      : "text-foreground bg-muted"
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
                                        className="block text-sm font-medium text-foreground"
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
                                        className="mt-1 block w-full rounded-md border border-input bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
                                      />
                                    </div>
                                    <div className="mb-6">
                                      <label
                                        htmlFor="followUpTime"
                                        className="block text-sm font-medium text-foreground"
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
                                        className="mt-1 block w-full rounded-md border border-input bg-background shadow-sm focus:border-primary focus:ring-primary sm:text-sm"
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
            <div className="flex flex-col w-full h-full">
              <div className="p-4 bg-gradient-to-r from-primary/5 to-indigo-50 dark:to-indigo-900/10 border-b border-border">
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3 truncate">
                    <div className="bg-gradient-to-br from-primary to-indigo-600 w-10 h-10 rounded-lg flex items-center justify-center text-primary-foreground font-bold">
                      {selectedLead.name?.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="truncate">
                      <h1 className="text-lg font-bold text-foreground truncate flex items-center gap-2">
                        <span className="truncate">
                          {selectedLead.name || "Unnamed Lead"}
                        </span>
                        {selectedLead.lead_status && (
                          <span
                            className={`text-xs px-2 py-1 rounded-full ${getStatusColor(
                              selectedLead.lead_status
                            )}`}
                          >
                            {selectedLead.lead_status}
                          </span>
                        )}
                      </h1>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground truncate">
                        <span className="flex items-center truncate">
                          <Phone size={12} className="mr-1" />
                          {selectedLead.whatsapp_number_ || "N/A"}
                        </span>
                        <span className="flex items-center">
                          <Calendar size={12} className="mr-1" />
                          {selectedLead.created_time
                            ? formatDate(selectedLead.created_time)
                            : "N/A"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <a
                      href={`https://wa.me/${selectedLead.whatsapp_number_}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-success text-success-foreground px-3 py-1.5 rounded-lg flex items-center gap-1 text-sm hover:bg-success/90 transition-colors"
                    >
                      <FaWhatsapp size={14} />
                      <span>Message</span>
                    </a>
                    <button
                      onClick={closeSidePanel}
                      className="text-muted-foreground hover:text-foreground p-1.5 rounded-full hover:bg-accent transition-colors"
                    >
                      <X size={18} />
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex border-b border-border bg-card">
                {["Overview", "Contact", "Qualifiers", "Comments"].map(
                  (tab) => (
                    <button
                      key={tab}
                      className={`px-4 py-3 text-sm font-medium relative ${
                        activeTab === tab
                          ? "text-primary"
                          : "text-muted-foreground hover:text-foreground"
                      }`}
                      onClick={() =>
                        setActiveTab(
                          tab as
                            | "Overview"
                            | "Contact"
                            | "Qualifiers"
                            | "Comments"
                        )
                      }
                    >
                      {tab}
                      {activeTab === tab && (
                        <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"></div>
                      )}
                    </button>
                  )
                )}
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {activeTab === "Overview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <MetricCard
                        title="Lead Score"
                        value={
                          extractScore(selectedLead.comments || "") ?? "N/A"
                        }
                        color={getScoreColor(
                          extractScore(selectedLead.comments || "")
                        )}
                        bgFrom="from-primary/5"
                        bgTo="to-indigo-50 dark:to-indigo-900/10"
                      />

                      <MetricCard
                        title="Platform"
                        value={selectedLead.platform || "N/A"}
                        icon={getPlatformInfo(selectedLead.platform).icon}
                        bgFrom="from-success/5"
                        bgTo="to-emerald-50 dark:to-emerald-900/10"
                      />

                      <MetricCard
                        title="Location"
                        value={
                          extractLocation(selectedLead.comments || "") || "N/A"
                        }
                        bgFrom="from-warning/5"
                        bgTo="to-orange-50 dark:to-orange-900/10"
                      />

                      <MetricCard
                        title="Follow-up"
                        value={selectedLead.followUpDate || "Not scheduled"}
                        bgFrom="from-purple-50 dark:from-purple-900/10"
                        bgTo="to-fuchsia-50 dark:to-fuchsia-900/10"
                      />
                    </div>

                    <CollapsibleSection
                      title="Contact Preview"
                      icon={<User className="text-primary" size={16} />}
                      defaultOpen={false}
                    >
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        {Object.entries(selectedLead)
                          .filter(([key]) => isContactField(key))
                          .slice(0, 4)
                          .map(([key, value]) => (
                            <div key={key} className="flex">
                              <div className="w-24 text-muted-foreground truncate">
                                {formatLabel(key)}
                              </div>
                              <div className="font-medium text-foreground truncate">
                                {String(formatValue(key, value))}
                              </div>
                            </div>
                          ))}
                      </div>
                    </CollapsibleSection>

                    <CollapsibleSection
                      title="Qualifiers Preview"
                      icon={<Award className="text-success" size={16} />}
                      defaultOpen={false}
                    >
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 text-sm">
                      {(() => {
                        const comment = selectedLead.comments;
                        if (!comment) return null;
                        const lines = comment
                          .split("\n")
                          .filter((line) => line.trim());
                        return lines.map((line, idx) => {
                          const sepIndex = line.indexOf(": ");
                          let label: string, value: string;
                          if (sepIndex !== -1) {
                            label = line.substring(0, sepIndex).trim();
                            value = line.substring(sepIndex + 2).trim();
                          } else {
                            label = line;
                            value = "";
                          }
                          return (
                            <div
                              key={idx}
                              className="flex items-center p-2 hover:bg-gray-100 transition duration-200"
                            >
                              <div className="w-32 flex-shrink-0 text-gray-600 font-semibold">
                                {label}
                              </div>
                              <div className="font-medium truncate text-gray-800">
                                {value || "N/A"}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                    </CollapsibleSection>
                  </div>
                )}

                {activeTab === "Contact" && (
                  <CollapsibleSection
                    title="Contact Details"
                    icon={<User className="text-primary" size={18} />}
                    defaultOpen={true}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                      {Object.entries(selectedLead)
                        .filter(([key]) => isContactField(key))
                        .map(([key, value]) => (
                          <div key={key} className="flex">
                            <div className="w-32 flex-shrink-0 text-muted-foreground">
                              {formatLabel(key)}
                            </div>
                            <div className="font-medium text-foreground truncate">
                              {String(formatValue(key, value))}
                            </div>
                          </div>
                        ))}
                    </div>
                  </CollapsibleSection>
                )}

                {/* Qualifiers Tab */}
                {activeTab === "Qualifiers" && (
                  <CollapsibleQualifierSection
                    title="Lead Qualifiers"
                    icon={<Award className="text-green-500" size={18} />}
                    defaultOpen={true}
                  >
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-4 text-sm">
                      {(() => {
                        const comment = selectedLead.comments;
                        if (!comment) return null;
                        const lines = comment
                          .split("\n")
                          .filter((line) => line.trim());
                        return lines.map((line, idx) => {
                          const sepIndex = line.indexOf(": ");
                          let label: string, value: string;
                          if (sepIndex !== -1) {
                            label = line.substring(0, sepIndex).trim();
                            value = line.substring(sepIndex + 2).trim();
                          } else {
                            label = line;
                            value = "";
                          }
                          return (
                            <div
                              key={idx}
                              className="flex items-center p-2 hover:bg-gray-100 transition duration-200"
                            >
                              <div className="w-32 flex-shrink-0 text-gray-600 font-semibold">
                                {label}
                              </div>
                              <div className="font-medium truncate text-gray-800">
                                {value || "N/A"}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CollapsibleQualifierSection>
                )}

                {activeTab === "Comments" && (
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-2 mb-4">
                      <MessageSquare className="text-purple-500" size={18} />
                      <h3 className="text-lg font-semibold text-foreground">
                        Comments Thread
                      </h3>
                      <span className="ml-auto text-sm text-muted-foreground">
                        {commentsHistory.length} comments
                      </span>
                    </div>

                    <div className="flex-1 overflow-y-auto pr-2 space-y-4 mb-4">
                      {commentsHistory.length > 0 ? (
                        commentsHistory.map((comment, index) => (
                          <div
                            key={index}
                            className="flex items-start gap-3 animate-fadeIn"
                          >
                            <div className="flex-shrink-0">
                              <div className="bg-gradient-to-br from-primary to-indigo-600 w-9 h-9 rounded-full flex items-center justify-center text-primary-foreground font-bold">
                                {comment.displayName.charAt(0)}
                              </div>
                            </div>
                            <div className="flex-1">
                              <div className="flex justify-between items-baseline">
                                <span className="font-medium text-foreground">
                                  {comment.displayName || "Unknown User"}
                                </span>
                                <span className="text-xs text-muted-foreground">
                                  {new Date(comment.timestamp).toLocaleString()}
                                </span>
                              </div>
                              <div className="mt-1 bg-muted rounded-lg p-3 text-sm">
                                <p className="text-foreground">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-muted-foreground">
                          <MessageSquare size={24} className="mx-auto mb-2" />
                          <p>No comments yet</p>
                          <p className="text-xs mt-1">
                            Be the first to comment
                          </p>
                        </div>
                      )}
                    </div>

                    <div className="border-t border-border pt-4">
                      {/* Updated comment input with 3-line textarea-like input */}
                      <div className="relative">
                        <input
                          type="text"
                          value={customerComment}
                          onChange={(e) => setCustomerComment(e.target.value)}
                          className="w-full px-4 py-3 border border-input bg-background rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent text-sm min-h-[100px]"
                          placeholder="Type a comment..."
                          style={{
                            height: "100px",
                            lineHeight: "1.5",
                            overflowY: "auto",
                            resize: "vertical",
                            whiteSpace: "pre-wrap",
                            wordBreak: "break-word",
                          }}
                        />
                        <div className="absolute bottom-3 right-3 text-xs text-muted-foreground">
                          Enter to add new line
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={handleSaveCustomerComment}
                          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors text-sm"
                          disabled={!customerComment.trim()}
                        >
                          Send
                        </button>
                      </div>
                    </div>
                  </div>
                )}
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
              of{" "}
              <span className="font-medium text-foreground">
                {sortedLeads.length}
              </span>{" "}
              leads
            </p>
            <div className="flex space-x-2">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className={`px-4 py-2 text-sm rounded-md ${
                  currentPage === 1
                    ? "bg-muted text-muted-foreground cursor-not-allowed"
                    : "bg-background text-primary hover:bg-accent border border-input"
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
