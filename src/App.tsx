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
import Login from "./pages/Login";
import SignUp from "./pages/SignUp";
import Dashboard from "./pages/Dashboard";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Meta from "./pages/Campaign/Meta";
import Google from "./pages/Campaign/Google";
import WhatsApp from "./pages/Campaign/WhatsApp";
import DashboardLayout from "./components/layout/DashboardLayout";
import ServicesGoogle from "./pages/MyServices/Google";
import ServicesMeta from "./pages/MyServices/Meta";
import ServicesWhatsApp from "./pages/MyServices/WhatsApp";
import Web from "./pages/MyServices/Web";
import ServicesApp from "./pages/MyServices/App";
import Meet from "./pages/Task/Meet";
import Basic from "./pages/Customers/Basic";
import Advance from "./pages/Customers/Advance";
import Pro from "./pages/Customers/Pro";
import NotificationPage from "./pages/Notification";
import { CustomerTypeProvider } from "./context/CustomerTypeContext";
import { MeetProvider } from "./context/MeetContext";
import { NotificationProvider } from "./context/NotificationContext";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { currentUser, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100 dark:bg-gray-900">
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
      <NotificationProvider>
        <CustomerTypeProvider>
          <MeetProvider>
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
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="settings" element={<Settings />} />
                  <Route path="taskmeet" element={<Meet />} />
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
                    <Route path="sgoogle" element={<ServicesGoogle />} />
                    <Route path="smeta" element={<ServicesMeta />} />
                    <Route path="swhatsapp" element={<ServicesWhatsApp />} />
                    <Route path="sweb" element={<Web />} />
                    <Route path="sapp" element={<ServicesApp />} />
                  </Route>
                </Route>
                <Route
                  path="notifications"
                  element={
                    <ProtectedRoute>
                      <NotificationPage />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/"
                  element={<Navigate to="/dashboard" replace />}
                />
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
              theme="colored"
            />
          </MeetProvider>
        </CustomerTypeProvider>
      </NotificationProvider>
    </AuthProvider>
  );
}

export default App;
