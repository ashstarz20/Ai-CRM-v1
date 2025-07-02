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
  image?: Media;
  video?: Media;
  document?: Media;
  audio?: Media;
}

const extractMessageBody = (data: unknown): string => {
  if (typeof data === "object" && data !== null) {
    const d = data as any;
    if (d.image?.caption) return d.image.caption;
    if (d.video?.caption) return d.video.caption;
    if (d.document?.caption) return d.document.caption;
    if (d.audio?.caption) return d.audio.caption;
    if (d.text?.body) return d.text.body;
    if (d.body) return d.body;
    if (d.interactive?.body?.text) return d.interactive.body.text;
    if (d.interactive?.header?.text) return d.interactive.header.text;
    if (Array.isArray(d.interactive?.action?.buttons)) {
      return d.interactive.action.buttons
        .map((btn: any) => btn.text)
        .join(", ");
    }
    if (d.image) return "Image";
    if (d.video) return "Video";
    if (d.document) return "Document";
    if (d.audio) return "Audio";
    if (d.contacts) return "Contact";
  }
  return "";
};

const extractMedia = async (data: any): Promise<any> => {
  let mediaId: string | null = null;
  let mediaType: MediaType | null = null;

  if (data.image?.id) {
    mediaId = data.image.id;
    mediaType = "image";
  } else if (data.video?.id) {
    mediaId = data.video.id;
    mediaType = "video";
  } else if (data.document?.id) {
    mediaId = data.document.id;
    mediaType = "document";
  } else if (data.audio?.id) {
    mediaId = data.audio.id;
    mediaType = "audio";
  } else if (data.media?.id && data.type) {
    mediaId = data.media.id;
    mediaType = data.type as MediaType;
  }

  if (data.contacts) {
    return {
      type: "contact",
      name: data.contacts[0]?.name?.formatted_name || "Unknown",
      id: data.contacts[0]?.wa_id || "",
    };
  }

  if (mediaId && mediaType && !data[mediaType]?.url) {
    try {
      const response = await fetch(
        "https://asia-south1-starzapp.cloudfunctions.net/crm-media-url-receiver/cacheWhatsAppMedia",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ mediaId, mediaType }),
        }
      );
      
      if (!response.ok) {
        throw new Error(`Webhook error: ${response.status}`);
      }
      
      const result = await response.json();
      return {
        type: mediaType,
        id: mediaId,
        url: result.downloadUrl,
        mime_type: result.mimeType,
        name: result.fileName,
        size: result.fileSize,
        firebasePath: result.firebasePath,
        isPublicUrl: true,
      };
    } catch (error) {
      console.error("Webhook error:", error);
      return {
        type: mediaType,
        id: mediaId,
        url: "",
        error: "Failed to load media",
      };
    }
  }

  if (mediaType && data[mediaType]?.url) {
    return data[mediaType];
  }

  return null;
};

export const getAccountPhoneNumber = async (
  accountId: string
): Promise<string> => {
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

      const media = await extractMedia(data);
      const isOutgoing = data.direction === "outgoing";

      messages.push({
        id: d.id,
        from: isOutgoing ? accountPhone : data.from || "",
        text: { body: extractMessageBody(data) },
        timestamp: data.timestamp as Timestamp,
        type: data.type || "text",
        direction: isOutgoing
          ? "outgoing"
          : ("incoming" as "outgoing" | "incoming"),
        status: data.status,
        fcmToken: data.fcmToken || "",
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
              lastMessage = null;
            }
          } catch (err) {
            console.error("Error fetching last message for chat", chatId, err);
            lastMessage = null;
          }
        }

        const normalizedPhone = chatId.replace(/[^\d]/g, "");
        return {
          id: chatId,
          contact: {
            name,
            phone: normalizedPhone,
          },
          lastMessage,
          unreadCount: data.unreadCount || 0,
        } as Chat;
      })
    );

    const sortedChats = chats.sort((a, b) => {
      const aUnread = a.unreadCount || 0;
      const bUnread = b.unreadCount || 0;

      if (aUnread > 0 && bUnread === 0) return -1;
      if (bUnread > 0 && aUnread === 0) return 1;

      const aTime = a.lastMessage?.timestamp?.toMillis() || 0;
      const bTime = b.lastMessage?.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });

    callback(sortedChats);
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

export const updateChatDocument = async (
  accountId: string,
  chatId: string,
  message: Message
) => {
  const chatRef = doc(db, `accounts/${accountId}/discussion/${chatId}`);

  const lastMessageContent =
    extractMessageBody(message) ||
    (message.image
      ? "Sent an image"
      : message.video
      ? "Sent a video"
      : message.document
      ? "Sent a document"
      : message.audio
      ? "Sent an audio"
      : "Sent a file");

  const updateData: any = {
    lastMessage: {
      body: lastMessageContent,
      timestamp: message.timestamp || serverTimestamp(),
    },
  };

  if (message.direction === "incoming") {
    updateData.unreadCount = increment(1);
  } else {
    updateData.unreadCount = 0;
  }

  await updateDoc(chatRef, updateData);
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

    const messageData: any = {
      ...msg,
      from: msg.direction === "outgoing" ? accountPhone : msg.from,
      fcmToken: msg.fcmToken || "",
    };

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
    await updateChatDocument(accountId, chatId, {
      ...msg,
      id: newDocRef.id,
    } as Message);

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
    return {
      id: responseData?.messages?.[0]?.id,
      ...responseData,
    };
  } catch (error: unknown) {
    console.error("Failed to send WhatsApp message:", error);
    throw error;
  }
};

export const getClientPhoneFromPath = (path: string): string | null => {
  const match = path.match(/\/accounts\/\d+\/discussion\/([\d+]+)/);
  return match ? match[1] : null;
};