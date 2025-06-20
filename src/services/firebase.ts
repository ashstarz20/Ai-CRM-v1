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
  limit,
  Timestamp,
  onSnapshot,
  serverTimestamp,
  writeBatch
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
  // New media fields
  media?: {
    type: 'image' | 'video' | 'document' | 'pdf' | 'audio';
    url: string;
    name?: string;
    size?: number;
  };
}

const extractMessageBody = (data: any): string => {
  if (data.body) return data.body;
  if (data.text?.body) return data.text.body;
  if (data.interactive?.body?.text) return data.interactive.body.text;
  if (data.interactive?.header?.text) return data.interactive.header.text;
  if (Array.isArray(data.interactive?.action?.buttons)) {
    return data.interactive.action.buttons.map((btn: any) => btn.text).join(", ");
  }
  return "[No Content]";
};

// Helper to determine if message has media
const extractMedia = (data: any) => {
  if (data.media) return data.media;
  if (data.document) return {
    type: 'document',
    url: data.document.url,
    name: data.document.name,
    size: data.document.size
  };
  if (data.image) return {
    type: 'image',
    url: data.image.url,
    name: data.image.name,
    size: data.image.size
  };
  if (data.video) return {
    type: 'video',
    url: data.video.url,
    name: data.video.name,
    size: data.video.size
  };
  if (data.audio) return {
    type: 'audio',
    url: data.audio.url,
    name: data.audio.name,
    size: data.audio.size
  };
  return null;
};

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
  const chatSnap = await getDocs(chatsRef);

  const chats: Chat[] = [];

  for (const d of chatSnap.docs) {
    const data = d.data();
    const chatId = d.id;
    const name = data.client_name || data.contact?.name || data.name || `+${chatId}`;
    const contact = { name, phone: chatId };

    const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
    const msgQuery = query(msgRef, orderBy("timestamp", "desc"), limit(1));
    const msgSnap = await getDocs(msgQuery);

    let lastMessage;
    if (!msgSnap.empty) {
      const msgData = msgSnap.docs[0].data();
      lastMessage = {
        body: extractMessageBody(msgData),
        timestamp: msgData.timestamp as Timestamp,
      };
    }

    chats.push({
      id: chatId,
      contact,
      lastMessage,
      unreadCount: data.unreadCount || 0,
    });
  }

  return chats;
};

export const getMessagesByChat = async (accountId: string, chatId: string): Promise<Message[]> => {
  const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
  const q = query(msgRef, orderBy("timestamp", "asc"));
  const snap = await getDocs(q);

  return snap.docs.map(d => {
    const data = d.data();
    const media = extractMedia(data);
    
    return {
      id: d.id,
      body: extractMessageBody(data),
      timestamp: data.timestamp as Timestamp,
      direction: data.direction || "incoming",
      status: data.status,
      media: media ? {
        type: media.type,
        url: media.url,
        name: media.name,
        size: media.size
      } : undefined
    };
  });
};

export const subscribeChats = (accountId: string, callback: (chats: Chat[]) => void) => {
  const chatsRef = collection(db, `accounts/${accountId}/discussion`);
  return onSnapshot(chatsRef, async snapshot => {
    const chats: Chat[] = [];

    for (const d of snapshot.docs) {
      const data = d.data();
      const chatId = d.id;
      const name = data.client_name || data.contact?.name || data.name || `+${chatId}`;
      const contact = { name, phone: chatId };

      const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
      const msgQuery = query(msgRef, orderBy("timestamp", "desc"), limit(1));
      const msgSnap = await getDocs(msgQuery);

      let lastMessage;
      if (!msgSnap.empty) {
        const msgData = msgSnap.docs[0].data();
        lastMessage = {
          body: extractMessageBody(msgData),
          timestamp: msgData.timestamp as Timestamp,
        };
      }

      chats.push({
        id: chatId,
        contact,
        lastMessage,
        unreadCount: data.unreadCount || 0,
      });
    }

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
  return onSnapshot(q, snapshot =>
    callback(snapshot.docs.map(d => {
      const data = d.data();
      const media = extractMedia(data);
      
      return {
        id: d.id,
        body: extractMessageBody(data),
        timestamp: data.timestamp as Timestamp,
        direction: data.direction || "incoming",
        status: data.status,
        media: media ? {
          type: media.type,
          url: media.url,
          name: media.name,
          size: media.size
        } : undefined
      };
    }))
  );
};

export const addMessageToChat = async (
  accountId: string,
  chatId: string,
  msg: Omit<Message, 'id'>
) => {
  const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
  const newDocRef = await addDoc(msgRef, msg);

  await updateDoc(getChatDocument(accountId, chatId), {
    lastMessage: {
      body: msg.body,
      timestamp: msg.timestamp || serverTimestamp(),
    },
    unreadCount: 0,
  });

  return newDocRef;
};

export const deleteAllMessagesInChat = async (accountId: string, chatId: string) => {
  const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
  const q = query(msgRef);
  const querySnapshot = await getDocs(q);
  
  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });
  
  await batch.commit();
};