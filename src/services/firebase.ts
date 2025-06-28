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
  increment,
} from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getAuth } from "firebase/auth";
import app from "../config/firebase";

export const db = getFirestore(app);
export const storage = getStorage(app);
export { Timestamp };

export type MediaType = "image" | "video" | "document" | "audio";

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

export interface Media {
  id?: string;
  url?: string;
  mime_type?: string;
  sha256?: string;
  name?: string;
  size?: number;
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
  fcmToken?: string;
  // Media fields
  image?: {
    id?: string;
    url?: string;
    mime_type?: string;
    sha256?: string;
    name?: string;
    size?: number;
  };
  video?: {
    id?: string;
    url?: string;
    mime_type?: string;
    sha256?: string;
    name?: string;
    size?: number;
  };
  document?: {
    id?: string;
    url?: string;
    mime_type?: string;
    sha256?: string;
    name?: string;
    size?: number;
  };
  audio?: {
    id?: string;
    url?: string;
    mime_type?: string;
    sha256?: string;
    name?: string;
    size?: number;
  };
}

const extractMessageBody = (data: unknown): string => {
  if (typeof data === "object" && data !== null) {
    const d = data as any;
    if (d.text?.body) return d.text.body;
    if (d.body) return d.body;
    if (d.interactive?.body?.text) return d.interactive.body.text;
    if (d.interactive?.header?.text) return d.interactive.header.text;
    if (Array.isArray(d.interactive?.action?.buttons)) {
      return d.interactive.action.buttons
        .map((btn: any) => btn.text)
        .join(", ");
    }
  }
  return "[No Content]";
};

const extractMedia = async (data: any): Promise<any> => {
  // First check new structure
  if (data.image) return { type: "image", ...data.image };
  if (data.video) return { type: "video", ...data.video };
  if (data.document) return { type: "document", ...data.document };
  if (data.audio) return { type: "audio", ...data.audio };

  // Then old structure
  if (data.media) return data.media;

  // Then extract from whatsapp structure
  let mediaId: string | null = null;

  if (data.document) {
    mediaId = data.document.id;
    return {
      type: "document",
      id: data.document.id,
      url: data.document.url,
      name: data.document.name,
      size: data.document.size,
    };
  }
  if (data.image) {
    mediaId = data.image.id;
    return {
      type: "image",
      id: data.image.id,
      url: data.image.url,
      name: data.image.name,
      size: data.image.size,
    };
  }
  if (data.video) {
    mediaId = data.video.id;
    return {
      type: "video",
      id: data.video.id,
      url: data.video.url,
      name: data.video.name,
      size: data.video.size,
    };
  }
  if (data.audio) {
    mediaId = data.audio.id;
    return {
      type: "audio",
      id: data.audio.id,
      url: data.audio.url,
      name: data.audio.name,
      size: data.audio.size,
    };
  }
  if (data.contacts) {
    return {
      type: "contact",
      name: data.contacts[0]?.name?.formatted_name || "Unknown",
      id: data.contacts[0]?.wa_id || "",
    };
  }

  // Fetch media metadata if ID is available
  if (mediaId) {
    try {
      const mediaMeta = await fetchMediaById(mediaId);
      return {
        type: mediaMeta.type,
        url: mediaMeta.url,
        mime_type: mediaMeta.mime_type,
        sha256: mediaMeta.sha256,
        id: mediaId,
        name: mediaMeta.filename,
        size: mediaMeta.file_size,
      };
    } catch (error) {
      console.error("Error fetching media metadata:", error);
    }
  }

  return null;
};

// Helper function to get account phone number
export const getAccountPhoneNumber = async (
  accountId: string
): Promise<string> => {
  const accountDoc = await getDoc(doc(db, `accounts/${accountId}`));
  if (!accountDoc.exists()) {
    throw new Error("Account not found");
  }
  return accountDoc.data().phoneNumber;
};

