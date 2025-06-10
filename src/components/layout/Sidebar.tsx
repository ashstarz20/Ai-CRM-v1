// src/components/layout/Sidebar.tsx

import React, { useState, useCallback, useMemo, ReactNode } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  BarChart2,
  Mail,
  FileText,
  Settings,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
  Calendar,
  User,
  TrendingUp,
  Award,
  Facebook,
  Globe as GoogleIcon,
  MessageCircle,
  Webhook,
  Smartphone,
  MessageSquare,
  Instagram,
  Twitter,
  Linkedin
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

interface SidebarProps {
  closeSidebar?: () => void;
}

interface DropdownItem {
  to: string;
  label: string;
  icon: ReactNode;
}

interface DropdownProps {
  name: string;
  label: string;
  Icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  items: DropdownItem[];
  isOpen: boolean;
  toggle: (name: string) => void;
  isActive: boolean;
}

const dropdownVariants = {
  open: {
    opacity: 1,
    height: "auto",
    transition: { duration: 0.2, ease: "easeInOut" }
  },
  closed: {
    opacity: 0,
    height: 0,
    transition: { duration: 0.2, ease: "easeInOut" }
  }
};

const MemoizedDropdown: React.FC<DropdownProps> = React.memo(({
  name,
  label,
  Icon,
  items,
  isOpen,
  toggle,
  isActive
}) => {
  return (
    <div className="mb-1">
      <button
        onClick={() => toggle(name)}
        className={`flex items-center justify-between w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
          isActive
            ? "bg-blue-50 text-blue-700"
            : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
        }`}
      >
        <div className="flex items-center">
          <Icon className="mr-3 h-5 w-5" />
          {label}
        </div>
        {isOpen ? (
          <ChevronUp className="h-4 w-4" />
        ) : (
          <ChevronDown className="h-4 w-4" />
        )}
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial="closed"
            animate="open"
            exit="closed"
            variants={dropdownVariants}
            className="overflow-hidden"
          >
            <div className="pl-8 mt-1 space-y-1">
              {items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to.endsWith("/all")}
                  className={({ isActive: active }) =>
                    `group flex items-center px-3 py-2.5 text-sm font-medium rounded-md transition-all duration-200 ${
                      active
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`
                  }
                >
                  <span className="mr-3">{item.icon}</span>
                  {item.label}
                </NavLink>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
});

// Static dropdown configuration
const CHAT_ITEMS: DropdownItem[] = [
  { 
    to: "/dashboard/chats/all", 
    label: "All Chats", 
    icon: <MessageSquare className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/chats/whatsapp", 
    label: "WhatsApp", 
    icon: <MessageCircle className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/chats/facebook", 
    label: "Facebook", 
    icon: <Facebook className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/chats/instagram", 
    label: "Instagram", 
    icon: <Instagram className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/chats/linkedin", 
    label: "LinkedIn", 
    icon: <Linkedin className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/chats/twitter", 
    label: "Twitter", 
    icon: <Twitter className="h-4 w-4" /> 
  }
];

const CAMPAIGN_ITEMS: DropdownItem[] = [
  { 
    to: "/dashboard/campaigns/meta", 
    label: "Meta", 
    icon: <Facebook className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/campaigns/google", 
    label: "Google", 
    icon: <GoogleIcon className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/campaigns/whatsapp", 
    label: "WhatsApp", 
    icon: <MessageCircle className="h-4 w-4" /> 
  }
];

const CUSTOMER_ITEMS: DropdownItem[] = [
  { 
    to: "/dashboard/customers/basic", 
    label: "Basic", 
    icon: <User className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/customers/advance", 
    label: "Advance", 
    icon: <TrendingUp className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/customers/pro", 
    label: "Pro", 
    icon: <Award className="h-4 w-4" /> 
  }
];

const SERVICE_ITEMS: DropdownItem[] = [
  { 
    to: "/dashboard/services/google", 
    label: "Google", 
    icon: <GoogleIcon className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/services/meta", 
    label: "Meta", 
    icon: <Facebook className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/services/whatsapp", 
    label: "WhatsApp", 
    icon: <MessageCircle className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/services/web", 
    label: "Web", 
    icon: <Webhook className="h-4 w-4" /> 
  },
  { 
    to: "/dashboard/services/app", 
    label: "App", 
    icon: <Smartphone className="h-4 w-4" /> 
  }
];

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut]);

  const toggleDropdown = useCallback((name: string) => {
    setOpenDropdown((prev) => (prev === name ? null : name));
  }, []);

  const isDropdownActive = useCallback(
    (basePath: string) => location.pathname.startsWith(basePath),
    [location.pathname]
  );

  const getNavLinkClass = useCallback(
    (isActive: boolean) =>
      `group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
        isActive
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`,
    []
  );

  // Memoize active states for better performance
  const activeStates = useMemo(() => ({
    chats: isDropdownActive("/dashboard/chats"),
    campaigns: isDropdownActive("/dashboard/campaigns"),
    customers: isDropdownActive("/dashboard/customers"),
    services: isDropdownActive("/dashboard/services")
  }), [isDropdownActive]);

  return (
    <div className="h-full flex flex-col bg-white border-r border-gray-200">
      {/* Header */}
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-white border-b border-gray-200">
        <div className="flex items-center">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-8 h-8 rounded-full animate-pulse [animation-duration:5s]"
          />
          <span className="ml-2 text-xl font-semibold text-gray-900">
            <strong>STARZ Ai CRM</strong>
          </span>
        </div>
        {closeSidebar && (
          <button
            onClick={closeSidebar}
            className="lg:hidden rounded-md text-gray-500 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            aria-label="Close sidebar"
          >
            <X size={24} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        <nav className="px-2 py-4 space-y-1 flex-grow">
          <NavLink 
            to="/dashboard" 
            end 
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <LayoutDashboard className="mr-3 h-5 w-5" />
            Leads
          </NavLink>

          <NavLink
            to="/dashboard/analytics"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <BarChart2 className="mr-3 h-5 w-5" />
            Analytics
          </NavLink>


          {/* Chats Dropdown */}
          <MemoizedDropdown
            name="chats"
            label="Chats"
            Icon={MessageSquare}
            items={CHAT_ITEMS}
            isOpen={openDropdown === "chats"}
            toggle={toggleDropdown}
            isActive={activeStates.chats}
          />

          {/* Campaigns Dropdown */}
          <MemoizedDropdown
            name="campaigns"
            label="Campaigns"
            Icon={Mail}
            items={CAMPAIGN_ITEMS}
            isOpen={openDropdown === "campaigns"}
            toggle={toggleDropdown}
            isActive={activeStates.campaigns}
          />

          {/* Customers Dropdown */}
          <MemoizedDropdown
            name="customers"
            label="Customers"
            Icon={Users}
            items={CUSTOMER_ITEMS}
            isOpen={openDropdown === "customers"}
            toggle={toggleDropdown}
            isActive={activeStates.customers}
          />

          {/* Services Dropdown */}
          <MemoizedDropdown
            name="services"
            label="My Services"
            Icon={FileText}
            items={SERVICE_ITEMS}
            isOpen={openDropdown === "services"}
            toggle={toggleDropdown}
            isActive={activeStates.services}
          />

          <NavLink
            to="/dashboard/tasks"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <Calendar className="mr-3 h-5 w-5" />
            Task/Meet
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="border-t border-gray-200 px-3 py-4 flex-shrink-0">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </NavLink>

          <div className="mt-4 text-sm text-gray-400">Beta Version 1.0.0</div>
          <div className="text-xs text-gray-500 mt-1">
            (There might be few issues, kindly ignore.)
          </div>

          <button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center px-3 py-3 text-sm font-medium text-red-600 hover:text-red-700 rounded-md hover:bg-red-50 transition-all duration-200"
          >
            <LogOut className="mr-3 h-5 w-5" />
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;