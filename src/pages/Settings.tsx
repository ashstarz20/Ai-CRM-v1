import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { updateProfile } from "firebase/auth";
import {
  User,
  Phone,
  Plus,
  X,
  Home,
  Mail,
  FileText,
  MapPin,
  Calendar,
  IndianRupee,
  Users,
  CheckCircle,
  Check,
  BarChart2,
  Loader2,
  Tag,
} from "lucide-react";
import {
  addCustomKpi,
  fetchCustomKpis,
  deleteCustomKpi,
} from "../services/customKpis";
import { CustomKpi } from "../types/types";
import { doc, getDoc } from "firebase/firestore";
import { db } from "../services/firebase";
import {
  fetchCustomFields,
  addCustomField,
  deleteCustomField,
} from "../services/customFields";
import { CustomField } from "../types/types";

const Settings: React.FC = () => {
  const { currentUser } = useAuth();
  const [displayName, setDisplayName] = useState(
    currentUser?.displayName || ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [customKpis, setCustomKpis] = useState<CustomKpi[]>([]);
  const [newKpiLabel, setNewKpiLabel] = useState("");
  const [newKpiColor, setNewKpiColor] = useState("purple");
  const [newKpiIcon, setNewKpiIcon] = useState("home");
  const [isAdmin, setIsAdmin] = useState(false);
  const [activeTab, setActiveTab] = useState<"profile" | "kpis" | "fields">(
    "profile"
  );

  // Add new state variables for custom fields
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldType, setNewFieldType] = useState("text");
  const [newFieldOptions, setNewFieldOptions] = useState("");
  const [customFields, setCustomFields] = useState<CustomField[]>([]);

  // Define color options
  const colorOptions = [
    { value: "purple", name: "Purple", hex: "#8B5CF6" },
    { value: "yellow", name: "Yellow", hex: "#F59E0B" },
    { value: "indigo", name: "Indigo", hex: "#6366F1" },
    { value: "pink", name: "Pink", hex: "#EC4899" },
    { value: "teal", name: "Teal", hex: "#14B8A6" },
    { value: "red", name: "Red", hex: "#EF4444" },
    { value: "green", name: "Green", hex: "#10B981" },
    { value: "blue", name: "Blue", hex: "#3B82F6" },
  ];

  // Define icon options
  const iconOptions = [
    { value: "home", icon: <Home size={16} /> },
    { value: "mail", icon: <Mail size={16} /> },
    { value: "file-text", icon: <FileText size={16} /> },
    { value: "map-pin", icon: <MapPin size={16} /> },
    { value: "calendar", icon: <Calendar size={16} /> },
    { value: "indian-rupee", icon: <IndianRupee size={16} /> },
    { value: "users", icon: <Users size={16} /> },
    { value: "check-circle", icon: <CheckCircle size={16} /> },
  ];

  useEffect(() => {
    const checkAdmin = async () => {
      if (currentUser?.phoneNumber) {
        const sanitizedPhone = currentUser.phoneNumber.replace(/[^\d]/g, "");
        const userDocRef = doc(db, "crm_users", sanitizedPhone);
        const docSnap = await getDoc(userDocRef);
        setIsAdmin(docSnap.exists() && docSnap.data().isAdmin);
      }
    };

    const loadCustomKpis = async () => {
      if (currentUser?.phoneNumber) {
        try {
          const sanitizedPhone = currentUser.phoneNumber.replace(/[^\d]/g, "");
          const kpis = await fetchCustomKpis(sanitizedPhone);
          setCustomKpis(kpis);
        } catch (error) {
          console.error("Failed to load custom KPIs", error);
        }
      }
    };

    checkAdmin();
    loadCustomKpis();
  }, [currentUser]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!currentUser) return;

    try {
      setLoading(true);
      setError("");
      setSuccess("");

      await updateProfile(currentUser, {
        displayName: displayName,
      });

      setSuccess("Profile updated successfully!");
      setLoading(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      setError("Failed to update profile. Please try again.");
      setLoading(false);
    }
  };

  const handleAddKpi = async () => {
    if (!newKpiLabel.trim() || !currentUser?.phoneNumber) return;

    try {
      const sanitizedPhone = currentUser.phoneNumber.replace(/[^\d]/g, "");
      const newKpi = {
        label: newKpiLabel.trim(),
        color: newKpiColor,
        icon: newKpiIcon,
      };

      const addedKpi = await addCustomKpi(sanitizedPhone, newKpi);
      setCustomKpis([...customKpis, addedKpi]);
      setNewKpiLabel("");
      setSuccess("Custom KPI added successfully!");
      setError("");
    } catch (error) {
      console.error("Error adding custom KPI:", error);
      setError("Failed to add custom KPI. Please try again.");
      setSuccess("");
    }
  };

  const handleDeleteKpi = async (id: string) => {
    if (!currentUser?.phoneNumber) return;

    try {
      const sanitizedPhone = currentUser.phoneNumber.replace(/[^\d]/g, "");
      await deleteCustomKpi(sanitizedPhone, id);
      setCustomKpis(customKpis.filter((kpi) => kpi.id !== id));
      setSuccess("Custom KPI deleted successfully!");
      setError("");
    } catch (error) {
      console.error("Error deleting custom KPI:", error);
      setError("Failed to delete custom KPI. Please try again.");
      setSuccess("");
    }
  };

  // Add new functions
  const handleAddField = async () => {
    if (!newFieldName.trim() || !currentUser?.phoneNumber) return;

    try {
      const sanitizedPhone = currentUser.phoneNumber.replace(/[^\d]/g, "");

      const newField = {
        name: newFieldName.trim(),
        type: newFieldType as
          | "text"
          | "number"
          | "select"
          | "date"
          | "checkbox",
        user_phone: sanitizedPhone,
        // Only spread `options` if `newFieldType === "select"`
        ...(newFieldType === "select" && {
          options: newFieldOptions.split(",").map((opt) => opt.trim()),
        }),
      };

      const addedField = await addCustomField(sanitizedPhone, newField);
      setCustomFields([...customFields, addedField]);
      setNewFieldName("");
      setNewFieldType("text");
      setNewFieldOptions("");
      setSuccess("Custom field added successfully!");
      setError("");
    } catch (error) {
      console.error("Error adding custom field:", error);
      setError("Failed to add custom field. Please try again.");
      setSuccess("");
    }
  };

  const handleDeleteField = async (id: string) => {
    if (!currentUser?.phoneNumber) return;

    try {
      const sanitizedPhone = currentUser.phoneNumber.replace(/[^\d]/g, "");
      await deleteCustomField(sanitizedPhone, id);
      setCustomFields(customFields.filter((field) => field.id !== id));
      setSuccess("Custom field deleted successfully!");
      setError("");
    } catch (error) {
      console.error("Error deleting custom field:", error);
      setError("Failed to delete custom field. Please try again.");
      setSuccess("");
    }
  };

  // Add to the existing useEffect to load custom fields
  useEffect(() => {
    const loadCustomFields = async () => {
      if (currentUser?.phoneNumber) {
        try {
          const sanitizedPhone = currentUser.phoneNumber.replace(/[^\d]/g, "");
          const fields = await fetchCustomFields(sanitizedPhone);
          setCustomFields(fields);
        } catch (error) {
          console.error("Failed to load custom fields", error);
        }
      }
    };

    loadCustomFields();
  }, [currentUser]);

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-md border border-gray-200">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            <button
              onClick={() => setActiveTab("profile")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "profile"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Profile Settings
              </div>
            </button>
            {isAdmin && (
              <button
                onClick={() => setActiveTab("kpis")}
                className={`py-4 px-1 border-b-2 font-medium text-sm ${
                  activeTab === "kpis"
                    ? "border-blue-500 text-blue-600"
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                }`}
              >
                <div className="flex items-center">
                  <BarChart2 className="h-4 w-4 mr-2" />
                  Pipelines Settings
                  {customKpis.length > 0 && (
                    <span className="ml-2 bg-blue-100 text-blue-800 text-xs font-semibold px-2.5 py-0.5 rounded-full">
                      {customKpis.length}
                    </span>
                  )}
                </div>
              </button>
            )}

            <button
              onClick={() => setActiveTab("fields")}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === "fields"
                  ? "border-blue-500 text-blue-600"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
              }`}
            >
              <div className="flex items-center">
                <Tag className="h-4 w-4 mr-2" />
                Custom Fields
              </div>
            </button>
          </nav>
        </div>

        <div className="p-6">
          {/* Profile Settings Tab */}
          {activeTab === "profile" && (
            <div className="space-y-6">
              {error && (
                <div className="p-4 bg-red-50 rounded-lg border-l-4 border-red-500">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-red-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-red-700">{error}</p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="p-4 bg-green-50 rounded-lg border-l-4 border-green-500">
                  <div className="flex">
                    <div className="flex-shrink-0">
                      <svg
                        className="h-5 w-5 text-green-500"
                        xmlns="http://www.w3.org/2000/svg"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                    </div>
                    <div className="ml-3">
                      <p className="text-sm text-green-700">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleUpdateProfile} className="space-y-6">
                <div className="grid grid-cols-1 gap-6">
                  {/* Display Name */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Display Name
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <User className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="text"
                        value={displayName}
                        onChange={(e) => setDisplayName(e.target.value)}
                        className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                        placeholder="Your display name"
                      />
                    </div>
                  </div>

                  {/* Phone Number (now full-width) */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Phone Number
                    </label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <Phone className="h-5 w-5 text-gray-400" />
                      </div>
                      <input
                        type="tel"
                        value={currentUser?.phoneNumber || ""}
                        disabled
                        className="pl-10 w-full rounded-lg border border-gray-300 px-4 py-3 bg-gray-50 text-gray-500 focus:outline-none shadow-sm transition cursor-not-allowed"
                        placeholder="Your phone number"
                      />
                    </div>
                    <p className="mt-2 text-xs text-gray-500">
                      Phone number cannot be changed as it's used for
                      authentication.
                    </p>
                  </div>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    disabled={loading}
                    className={`w-full md:w-auto flex justify-center items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-all ${
                      loading
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                    }`}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                        Saving...
                      </>
                    ) : (
                      "Save Profile Changes"
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Custom KPIs Tab */}
          {activeTab === "kpis" && isAdmin && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Create new pipeline stage
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                  <div className="lg:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Stage Name
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={newKpiLabel}
                        onChange={(e) => setNewKpiLabel(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                        placeholder="e.g., Site Visit, Proposal Sent"
                      />
                      {newKpiLabel && (
                        <button
                          type="button"
                          onClick={() => setNewKpiLabel("")}
                          className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-500"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Icon
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {iconOptions.map((option) => (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => setNewKpiIcon(option.value)}
                          className={`p-3 rounded-xl flex flex-col items-center justify-center transition-all ${
                            newKpiIcon === option.value
                              ? "bg-blue-50 border-2 border-blue-500 shadow-sm"
                              : "bg-white border border-gray-200 hover:bg-gray-50"
                          }`}
                        >
                          {option.icon}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Select Color
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                      {colorOptions.map((color) => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setNewKpiColor(color.value)}
                          className={`h-10 rounded-lg flex items-center justify-center transition-all ${
                            newKpiColor === color.value
                              ? "ring-2 ring-offset-2 ring-blue-500"
                              : "hover:opacity-90"
                          }`}
                          style={{ backgroundColor: color.hex }}
                          title={color.name}
                        >
                          {newKpiColor === color.value && (
                            <Check className="h-4 w-4 text-white" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleAddKpi}
                  disabled={!newKpiLabel.trim()}
                  className={`mt-6 w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white transition-all ${
                    !newKpiLabel.trim()
                      ? "bg-gray-300 cursor-not-allowed"
                      : "bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800"
                  }`}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add pipeline Stage
                </button>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5 text-green-600"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path
                        fillRule="evenodd"
                        d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                        clipRule="evenodd"
                      />
                    </svg>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Your custom stages
                  </h3>
                </div>

                {customKpis.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="bg-gray-100 border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No custom pipelines created
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                      Create your first custom pipeline stage to track unique
                      lead stages beyond the default metrics.
                    </p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {customKpis.map((kpi) => {
                      const color =
                        colorOptions.find((c) => c.value === kpi.color) ||
                        colorOptions[0];
                      const icon =
                        iconOptions.find((i) => i.value === kpi.icon) ||
                        iconOptions[0];

                      return (
                        <div
                          key={kpi.id}
                          className="border border-gray-200 rounded-xl p-4 flex items-center justify-between transition-all hover:shadow-md"
                        >
                          <div className="flex items-center">
                            <div
                              className="w-12 h-12 rounded-xl flex items-center justify-center mr-4"
                              style={{ backgroundColor: `${color.hex}20` }}
                            >
                              <div style={{ color: color.hex }}>
                                {icon.icon}
                              </div>
                            </div>
                            <div>
                              <h4 className="font-medium text-gray-800">
                                {kpi.label}
                              </h4>
                              <p className="text-sm text-gray-500 mt-1">
                                <span
                                  className="inline-block w-3 h-3 rounded-full mr-1"
                                  style={{ backgroundColor: color.hex }}
                                ></span>
                                {color.name}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleDeleteKpi(kpi.id)}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2"
                            title="Delete KPI"
                          >
                            <X className="h-5 w-5" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}

                {customKpis.length > 0 && (
                  <div className="mt-6 bg-blue-50 rounded-lg p-4 border border-blue-100">
                    <div className="flex">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <p className="ml-3 text-sm text-blue-700">
                        Custom stages will appear as cards on your dashboard and
                        as status options in leads table.
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Add new tab content */}
          {activeTab === "fields" && isAdmin && (
            <div className="space-y-6">
              <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                <div className="flex items-center mb-4">
                  <div className="bg-blue-100 p-2 rounded-lg mr-3">
                    <Plus className="h-5 w-5 text-blue-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Create New Custom Field
                  </h3>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Name
                    </label>
                    <input
                      type="text"
                      value={newFieldName}
                      onChange={(e) => setNewFieldName(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                      placeholder="e.g., Location, Budget"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Field Type
                    </label>
                    <select
                      value={newFieldType}
                      onChange={(e) => setNewFieldType(e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                    >
                      <option value="text">Text</option>
                      <option value="number">Number</option>
                      <option value="select">Dropdown</option>
                      <option value="date">Date</option>
                      <option value="checkbox">Checkbox</option>
                    </select>
                  </div>

                  {newFieldType === "select" && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Options (comma separated)
                      </label>
                      <input
                        type="text"
                        value={newFieldOptions}
                        onChange={(e) => setNewFieldOptions(e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent shadow-sm transition"
                        placeholder="e.g., Option1, Option2"
                      />
                    </div>
                  )}
                </div>

                <button
                  onClick={handleAddField}
                  className="mt-6 w-full flex items-center justify-center px-4 py-3 border border-transparent text-base font-medium rounded-lg shadow-sm text-white bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Add Custom Field
                </button>
              </div>

              <div>
                <div className="flex items-center mb-4">
                  <div className="bg-green-100 p-2 rounded-lg mr-3">
                    <Tag className="h-5 w-5 text-green-600" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-800">
                    Your Custom Fields
                  </h3>
                </div>

                {customFields.length === 0 ? (
                  <div className="text-center py-8 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="bg-gray-100 border-2 border-dashed rounded-xl w-16 h-16 mx-auto flex items-center justify-center">
                      <Plus className="h-8 w-8 text-gray-400" />
                    </div>
                    <h3 className="mt-4 text-lg font-medium text-gray-900">
                      No custom fields created
                    </h3>
                    <p className="mt-1 text-sm text-gray-500 max-w-md mx-auto">
                      Create custom fields to store additional information about
                      your leads.
                    </p>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Field Name
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Type
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Options
                          </th>
                          <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Actions
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {customFields.map((field) => (
                          <tr key={field.id}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {field.name}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {field.type}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                              {field.options ? field.options.join(", ") : "-"}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                              <button
                                onClick={() => handleDeleteField(field.id)}
                                className="text-red-600 hover:text-red-900"
                              >
                                Delete
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Settings;
