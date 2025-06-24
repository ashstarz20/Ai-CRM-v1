import {
  getFirestore,
  collection,
  getDocs,
  getDoc,
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
  writeBatch,
  increment
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";

export const db = getFirestore(app);
export const storage = getStorage(app);
export { Timestamp };

export type MediaType = 'image' | 'video' | 'document' | 'pdf' | 'audio' | 'contact';

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
  from: string;
  text: {
    body: string;
  };
  timestamp: Timestamp;
  type: string;
  direction: "incoming" | "outgoing";
  status?: "sending" | "sent" | "delivered" | "read" | "failed";
  media?: {
    type: MediaType;
    url?: string;
    id?: string; // <-- Add this line to support WhatsApp media IDs
    name?: string;
    size?: number;
  };
}

const extractMessageBody = (data: any): string => {
  if (data.text?.body) return data.text.body;
  if (data.body) return data.body;
  if (data.interactive?.body?.text) return data.interactive.body.text;
  if (data.interactive?.header?.text) return data.interactive.header.text;
  if (Array.isArray(data.interactive?.action?.buttons)) {
    return data.interactive.action.buttons.map((btn: any) => btn.text).join(", ");
  }
  return "[No Content]";
};

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

// Helper function to get account phone number
const getAccountPhoneNumber = async (accountId: string): Promise<string> => {
  const accountDoc = await getDoc(doc(db, `accounts/${accountId}`));
  if (!accountDoc.exists()) {
    throw new Error("Account not found");
  }
  return accountDoc.data().phoneNumber;
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
  try {
    const chatsRef = collection(db, `accounts/${accountId}/discussion`);
    const chatSnap = await getDocs(chatsRef);
    
    return chatSnap.docs.map(d => {
      const data = d.data();
      const chatId = d.id;
      const name = data.client_name || data.contact?.name || data.name || `+${chatId}`;
      
      return {
        id: chatId,
        contact: { name, phone: chatId },
        lastMessage: data.lastMessage ? {
          body: data.lastMessage.body,
          timestamp: data.lastMessage.timestamp,
        } : undefined,
        unreadCount: data.unreadCount || 0,
      };
    });
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
};

export const getMessagesByChat = async (
  accountId: string,
  chatId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<Message[]> => {
  try {
    const accountPhone = await getAccountPhoneNumber(accountId);
    const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
    const q = query(
      msgRef,
      orderBy("timestamp", "desc"),
      limit(pageSize * page)
    );

    const snap = await getDocs(q);
    const messages = snap.docs.map(d => {
      const data = d.data();
      const media = extractMedia(data);
      const isOutgoing = (data.direction || "incoming") === "outgoing";

      return {
        id: d.id,
        from: isOutgoing ? accountPhone : data.from || "",
        text: { body: extractMessageBody(data) },
        timestamp: data.timestamp as Timestamp,
        type: data.type || "text",
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

    return messages.reverse();
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const subscribeChats = (accountId: string, callback: (chats: Chat[]) => void) => {
  const chatsRef = collection(db, `accounts/${accountId}/discussion`);
  
  return onSnapshot(chatsRef, (snapshot) => {
    const chats = snapshot.docs.map(d => {
      const data = d.data();
      const chatId = d.id;
      const name = data.client_name || data.contact?.name || data.name || `+${chatId}`;
      
      return {
        id: chatId,
        contact: { name, phone: chatId },
        lastMessage: data.lastMessage ? {
          body: data.lastMessage.body,
          timestamp: data.lastMessage.timestamp,
        } : undefined,
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
  
  return onSnapshot(q, async (snapshot) => {
    try {
      const accountPhone = await getAccountPhoneNumber(accountId);
      const messages = snapshot.docs.map(d => {
        const data = d.data();
        const media = extractMedia(data);
        const isOutgoing = (data.direction || "incoming") === "outgoing";
        
        return {
          id: d.id,
          from: isOutgoing ? accountPhone : data.from || "",
          text: { body: extractMessageBody(data) },
          timestamp: data.timestamp as Timestamp,
          type: data.type || "text",
          direction: data.direction || "incoming",
          status: data.status,
          media: media ? {
            type: media.type,
            url: media.url,
            name: media.name,
            size: media.size
          } : undefined,
        };
      });
      
      callback(messages);
    } catch (error) {
      console.error("Error in message subscription:", error);
    }
  });
};

export const addMessageToChat = async (
  accountId: string,
  chatId: string,
  msg: Omit<Message, 'id'>
) => {
  try {
    const accountPhone = await getAccountPhoneNumber(accountId);
    
    const msgRef = collection(db, `accounts/${accountId}/discussion/${chatId}/messages`);
    const newDocRef = await addDoc(msgRef, {
      ...msg,
      from: msg.direction === "outgoing" ? accountPhone : msg.from
    });

    // Create last message content
    const lastMessageContent = msg.text.body || 
      (msg.media ? `Sent a ${msg.media.type}` : 'Sent a file');
    
    // Update chat document for both incoming and outgoing messages
    await updateDoc(getChatDocument(accountId, chatId), {
      lastMessage: {
        body: lastMessageContent,
        timestamp: msg.timestamp || serverTimestamp(),
      },
      ...(msg.direction === "incoming" && { unreadCount: increment(1) })
    });

    return newDocRef;
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
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

// export const uploadFile = async (file: File, path: string): Promise<string> => {
//   try {
//     const storageRef = ref(storage, path);
//     const snapshot = await uploadBytes(storageRef, file);
//     return getDownloadURL(snapshot.ref);
//   } catch (error) {
//     console.error("Error uploading file:", error);
//     throw error;
//   }
// };


export const uploadImageToWhatsApp = async (
  phoneNumberId: string,
  file: File,
  type: string = "image/jpeg"
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("messaging_product", "whatsapp");

  const res = await fetch(`https://graph.facebook.com/v19.0/${phoneNumberId}/media`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${import.meta.env.VITE_WHATSAPP_TOKEN}`
    },
    body: formData
  });

  const data = await res.json();

  if (!res.ok) {
    console.error("Upload failed:", data);
    throw new Error(data.error?.message || "Image upload failed");
  }

   console.log("Uploaded media ID:", data.id);

  return data.id;
};

// Updated sendWhatsAppMessage to support media.id
export const sendWhatsAppMessage = async (
  phoneNumberId: string,
  to: string,
  message?: string,
  media?: {
    type: 'image' | 'video' | 'document' | 'audio';
    url?: string;
    id?: string;
    caption?: string;
    filename?: string;
  }
) => {
  try {
    const payload: any = {
      messaging_product: "whatsapp",
      recipient_type: "individual",
      to: to,
    };

    if (media) {
      payload.type = media.type;
      payload[media.type] = media.id
        ? { id: media.id, ...(media.caption && { caption: media.caption }) }
        : {
            link: media.url,
            ...(media.caption && { caption: media.caption }),
            ...(media.filename && { filename: media.filename })
          };
    } else if (message) {
      payload.type = "text";
      payload.text = { body: message };
    } else {
      throw new Error("Either message or media must be provided");
    }

    const response: Response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${import.meta.env.VITE_WHATSAPP_TOKEN}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      }
    );

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      throw new Error(`WhatsApp API error: ${response.status} - ${errorData?.error?.message || 'Unknown error'}`);
    }

    const responseData = await response.json();
    return {
      id: responseData?.messages?.[0]?.id,
      ...responseData
    };
  } catch (error: unknown) {
    console.error("Failed to send WhatsApp message:", error);
    throw error;
  }
};

export const getClientPhoneFromPath = (path: string): string | null => {
  // Allow + and digits for phone/chat id
  const match = path.match(/\/accounts\/\d+\/discussion\/([\d+]+)/);
  return match ? match[1] : null;
};