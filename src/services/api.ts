import axios from "axios";
import { getAuth } from "firebase/auth";
import { Lead, LeadsResponse } from "../types";
import {
  db,
  getLeadsCol,
  updateLead,
  getLeadsColByUser,
  updateLeadByUser,
} from "../services/firebase";
import { doc, setDoc, addDoc, getDocs } from "firebase/firestore";
import { createLead } from "./firebase";

const BASE_API_URL =
  "https://asia-south1-starzapp.cloudfunctions.net/whatsAppWebHook-2/fetch-individual-client-leads";

const generateLeadHash = (lead: Lead) =>
  `${lead.whatsapp_number_}_${lead.created_time}`;

export const syncLeadsFromSheets = async (): Promise<void> => {
  try {
    const auth = getAuth();
    const user = auth.currentUser;

    if (!user || !user.phoneNumber) {
      throw new Error("User not authenticated or phone number missing");
    }

    const sanitizedPhone = user.phoneNumber.replace(/[^\d]/g, "");
    const sheetName = sanitizedPhone.slice(-10);

    const API_URL = `${BASE_API_URL}?sheetId=1D87OvwIf9Nw9UPHL93CzFyjQGzlO_vDM-jH0IN21jsU&sheetName=${sheetName}`;

    const userDocRef = doc(db, `crm_users/${sanitizedPhone}`);
    await setDoc(
      userDocRef,
      {
        source: "sheet",
        lastSyncedAt: new Date().toLocaleString("en-IN", {
          dateStyle: "medium",
          timeStyle: "short",
        }),
        displayName: user.displayName || "",
      },
      { merge: true }
    );

    const response = await axios.get<LeadsResponse>(API_URL);
    const sheetsLeads = response.data.leads;

    const firestoreSnapshot = await getDocs(getLeadsCol());
    const firestoreLeads = firestoreSnapshot.docs.map(
      (doc) => doc.data() as Lead
    );
    const existingHashes = new Set(
      firestoreLeads.map((lead) => generateLeadHash(lead))
    );

    const newLeads = sheetsLeads.filter(
      (sheetLead) => !existingHashes.has(generateLeadHash(sheetLead))
    );

    await Promise.all(newLeads.map((lead) => addDoc(getLeadsCol(), lead)));

    console.log(`Synced ${newLeads.length} new leads from Sheets`);
  } catch (error) {
    console.error("Error syncing leads:", error);
    throw error;
  }
};

export const fetchLeadsFromFirestore = async (
  phoneNumber?: string
): Promise<Lead[]> => {
  try {
    const col = phoneNumber ? getLeadsColByUser(phoneNumber) : getLeadsCol();

    const snapshot = await getDocs(col);
    return snapshot.docs.map(
      (doc) =>
        ({
          id: doc.id,
          ...doc.data(),
        } as Lead)
    );
  } catch (error) {
    console.error("Error fetching leads:", error);
    throw error;
  }
};

export const updateLeadStatus = async (
  leadId: string,
  newStatus: string,
  userPhone?: string
): Promise<void> => {
  try {
    if (userPhone) {
      await updateLeadByUser(userPhone, leadId, { lead_status: newStatus });
    } else {
      await updateLead(leadId, { lead_status: newStatus });
    }
  } catch (error) {
    console.error("Error updating lead:", error);
    throw error;
  }
};

export const importLeadsFromCSV = async (leads: Lead[]): Promise<void> => {
  try {
    // Use batched writes for better performance
    const batchPromises = leads.map((lead) => createLead(lead));
    await Promise.all(batchPromises);
  } catch (error) {
    console.error("Error importing leads:", error);
    throw new Error("Failed to save leads to database");
  }
};

export const scheduleFollowUp = async (
  leadId: string,
  date: Date,
  time: string,
  userPhone?: string
): Promise<void> => {
  try {
    if (userPhone) {
      await updateLeadByUser(userPhone, leadId, {
        followUpDate: date.toISOString(),
        followUpTime: time,
      });
    } else {
      await updateLead(leadId, {
        followUpDate: date.toISOString(),
        followUpTime: time,
      });
    }
  } catch (error) {
    console.error("Error scheduling follow-up:", error);
    throw error;
  }
};

export const updateCustomerComment = async (
  leadId: string,
  comment: string,
  userPhone?: string
): Promise<void> => {
  try {
    if (userPhone) {
      await updateLeadByUser(userPhone, leadId, { customerComment: comment });
    } else {
      await updateLead(leadId, { customerComment: comment });
    }
  } catch (error) {
    console.error("Error updating customer comment:", error);
    throw error;
  }
};
