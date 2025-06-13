import React, { useState, useRef, useEffect } from "react";
import { Menu, Monitor, Bell, Sun, Moon, X } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { useLocation } from "react-router-dom";
import { useTheme } from "../../context/ThemeContext";

interface HeaderProps {
  toggleSidebar: () => void;
}

interface VideoLink {
  id: number;
  title: string;
  url: string;
  thumbnail: string;
}

const Header: React.FC<HeaderProps> = ({ toggleSidebar }) => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const [notificationsCount] = useState(3);
  const [showVideoContainer, setShowVideoContainer] = useState(false);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const { isDarkMode, toggleTheme } = useTheme();

  const userInitial = currentUser?.displayName
    ? currentUser.displayName[0].toUpperCase()
    : "U";
  const userName = currentUser?.displayName || "User";
  const phoneNumber = currentUser?.phoneNumber || "";

  const toggleVideoContainer = () => {
    setShowVideoContainer(!showVideoContainer);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        videoContainerRef.current &&
        !videoContainerRef.current.contains(event.target as Node)
      ) {
        setShowVideoContainer(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const getPageInfo = () => {
    const path = location.pathname.split("/").pop();
    switch (path) {
      case "dashboard":
        return {
          title: "Leads",
          subtitle: "Welcome to your leads management dashboard",
        };
      case "analytics":
        return {
          title: "Analytics",
          subtitle: "Key insights from your lead data",
        };
      case "settings":
        return {
          title: "Settings",
          subtitle: "Manage your account settings and preferences",
        };
      default:
        return {
          title: "Dashboard",
          subtitle: "Welcome to your leads management dashboard",
        };
    }
  };

  const videoLinks: VideoLink[] = [
    {
      id: 1,
      title: "Getting Started with Leads Management",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    },
    {
      id: 2,
      title: "Advanced Analytics Tutorial",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    },
    {
      id: 3,
      title: "Customizing Your Dashboard",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    },
    {
      id: 4,
      title: "Mobile App Walkthrough",
      url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      thumbnail: "https://i.ytimg.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
    },
  ];

  const pageInfo = getPageInfo();

  return (
    <header className="flex-shrink-0 h-auto py-2 bg-white dark:bg-gray-800 shadow relative">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between px-4">
        <div className="flex items-center lg:hidden mb-2 sm:mb-0">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:hover:bg-gray-700"
          >
            <Menu size={24} />
          </button>
        </div>

        <div className="mb-2 sm:mb-0">
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white">
            {pageInfo.title}
          </h1>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {pageInfo.subtitle}
          </p>
        </div>

        <div className="flex items-center space-x-4">
          <div className="relative">
            <button
              className={`p-2 rounded-full focus:outline-none focus:ring-2 focus:ring-blue-500 ${
                showVideoContainer
                  ? "text-blue-600 bg-blue-100 dark:bg-blue-900 dark:text-blue-200"
                  : "text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
              onClick={toggleVideoContainer}
            >
              <Monitor size={20} />
            </button>
          </div>

          <div className="relative">
            <button
              className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700"
              onClick={() => console.log("Show notifications")}
            >
              <Bell size={20} />
            </button>
            {notificationsCount > 0 && (
              <span className="absolute top-0 right-0 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-red-500 rounded-full">
                {notificationsCount}
              </span>
            )}
          </div>

          <button
            className="p-2 rounded-full text-gray-500 hover:text-gray-700 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-gray-400 dark:hover:bg-gray-700"
            onClick={toggleTheme}
            aria-label={isDarkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {isDarkMode ? <Sun size={20} /> : <Moon size={20} />}
          </button>

          <div className="flex items-center space-x-2">
            <div className="h-8 w-8 bg-blue-600 flex items-center justify-center rounded-full text-white font-medium">
              {userInitial}
            </div>
            <div className="hidden sm:block">
              <p className="text-sm font-medium text-gray-700 dark:text-gray-200">
                {userName}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {phoneNumber}
              </p>
            </div>
          </div>
        </div>
      </div>

      {showVideoContainer && (
        <div
          ref={videoContainerRef}
          className="absolute top-full right-4 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl z-50 border border-gray-200 dark:border-gray-700"
        >
          <div className="p-4">
            <div className="flex justify-between items-center mb-3">
              <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                Tutorial Videos
              </h3>
              <button
                onClick={toggleVideoContainer}
                className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                aria-label="Close video container"
              >
                <X size={18} />
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto pr-2">
              <ul className="space-y-3">
                {videoLinks.map((video) => (
                  <li key={video.id}>
                    <a
                      href={video.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-start gap-3 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    >
                      <div className="flex-shrink-0">
                        <img
                          src={video.thumbnail}
                          alt={video.title}
                          className="w-16 h-12 rounded object-cover"
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {video.title}
                        </p>
                        <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                          Watch on YouTube
                        </div>
                      </div>
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
              <a
                href="https://www.youtube.com/channel/UC_x5XG1OV2P6uZZ5FSM9Ttw"
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 flex items-center justify-center"
              >
                View More Tutorials
              </a>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;