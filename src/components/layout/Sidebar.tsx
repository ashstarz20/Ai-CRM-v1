// src\components\layout\Sidebar.tsx
import React, { useCallback, useState, useRef, useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  BarChart2,
  MessageCircle,
  Megaphone,
  Users,
  ShoppingBag,
  Calendar,
  Settings,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
  Facebook,
  Search,
  MessageSquare,
  User,
  UserCog,
  Award,
  Globe,
  Smartphone,
} from "lucide-react";
import { useAuth } from "../../context/AuthContext";

interface SidebarProps {
  closeSidebar?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ closeSidebar }) => {
  const { signOut } = useAuth();
  const location = useLocation();
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const submenuRefs = useRef<{
    campaigns: HTMLDivElement | null;
    customers: HTMLDivElement | null;
    myServices: HTMLDivElement | null;
  }>({
    campaigns: null,
    customers: null,
    myServices: null,
  });
  
  const [submenuHeights, setSubmenuHeights] = useState({
    campaigns: 0,
    customers: 0,
    myServices: 0,
  });

  useEffect(() => {
    setSubmenuHeights({
      campaigns: submenuRefs.current.campaigns?.scrollHeight || 0,
      customers: submenuRefs.current.customers?.scrollHeight || 0,
      myServices: submenuRefs.current.myServices?.scrollHeight || 0,
    });
  }, []);

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut]);

  const getNavLinkClass = useCallback(
    (isActive: boolean) =>
      `group flex items-center px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
        isActive
          ? "bg-primary/10 text-primary"
          : "text-muted-foreground hover:bg-muted hover:text-foreground"
      }`,
    []
  );

  const toggleMenu = (menu: string) => {
    setExpandedMenu(prev => prev === menu ? null : menu);
  };

  const isMenuActive = (path: string) => 
    location.pathname.startsWith(`/dashboard${path}`);

  return (
    <div className="h-full flex flex-col bg-background border-r border-border">
      {/* Header */}
      <div className="flex items-center justify-between h-16 flex-shrink-0 px-4 bg-background border-b border-border">
        <div className="flex items-center">
          <img
            src="/logo.png"
            alt="Logo"
            className="w-8 h-8 rounded-full animate-pulse [animation-duration:5s]"
          />
          <span className="ml-2 text-xl font-semibold text-foreground">
            <strong>STARZ Ai CRM</strong>
          </span>
        </div>
        {closeSidebar && (
          <button
            onClick={closeSidebar}
            className="lg:hidden rounded-md text-muted-foreground hover:text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
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

          {/* Chats Menu */}
          <NavLink
            to="/dashboard/chats"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <MessageCircle className="mr-3 h-5 w-5" />
            Chats
          </NavLink>

          {/* Campaigns Menu with Sub-Menus */}
          <div>
            <button
              onClick={() => toggleMenu("campaigns")}
              className={`group flex items-center justify-between w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                isMenuActive("/dashboard/campaigns")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center">
                <Megaphone className="mr-3 h-5 w-5" />
                Campaigns
              </div>
              {expandedMenu === "campaigns" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <div
              ref={el => submenuRefs.current.campaigns = el}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedMenu === "campaigns"
                  ? "opacity-100"
                  : "opacity-0 max-h-0"
              }`}
              style={{
                maxHeight: expandedMenu === "campaigns" 
                  ? `${submenuHeights.campaigns}px` 
                  : "0px"
              }}
            >
              <div className="pl-8 space-y-1 mt-1">
                <NavLink
                  to="/dashboard/campaigns/meta"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Facebook className="mr-3 h-4 w-4" />
                  Meta
                </NavLink>
                <NavLink
                  to="/dashboard/campaigns/google"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Search className="mr-3 h-4 w-4" />
                  Google
                </NavLink>
                <NavLink
                  to="/dashboard/campaigns/whatsapp"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <MessageSquare className="mr-3 h-4 w-4" />
                  WhatsApp
                </NavLink>
              </div>
            </div>
          </div>

          {/* Customers Menu with Sub-Menus */}
          <div>
            <button
              onClick={() => toggleMenu("customers")}
              className={`group flex items-center justify-between w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                isMenuActive("/dashboard/customers")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center">
                <Users className="mr-3 h-5 w-5" />
                Customers
              </div>
              {expandedMenu === "customers" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <div
              ref={el => submenuRefs.current.customers = el}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedMenu === "customers"
                  ? "opacity-100"
                  : "opacity-0 max-h-0"
              }`}
              style={{
                maxHeight: expandedMenu === "customers" 
                  ? `${submenuHeights.customers}px` 
                  : "0px"
              }}
            >
              <div className="pl-8 space-y-1 mt-1">
                <NavLink
                  to="/dashboard/customers/basic"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <User className="mr-3 h-4 w-4" />
                  Basic
                </NavLink>
                <NavLink
                  to="/dashboard/customers/advance"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <UserCog className="mr-3 h-4 w-4" />
                  Advance
                </NavLink>
                <NavLink
                  to="/dashboard/customers/pro"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Award className="mr-3 h-4 w-4" />
                  Pro
                </NavLink>
              </div>
            </div>
          </div>

          {/* MyServices Menu with Sub-Menus */}
          <div>
            <button
              onClick={() => toggleMenu("myServices")}
              className={`group flex items-center justify-between w-full px-3 py-3 text-sm font-medium rounded-md transition-all duration-200 ${
                isMenuActive("/dashboard/myservices")
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              }`}
            >
              <div className="flex items-center">
                <ShoppingBag className="mr-3 h-5 w-5" />
                MyServices
              </div>
              {expandedMenu === "myServices" ? (
                <ChevronUp className="h-4 w-4" />
              ) : (
                <ChevronDown className="h-4 w-4" />
              )}
            </button>
            <div
              ref={el => submenuRefs.current.myServices = el}
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                expandedMenu === "myServices"
                  ? "opacity-100"
                  : "opacity-0 max-h-0"
              }`}
              style={{
                maxHeight: expandedMenu === "myServices" 
                  ? `${submenuHeights.myServices}px` 
                  : "0px"
              }}
            >
              <div className="pl-8 space-y-1 mt-1">
                <NavLink
                  to="/dashboard/myservices/google"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  Google
                </NavLink>
                <NavLink
                  to="/dashboard/myservices/meta"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Facebook className="mr-3 h-4 w-4" />
                  Meta
                </NavLink>
                <NavLink
                  to="/dashboard/myservices/whatsapp"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <MessageSquare className="mr-3 h-4 w-4" />
                  WhatsApp
                </NavLink>
                <NavLink
                  to="/dashboard/myservices/web"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Globe className="mr-3 h-4 w-4" />
                  Web
                </NavLink>
                <NavLink
                  to="/dashboard/myservices/app"
                  className={({ isActive }) => getNavLinkClass(isActive)}
                >
                  <Smartphone className="mr-3 h-4 w-4" />
                  App
                </NavLink>
              </div>
            </div>
          </div>

          {/* Task/Meet Menu */}
          <NavLink
            to="/dashboard/taskmeet"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <Calendar className="mr-3 h-5 w-5" />
            Task/Meet
          </NavLink>
        </nav>

        {/* Footer */}
        <div className="border-t border-border px-3 py-4 flex-shrink-0">
          <NavLink
            to="/dashboard/settings"
            className={({ isActive }) => getNavLinkClass(isActive)}
          >
            <Settings className="mr-3 h-5 w-5" />
            Settings
          </NavLink>

          <div className="mt-4 text-sm text-muted-foreground">Beta Version 1.0.0</div>
          <div className="text-xs text-muted-foreground mt-1">
            (There might be few issues, kindly ignore.)
          </div>

          <button
            onClick={handleSignOut}
            className="mt-3 w-full flex items-center px-3 py-3 text-sm font-medium text-destructive hover:text-destructive/80 rounded-md hover:bg-destructive/10 transition-all duration-200"
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