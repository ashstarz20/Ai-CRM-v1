// Add new types
export interface CustomKpi {
  id: string;
  label: string;
  color: string;
  icon: string;
}

// Update Lead type
export interface Lead {
  id?: string;
  name: string;
  whatsapp_number_: string;
  comments: string;
  platform: string;
  lead_status: string;
  created_time: string;
  [key: string]: string | number | boolean | undefined;
}

export interface CustomField {
  id: string;
  name: string;
  type: "number" | "text" | "select" | "date" | "checkbox" | "textarea";
  options?: string[];
  user_phone: string;
}
