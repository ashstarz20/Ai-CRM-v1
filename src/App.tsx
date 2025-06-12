import React from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Pages
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
// import LeadsManagement from "./pages/LeadsManagement";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Meta from "./pages/Campaign/Meta";
import Google from "./pages/Campaign/Google";
import WhatsApp from "./pages/Campaign/WhatsApp";
import Basic from "./pages/Customers/Basic";
import Advance from "./pages/Customers/Advance";
// Layout
import DashboardLayout from "./components/layout/DashboardLayout";
import Pro from "./pages/Customers/Pro";
// Services
import ServicesGoogle from "./pages/MyServices/Google";
import ServicesMeta from "./pages/MyServices/Meta";
import ServicesWhatsApp from "./pages/MyServices/WhatsApp";
import Web from "./pages/MyServices/Web";
import ServicesApp from "./pages/MyServices/App";
import Meet from "./pages/Task/Meet";

// Protected Route Component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<SignUp />} />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            {/* <Route path="leads" element={<LeadsManagement />} /> */}
            <Route path="analytics" element={<Analytics />} />
            <Route path="settings" element={<Settings />} />
            <Route path="taskmeet" element={<Meet />} />
            {/* Campaigns nested routes */}
            <Route path="campaigns">
              <Route path="meta" element={<Meta />} />
              <Route path="google" element={<Google />} />
              <Route path="whatsapp" element={<WhatsApp />} />
            </Route>
            <Route path="customers">
              <Route path="basic" element={<Basic />} />
              <Route path="advance" element={<Advance />} />
              <Route path="pro" element={<Pro />} />
            </Route>
            <Route path="myservices">
              <Route path="google" element={<ServicesGoogle />} />
              <Route path="meta" element={<ServicesMeta />} />
              <Route path="whatsapp" element={<ServicesWhatsApp />} />
              <Route path="web" element={<Web />} />
              <Route path="app" element={<ServicesApp />} />
            </Route>
          </Route>

          <Route path="/" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Router>

      <ToastContainer
        position="top-right"
        autoClose={5000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
      />
    </AuthProvider>
  );
}

export default App;
