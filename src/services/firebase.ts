// ✅ src/services/firebase.ts
import {
  getFirestore,
  collection,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  doc,
  query,
  orderBy,
  Timestamp,
  onSnapshot,
} from "firebase/firestore";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";

export const db = getFirestore(app);
export { Timestamp };

export interface Lead {
  id?: string;
  name: string;
  email?: string;
  phone?: string;
  whatsapp_number_: string;
  comments: string;
  platform: string;
  lead_status: string;
  created_time: string;
  [key: string]: string | number | boolean | undefined;
}

export interface Chat {
  id: string;
  contact: {
    name: string;
    phone: string;
  };
  lastMessage?: {
    body: string;
    timestamp: Timestamp;
  };
  unreadCount?: number;
}

export interface Message {
  id: string;
  body: string;
  timestamp: Timestamp;
  direction: "incoming" | "outgoing";
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
}

export const getLeadsCol = () => {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user || !user.phoneNumber) {
    throw new Error("User not authenticated or phone number missing");
  }
  const phoneNumber = user.phoneNumber.replace(/[^\d]/g, "");
  return collection(db, `crm_users/${phoneNumber}/leads`);
};

export const getLeadsColByUser = (phoneNumber: string) => {
  return collection(db, `crm_users/${phoneNumber}/leads`);
};

export const fetchAllUsers = async () => {
  try {
    const usersCol = collection(db, "crm_users");
    const snapshot = await getDocs(usersCol);
    return snapshot.docs.map(doc => ({
      phoneNumber: doc.id,
      displayName: doc.data().displayName || doc.id,
      isAdmin: doc.data().isAdmin || false,
    }));
  } catch (error) {
    console.error("Error fetching users:", error);
    throw error;
  }
};

export const createLead = async (leadData: Lead) => {
  const auth = getAuth(app);
  const user = auth.currentUser;
  if (!user || !user.phoneNumber) {
    throw new Error("User not authenticated or phone number missing");
  }
  const phoneNumber = user.phoneNumber.replace(/[^\d]/g, "");
  const userDocRef = doc(db, `crm_users/${phoneNumber}`);

  await setDoc(
    userDocRef,
    {
      createdAt: new Date().toLocaleString("en-IN", {
        dateStyle: "medium",
        timeStyle: "short",
      }),
      displayName: user.displayName || "",
    },
    { merge: true }
  );

  const leadsCol = collection(userDocRef, "leads");
  return addDoc(leadsCol, leadData);
};

export const updateLead = (id: string, data: Partial<Lead>) =>
  updateDoc(doc(getLeadsCol(), id), data);

export const updateLeadByUser = (userPhone: string, id: string, data: Partial<Lead>) => {
  const leadDocRef = doc(db, `crm_users/${userPhone}/leads`, id);
  return updateDoc(leadDocRef, data);
};

export const getChatDocument = (accountId: string, chatId: string) =>
  doc(db, `accounts/${accountId}/discussion/${chatId}`);

export const getChatsByAccount = async (accountId: string): Promise<Chat[]> => {
  const chatsRef = collection(db, `accounts/${accountId}/discussion`);
  const snap = await getDocs(chatsRef);
  return snap.docs.map(d => {
    const data = d.data();
    const name = data.client_name || data.contact?.name || data.name || `+${d.id}`;
    return {
      id: d.id,
      contact: {
        name,
        phone: d.id,
      },
      lastMessage: data.lastMessage,
      unreadCount: data.unreadCount || 0,
    };
  });
};

export const getMessagesByChat = async (accountId: string, chatId: string): Promise<Message[]> => {
  const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
  const q = query(msgRef, orderBy("timestamp", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map(d => {
    const data = d.data();
    let body: string | undefined = data.body;
    if (!body) {
      if (data.text?.body) {
        body = data.text.body;
      } else if (data.interactive?.body?.text) {
        body = data.interactive.body.text;
      } else if (data.interactive?.header?.text) {
        body = data.interactive.header.text;
      } else if (Array.isArray(data.interactive?.action?.buttons) && data.interactive.action.buttons.length > 0) {
        body = data.interactive.action.buttons.map((btn: any) => btn.text).join(", ");
      }
    }

    return {
      id: d.id,
      body: body || "[No Content]",
      timestamp: data.timestamp as Timestamp,
      direction: data.direction || "incoming",
      status: data.status,
    };
  });
};

export const subscribeChats = (accountId: string, callback: (chats: Chat[]) => void) => {
  const chatsRef = collection(db, `accounts/${accountId}/discussion`);
  return onSnapshot(chatsRef, snapshot => {
    const chats: Chat[] = snapshot.docs.map(d => {
      const data = d.data();
      const name = data.client_name || data.contact?.name || data.name || `+${d.id}`;
      return {
        id: d.id,
        contact: { name, phone: d.id },
        lastMessage: data.lastMessage,
        unreadCount: data.unreadCount || 0,
      };
    });
    callback(chats);
  });
};

export const subscribeMessages = (
  accountId: string,
  chatId: string,
  callback: (msgs: Message[]) => void
) => {
  const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
  const q = query(msgRef, orderBy("timestamp", "asc"));
  return onSnapshot(q, snapshot => {
    const msgs: Message[] = snapshot.docs.map(d => {
      const data = d.data();
      let body: string | undefined = data.body;
      if (!body) {
        if (data.text?.body) {
          body = data.text.body;
        } else if (data.interactive?.body?.text) {
          body = data.interactive.body.text;
        } else if (data.interactive?.header?.text) {
          body = data.interactive.header.text;
        } else if (Array.isArray(data.interactive?.action?.buttons) && data.interactive.action.buttons.length > 0) {
          body = data.interactive.action.buttons.map((btn: any) => btn.text).join(", ");
        }
      }
      return {
        id: d.id,
        body: body || "[No Content]",
        timestamp: data.timestamp as Timestamp,
        direction: data.direction || "incoming",
        status: data.status,
      };
    });
    callback(msgs);
  });
};

export const addMessageToChat = async (
  accountId: string,
  chatId: string,
  msg: Omit<Message, 'id'>
) => {
  const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
  return addDoc(msgRef, msg);
};