// NEW: Get phone number ID from account
export const getAccountPhoneNumberId = async (
  accountId: string
): Promise<string> => {
  const accountDoc = await getDoc(doc(db, `accounts/${accountId}`));
  if (!accountDoc.exists()) {
    throw new Error("Account not found");
  }
  return accountDoc.data().phoneNumberId;
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
    return snapshot.docs.map((doc) => ({
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

export const updateLeadByUser = (
  userPhone: string,
  id: string,
  data: Partial<Lead>
) => {
  const leadDocRef = doc(db, `crm_users/${userPhone}/leads`, id);
  return updateDoc(leadDocRef, data);
};

export const getChatDocument = (accountId: string, chatId: string) =>
  doc(db, `accounts/${accountId}/discussion/${chatId}`);

export const getChatsByAccount = async (accountId: string): Promise<Chat[]> => {
  try {
    const chatsRef = collection(db, `accounts/${accountId}/discussion`);
    const chatSnap = await getDocs(chatsRef);

    const chats = await Promise.all(
      chatSnap.docs.map(async (d) => {
        const data = d.data();
        const chatId = d.id;
        const name =
          data.client_name || data.contact?.name || data.name || `+${chatId}`;

        // If lastMessage is missing, fetch the latest message
        let lastMessage = data.lastMessage;
        if (!lastMessage) {
          const msgRef = collection(
            db,
            `accounts/${accountId}/discussion/${chatId}/messages`
          );
          const q = query(msgRef, orderBy("timestamp", "desc"), limit(1));
          const msgSnap = await getDocs(q);
          if (!msgSnap.empty) {
            const msgData = msgSnap.docs[0].data();
            lastMessage = {
              body: extractMessageBody(msgData),
              timestamp: msgData.timestamp,
            };
          }
        }

        return {
          id: chatId,
          contact: { name, phone: chatId },
          lastMessage,
          unreadCount: data.unreadCount || 0,
        };
      })
    );

    return chats;
  } catch (error) {
    console.error("Error fetching chats:", error);
    throw error;
  }
};

export const sendMessage = async (
  accountId: string,
  chatId: string,
  messageBody: string
) => {
  const msgRef = collection(
    db,
    `accounts/${accountId}/discussion/${chatId}/messages`
  );

  const message = {
    body: messageBody,
    timestamp: serverTimestamp(),
    sender: "user",
    direction: "outgoing",
    type: "text",
  };

  const messageDoc = await addDoc(msgRef, message);

  const chatRef = doc(db, `accounts/${accountId}/discussion/${chatId}`);
  await updateDoc(chatRef, {
    lastMessage: {
      body: messageBody,
      timestamp: serverTimestamp(),
    },
  });

  return messageDoc;
};

export const getMessagesByChat = async (
  accountId: string,
  chatId: string,
  page: number = 1,
  pageSize: number = 20
): Promise<Message[]> => {
  try {
    const accountPhone = await getAccountPhoneNumber(accountId);
    const msgRef = collection(
      db,
      `accounts/${accountId}/discussion/${chatId}/messages`
    );
    const q = query(
      msgRef,
      orderBy("timestamp", "desc"),
      limit(pageSize * page)
    );

    const snap = await getDocs(q);
    const messages = [];

    for (const d of snap.docs) {
      const data = d.data();

      // Extract media using new structure
      const media = await extractMedia(data);
      const isOutgoing = (data.direction || "incoming") === "outgoing";

      messages.push({
        id: d.id,
        from: isOutgoing ? accountPhone : data.from || "",
        text: { body: extractMessageBody(data) },
        timestamp: data.timestamp as Timestamp,
        type: data.type || "text",
        direction: data.direction || "incoming",
        status: data.status,
        fcmToken: data.fcmToken || "",
        // Media fields
        image: media?.type === "image" ? media : undefined,
        video: media?.type === "video" ? media : undefined,
        document: media?.type === "document" ? media : undefined,
        audio: media?.type === "audio" ? media : undefined,
      });
    }

    return messages.reverse();
  } catch (error) {
    console.error("Error fetching messages:", error);
    throw error;
  }
};

export const subscribeChats = (
  accountId: string,
  callback: (chats: Chat[]) => void
) => {
  const chatsRef = collection(db, `accounts/${accountId}/discussion`);

  return onSnapshot(chatsRef, async (snapshot) => {
    // Fetch lastMessage for chats where it's missing
    const chats = await Promise.all(
      snapshot.docs.map(async (d) => {
        const data = d.data();
        const chatId = d.id;
        const name =
          data.client_name || data.contact?.name || data.name || `+${chatId}`;

        let lastMessage = data.lastMessage;
        if (!lastMessage) {
          try {
            const msgRef = collection(
              db,
              `accounts/${accountId}/discussion/${chatId}/messages`
            );
            const q = query(msgRef, orderBy("timestamp", "desc"), limit(1));
            const msgSnap = await getDocs(q);
            if (!msgSnap.empty) {
              const msgData = msgSnap.docs[0].data();
              lastMessage = {
                body: extractMessageBody(msgData),
                timestamp: msgData.timestamp,
              };
            } else {
              lastMessage = null; // Explicitly set to null if no messages
            }
          } catch (err) {
            console.error("Error fetching last message for chat", chatId, err);
            lastMessage = null;
          }
        }

        return {
          id: chatId,
          contact: { name, phone: chatId },
          lastMessage,
          unreadCount: data.unreadCount || 0,
        };
      })
    );

    callback(chats);
  });
};

export const subscribeMessages = (
  accountId: string,
  chatId: string,
  callback: (msgs: Message[]) => void
) => {
  const msgRef = collection(
    db,
    `accounts/${accountId}/discussion/${chatId}/messages`
  );
  const q = query(msgRef, orderBy("timestamp", "asc"));

  return onSnapshot(q, async (snapshot) => {
    try {
      const accountPhone = await getAccountPhoneNumber(accountId);
      const messages = [];

      for (const d of snapshot.docs) {
        const data = d.data();
        const media = await extractMedia(data);
        const isOutgoing = (data.direction || "incoming") === "outgoing";

        messages.push({
          id: d.id,
          from: isOutgoing ? accountPhone : data.from || "",
          text: { body: extractMessageBody(data) },
          timestamp: data.timestamp as Timestamp,
          type: data.type || "text",
          direction: data.direction || "incoming",
          status: data.status,
          fcmToken: data.fcmToken || "",
          // Media fields
          image: media?.type === "image" ? media : undefined,
          video: media?.type === "video" ? media : undefined,
          document: media?.type === "document" ? media : undefined,
          audio: media?.type === "audio" ? media : undefined,
        });
      }

      callback(messages);
    } catch (error) {
      console.error("Error in message subscription:", error);
    }
  });
};

export const addMessageToChat = async (
  accountId: string,
  chatId: string,
  msg: Omit<Message, "id">
) => {
  try {
    const accountPhone = await getAccountPhoneNumber(accountId);
    const msgRef = collection(
      db,
      `accounts/${accountId}/discussion/${chatId}/messages`
    );

    // 🔁 Construct message with new media structure
    const messageData: any = {
      ...msg,
      from: msg.direction === "outgoing" ? accountPhone : msg.from,
      fcmToken: msg.fcmToken || "",
    };

    // 🔁 Convert media to new structure
    if (msg.image) {
      messageData.image = msg.image;
    } else if (msg.video) {
      messageData.video = msg.video;
    } else if (msg.document) {
      messageData.document = msg.document;
    } else if (msg.audio) {
      messageData.audio = msg.audio;
    }

    const newDocRef = await addDoc(msgRef, messageData);

    const lastMessageContent =
      extractMessageBody(msg) ||
      (msg.image
        ? "Sent an image"
        : msg.video
        ? "Sent a video"
        : msg.document
        ? "Sent a document"
        : msg.audio
        ? "Sent an audio"
        : "Sent a file");

    await updateDoc(getChatDocument(accountId, chatId), {
      lastMessage: {
        body: lastMessageContent,
        timestamp: msg.timestamp || serverTimestamp(),
      },
      ...(msg.direction === "incoming" && { unreadCount: increment(1) }),
    });

    return newDocRef;
  } catch (error) {
    console.error("Error adding message:", error);
    throw error;
  }
};

export const deleteAllMessagesInChat = async (
  accountId: string,
  chatId: string
) => {
  const msgRef = collection(
    db,
    `accounts/${accountId}/discussion/${chatId}/messages`
  );
  const q = query(msgRef);
  const querySnapshot = await getDocs(q);

  const batch = writeBatch(db);
  querySnapshot.forEach((doc) => {
    batch.delete(doc.ref);
  });

  await batch.commit();
};

export const uploadMediaToWhatsApp = async (
  phoneNumberId: string,
  file: File,
  type: string = "image/jpeg"
): Promise<string> => {
  const formData = new FormData();
  formData.append("file", file);
  formData.append("type", type);
  formData.append("messaging_product", "whatsapp");

  const res = await fetch(
    `https://graph.facebook.com/v19.0/${phoneNumberId}/media`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${import.meta.env.VITE_WHATSAPP_TOKEN}`,
      },
      body: formData,
    }
  );

  const data = await res.json();

  if (!res.ok) {
    console.error("Upload failed:", data);
    throw new Error(data.error?.message || "Image upload failed");
  }

  return data.id;
};

export const sendWhatsAppMessage = async (
  phoneNumberId: string,
  to: string,
  message?: string,
  media?: {
    type: "image" | "video" | "document" | "audio";
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
      console.log("🆔 Using Media ID:", media.id);
      payload[media.type] = media.id
        ? { id: media.id, ...(media.caption && { caption: media.caption }) }
        : {
            link: media.url,
            ...(media.caption && { caption: media.caption }),
            ...(media.filename && { filename: media.filename }),
          };
    } else if (message) {
      payload.type = "text";
      payload.text = { body: message };
    } else {
      throw new Error("Either message or media must be provided");
    }

    console.log(
      "Sending WhatsApp Message Payload:",
      JSON.stringify(payload, null, 2)
    );

    const response: Response = await fetch(
      `https://graph.facebook.com/v19.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_WHATSAPP_TOKEN}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(payload),
      }
    );

    console.log("WhatsApp API Response Status:", response.status);

    if (!response.ok) {
      let errorData: any;
      try {
        errorData = await response.json();
      } catch {
        errorData = {};
      }
      throw new Error(
        `WhatsApp API error: ${response.status} - ${
          errorData?.error?.message || "Unknown error"
        }`
      );
    }

    const responseData = await response.json();
    console.log(
      "WhatsApp API Response JSON:",
      JSON.stringify(responseData, null, 2)
    );
    return {
      id: responseData?.messages?.[0]?.id,
      ...responseData,
    };
  } catch (error: unknown) {
    console.error("Failed to send WhatsApp message:", error);
    throw error;
  }
};

export const fetchMediaById = async (mediaId: string): Promise<any> => {
  try {
    const response = await fetch(
      `https://graph.facebook.com/v19.0/${mediaId}`,
      {
        method: "GET",
        headers: {
          Authorization: `Bearer ${import.meta.env.VITE_WHATSAPP_TOKEN}`,
        },
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(
        `Failed to fetch media metadata: ${errorData?.error?.message}`
      );
    }

    const data = await response.json();
    console.log("📥 Media Metadata from WhatsApp:", data);
    return {
      url: data.url,
      mime_type: data.mime_type,
      sha256: data.sha256,
      file_size: data.file_size,
      filename: data.filename || "file",
    };
  } catch (error) {
    console.error("❌ Error fetching media by ID:", error);
    throw error;
  }
};

export const fetchMedia = async (url: string): Promise<Blob> => {
  const accessToken = import.meta.env.VITE_WHATSAPP_TOKEN;
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch media: ${response.statusText}`);
  }

  return await response.blob();
};

export const getClientPhoneFromPath = (path: string): string | null => {
  const match = path.match(/\/accounts\/\d+\/discussion\/([\d+]+)/);
  return match ? match[1] : null;
};
