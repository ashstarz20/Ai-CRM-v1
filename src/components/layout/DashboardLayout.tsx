import React, { useState } from "react";
import { Outlet, Navigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "../../context/AuthContext";
import { motion, AnimatePresence } from "framer-motion";

const ChatBot: React.FC<{ open: boolean; onClose: () => void }> = ({ open, onClose }) => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<string[]>([
    "Hello! 👋",
    "How can I assist you today?",
  ]);

  const handleSend = () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setMessages(prev => [...prev, trimmed]);
    setInput("");
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 50, scale: 0.95 }}
          transition={{ duration: 0.3 }}
          className="fixed bottom-20 right-6 w-80 bg-white rounded-xl shadow-xl border border-border z-50 flex flex-col"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-border bg-muted rounded-t-xl">
            <span className="font-semibold text-sm text-foreground">Chat Support</span>
            <button
              onClick={onClose}
              className="text-muted-foreground hover:text-destructive transition"
              aria-label="Close Chat"
            >
              ✖
            </button>
          </div>

          {/* Messages */}
          <div className="p-4 h-64 overflow-y-auto text-sm text-muted-foreground space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className="bg-muted px-3 py-2 rounded w-fit max-w-xs break-words"
              >
                {msg}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="p-3 border-t border-border flex items-center gap-2">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type your message..."
              className="flex-1 px-3 py-2 text-sm border rounded-md focus:outline-none focus:ring focus:border-primary"
            />
            <button
              onClick={handleSend}
              className="bg-primary text-white px-3 py-2 text-sm rounded-md hover:bg-primary/90 transition"
            >
              Send
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const DashboardLayout: React.FC = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary" />
      </div>
    );
  }

  if (!loading && !currentUser) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="h-screen flex overflow-hidden bg-background">
      {/* Mobile Sidebar */}
      <div
        className={`lg:hidden fixed inset-0 z-40 flex ${sidebarOpen ? "" : "pointer-events-none"}`}
      >
        <div
          className={`fixed inset-0 bg-black/75 transition-opacity ease-in-out duration-300 ${
            sidebarOpen ? "opacity-100" : "opacity-0 pointer-events-none"
          }`}
          onClick={() => setSidebarOpen(false)}
        ></div>

        <div
          className={`relative flex-1 flex flex-col max-w-xs w-full bg-card transform transition ease-in-out duration-300 ${
            sidebarOpen ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <Sidebar closeSidebar={() => setSidebarOpen(false)} />
        </div>
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden lg:flex lg:flex-shrink-0">
        <div className="flex flex-col w-64">
          <div className="flex flex-col h-0 flex-1 border-r border-border bg-card">
            <Sidebar />
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex flex-col w-0 flex-1 overflow-hidden">
        <Header toggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

        <main className="flex-1 relative overflow-y-auto focus:outline-none">
          <div className="py-6 px-4 sm:px-6 lg:px-8">
            <Outlet />
          </div>
        </main>

        {/* Floating Chatbot Button */}
        <button
          className="fixed bottom-4 right-6 bg-primary text-white px-4 py-2 text-sm font-medium rounded-full shadow-lg hover:bg-primary/90 transition z-40"
          onClick={() => setChatOpen(true)}
        >
          Need Help?
        </button>

        {/* ChatBot Component */}
        <ChatBot open={chatOpen} onClose={() => setChatOpen(false)} />
      </div>
    </div>
  );
};

export default DashboardLayout;
