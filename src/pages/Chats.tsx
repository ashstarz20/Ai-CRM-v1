import { useState, useEffect, useRef, useMemo, useCallback, memo } from "react";
import {
  getChatsByAccount,
  getMessagesByChat,
  addMessageToChat,
  getChatDocument,
  deleteAllMessagesInChat,
  Chat,
  Message,
  Timestamp,
  subscribeChats,
  subscribeMessages,
  sendWhatsAppMessage,
  MediaType,
} from "../services/firebase";
import { updateDoc } from "firebase/firestore";
import { format, isToday, isYesterday } from "date-fns";
import {
  FaFilePdf,
  FaFileAlt,
  FaPaperclip,
  FaSmile,
  FaTimes,
  FaUpload,
  FaImage,
  FaVideo,
  FaFileAudio,
  // FaAddressBook,
} from "react-icons/fa";
import EmojiPicker, { EmojiStyle, Theme } from "emoji-picker-react";
import { uploadMediaToWhatsApp } from "../services/firebase";
import { getAuth } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../services/firebase";

const getInitials = (name: string) => {
  if (!name) return "?";
  const names = name.split(" ");
  let initials = names[0].charAt(0).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].charAt(0).toUpperCase();
  }
  return initials;
};

const fmtTime = (t?: Timestamp) => (t ? format(t.toDate(), "hh:mm a") : "");
const fmtDate = (t?: Timestamp) => {
  if (!t) return "";
  const d = t.toDate();
  if (isToday(d)) return "Today";
  if (isYesterday(d)) return "Yesterday";
  return format(d, "MMM d, yyyy");
};

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

const Spinner = ({ className }: { className: string }) => (
  <svg
    className={`animate-spin ${className}`}
    xmlns="http://www.w3.org/2000/svg"
    fill="none"
    viewBox="0 0 24 24"
  >
    <circle
      className="opacity-25"
      cx="12"
      cy="12"
      r="10"
      stroke="currentColor"
      strokeWidth="4"
    ></circle>
    <path
      className="opacity-75"
      fill="currentColor"
      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
    ></path>
  </svg>
);

const SkeletonLoader = ({ count = 5 }: { count?: number }) => (
  <div className="p-3">
    {Array.from({ length: count }).map((_, i) => (
      <div key={i} className="flex items-start mb-4 animate-pulse">
        <div className="w-9 h-9 bg-gray-200 rounded-full"></div>
        <div className="ml-3 flex-1">
          <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
          <div className="h-3 bg-gray-200 rounded w-2/3"></div>
        </div>
      </div>
    ))}
  </div>
);

const MessageItem = memo(({ message }: { message: Message }) => {
  const renderMedia = useCallback(() => {
    if (!message.media) return null;

    switch (message.media.type) {
      case "image":
        return (
          <div className="mb-2">
            <img
              src={message.media.url}
              alt={message.media.name || "Image"}
              className="max-w-full max-h-48 rounded-lg object-contain bg-gray-100"
              loading="lazy"
            />
          </div>
        );

      case "video":
        return (
          <div className="mb-2">
            <video
              src={message.media.url}
              controls
              className="max-w-full max-h-48 rounded-lg bg-black"
              preload="metadata"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );

      // case "pdf":
      case "document":
        return (
          <a
            href={message.media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-100 rounded-lg mb-2 hover:bg-gray-200 transition"
          >
            {message.media.type === "document" ? (
              <FaFilePdf className="text-red-500 text-xl mr-2" />
            ) : (
              <FaFileAlt className="text-blue-500 text-xl mr-2" />
            )}
            <div>
              <div className="text-sm font-medium truncate max-w-xs">
                {message.media.name ||
                  (message.media.type === "document"
                    ? "Document.pdf"
                    : "File.doc")}
              </div>
              {message.media.size && (
                <div className="text-xs text-gray-500">
                  {formatFileSize(message.media.size)}
                </div>
              )}
            </div>
          </a>
        );

      case "audio":
        return (
          <div className="mb-2">
            <audio
              src={message.media.url}
              controls
              className="w-full"
              preload="none"
            />
          </div>
        );

      default:
        return (
          <a
            href={message.media.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block px-3 py-2 bg-gray-100 rounded-lg mb-2 hover:bg-gray-200 transition"
          >
            Download file
          </a>
        );
    }
  }, [message.media]);

  return (
    <div
      className={`flex mb-2.5 ${
        message.direction === "outgoing" ? "justify-end" : "justify-start"
      }`}
    >
      <div
        className={`max-w-[75%] rounded-lg px-3 py-2 ${
          message.direction === "outgoing"
            ? "bg-blue-500 text-white rounded-br-none"
            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
        }`}
      >
        {message.media && renderMedia()}
        {message.text.body && (
          <div className="text-sm">{message.text.body}</div>
        )}
        <div className="flex justify-end items-center mt-1">
          {message.direction === "outgoing" && (
            <>
              {message.status === "sending" && (
                <Spinner className="h-3 w-3 text-white mr-1" />
              )}
              {message.status === "failed" && (
                <svg
                  className="h-3 w-3 text-red-400 mr-1"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              )}
              {message.status === "sent" && (
                <svg
                  className="h-3 w-3 text-white mr-1"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 13l4 4L19 7"
                  />
                </svg>
              )}
            </>
          )}
          <span className="text-[0.65rem] opacity-70">
            {fmtTime(message.timestamp)}
          </span>
        </div>
      </div>
    </div>
  );
});

const ChatListItem = memo(
  ({
    chat,
    isSelected,
    onSelect,
  }: {
    chat: Chat;
    isSelected: boolean;
    onSelect: () => void;
  }) => {
    return (
      <div
        onClick={onSelect}
        className={`p-3 flex items-start cursor-pointer transition ${
          isSelected
            ? "bg-blue-50 border-l-2 border-blue-500"
            : "hover:bg-gray-50"
        }`}
      >
        <div className="w-9 h-9 flex-shrink-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
          {getInitials(chat.contact.name)}
        </div>
        <div className="ml-3 min-w-0 flex-1">
          <div className="flex justify-between items-start">
            <div className="flex items-center min-w-0 flex-1">
              <div
                className={`${
                  chat.unreadCount ? "font-bold" : "font-semibold"
                } text-gray-800 truncate text-sm`}
              >
                {chat.contact.name}
              </div>
              {(chat.unreadCount ?? 0) > 0 && (
                <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                  {chat.unreadCount ?? 0}
                </span>
              )}
            </div>
            {chat.lastMessage && (
              <div className="text-xs text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
                {fmtTime(chat.lastMessage.timestamp)}
              </div>
            )}
          </div>
          {chat.lastMessage && (
            <div
              className={`text-xs truncate mt-1 ${
                chat.unreadCount
                  ? "font-semibold text-gray-800"
                  : "text-gray-500"
              }`}
            >
              {chat.lastMessage?.body}
            </div>
          )}
        </div>
      </div>
    );
  }
);

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [sending, setSending] = useState(false);
  const [loadingChats, setLoadingChats] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [showContactPanel, setShowContactPanel] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [clearingChat, setClearingChat] = useState(false);
  const [showAttachmentMenu, setShowAttachmentMenu] = useState(false);
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [attachmentDialog, setAttachmentDialog] = useState<MediaType | null>(
    null
  );
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileName, setFileName] = useState("");
  const [uploading, setUploading] = useState(false);
  const [accountId, setAccountId] = useState<string | undefined>(undefined);
  const [showAccountModal, setShowAccountModal] = useState(false);
  const [inputAccountId, setInputAccountId] = useState("");

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const attachmentMenuRef = useRef<HTMLDivElement>(null);
  const emojiPickerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const unsubscribeChatsRef = useRef<() => void>(() => {});
  const unsubscribeMessagesRef = useRef<() => void>(() => {});
  // Add state for error and loading
  const [connectError, setConnectError] = useState("");
  const [connecting, setConnecting] = useState(false);
  const [accountIdLoading, setAccountIdLoading] = useState(true);

  // Auto-load last connected accountId
  useEffect(() => {
    const fetchConnectedWABA = async () => {
      try {
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user || !user.phoneNumber) {
          setAccountId(undefined);
          setShowAccountModal(true);
          setAccountIdLoading(false);
          return;
        }
        const phoneNumber = user.phoneNumber.replace(/[^\d]/g, "");
        const userDoc = await getDoc(doc(db, `crm_users/${phoneNumber}`));
        const data = userDoc.data();
        if (data?.connectedWABA) {
          setAccountId(data.connectedWABA);
          setShowAccountModal(false);
        } else {
          setAccountId(undefined);
          setShowAccountModal(true);
        }
      } catch (err) {
        console.error("Error fetching connected WABA:", err);
        setAccountId(undefined);
        setShowAccountModal(true);
      } finally {
        setAccountIdLoading(false);
      }
    };
    fetchConnectedWABA();
  }, []);

  const ContactInfoPanel = () => (
    <div
      className={`h-full w-80 bg-white border-l border-gray-200 shadow-lg z-30 absolute top-0 right-0 transform transition-transform duration-300 ease-in-out ${
        showContactPanel ? "translate-x-0" : "translate-x-full"
      }`}
    >
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Contact Info</h2>
        <button
          className="p-2 rounded-full hover:bg-gray-100 transition"
          onClick={() => setShowContactPanel(false)}
        >
          <svg
            className="h-5 w-5 text-gray-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
      </div>
      <div className="p-6 text-center">
        <div className="flex items-center justify-center rounded-full w-24 h-24 mx-auto bg-blue-100 text-blue-700 font-bold text-3xl">
          {getInitials(selected?.contact.name || "")}
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-800">
          {selected?.contact.name}
        </h3>
        <p className="mt-2 text-gray-600">{selected?.contact.phone}</p>
      </div>
    </div>
  );

  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      const aTime = a.lastMessage?.timestamp?.toMillis() || 0;
      const bTime = b.lastMessage?.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });
  }, [chats]);

  const filteredChats = useMemo(() => {
    if (!searchQuery) return sortedChats;
    const query = searchQuery.toLowerCase();
    return sortedChats.filter(
      (chat) =>
        chat.contact.name.toLowerCase().includes(query) ||
        chat.contact.phone.includes(query)
    );
  }, [sortedChats, searchQuery]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
      if (
        attachmentMenuRef.current &&
        !attachmentMenuRef.current.contains(event.target as Node)
      ) {
        setShowAttachmentMenu(false);
      }
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target as Node)
      ) {
        setShowEmojiPicker(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!accountId) return; // Don't fetch if not set
    let isMounted = true;
    const fetchAndSubscribeChats = async () => {
      try {
        if (unsubscribeChatsRef.current) unsubscribeChatsRef.current();
        setLoadingChats(true);
        const initialChats = await getChatsByAccount(accountId);
        if (!isMounted) return;

        setChats(initialChats);
        unsubscribeChatsRef.current = subscribeChats(
          accountId,
          (updatedChats) => {
            if (!isMounted) return;

            setChats(updatedChats);
            setSelected((prev) => {
              if (!prev) return null;
              const updatedChat = updatedChats.find((c) => c.id === prev.id);
              return updatedChat || prev;
            });
          }
        );
      } catch (err) {
        console.error("Error fetching chats:", err);
      } finally {
        if (isMounted) setLoadingChats(false);
      }
    };
    fetchAndSubscribeChats();
    return () => {
      isMounted = false;
      if (unsubscribeChatsRef.current) unsubscribeChatsRef.current();
    };
  }, [accountId]);

  const loadMessages = useCallback(
    async (chat: Chat) => {
      if (!chat || !accountId) return;

      try {
        setLoadingMessages(true);
        setMessages([]);

        const msgs = await getMessagesByChat(accountId, chat.id, 1, 20);

        setMessages(msgs);
        await updateDoc(getChatDocument(accountId, chat.id), {
          unreadCount: 0,
        });
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        setLoadingMessages(false);
      }
    },
    [accountId]
  );

  useEffect(() => {
    if (!selected) return;
    let isMounted = true;

    const fetchAndSubscribeMessages = async () => {
      if (!accountId) return;
      try {
        if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();

        await loadMessages(selected);

        unsubscribeMessagesRef.current = subscribeMessages(
          accountId,
          selected.id,
          (newMsgs) => {
            if (!isMounted) return;

            setMessages(newMsgs);
          }
        );
      } catch (err) {
        console.error("Error initializing messages:", err);
      }
    };

    fetchAndSubscribeMessages();

    return () => {
      isMounted = false;
      if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
    };
  }, [selected, loadMessages, accountId]);

  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages, scrollToBottom]);

  useEffect(() => {
  setSelected(null);
  setMessages([]);
  setChats([]); // Add this line to clear chats immediately
}, [accountId]);

  const send = async () => {
    if (!selected || !draft.trim() || sending) return;

    let newDocRef: import("firebase/firestore").DocumentReference | null = null;
    setSending(true);

    if (!accountId) return;

    try {
      const msg: Omit<Message, "id"> = {
        from: "917710945924", // Using number ID
        text: { body: draft.trim() },
        timestamp: Timestamp.fromDate(new Date()),
        type: "text",
        direction: "outgoing",
        status: "sending",
      };

      newDocRef = await addMessageToChat(accountId, selected.id, msg);

      const response = await sendWhatsAppMessage(
        "570983109425469",
        selected.contact.phone,
        draft.trim()
      );

      // Update with WhatsApp message ID
      await updateDoc(newDocRef, {
        status: "sent",
        id: response.id,
      });

      setDraft("");
      setShowEmojiPicker(false);
    } catch (err) {
      console.error("Sending message failed:", err);
      if (newDocRef) {
        await updateDoc(newDocRef, { status: "failed" });
      }
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!selected || clearingChat) return;
    setClearingChat(true);

    if (!accountId) return;
    try {
      await deleteAllMessagesInChat(accountId, selected.id);
      await updateDoc(getChatDocument(accountId, selected.id), {
        lastMessage: null,
        unreadCount: 0,
      });
      setMessages([]);
    } catch (err) {
      console.error("Error clearing chat:", err);
    } finally {
      setClearingChat(false);
      setShowMenu(false);
    }
  };

  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach((msg) => {
      const date = fmtDate(msg.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  }, [messages]);

  const onEmojiClick = (
    emojiData: import("emoji-picker-react").EmojiClickData
  ) => {
    setDraft(draft + emojiData.emoji);
  };

  const toggleAttachmentMenu = () => {
    setShowAttachmentMenu(!showAttachmentMenu);
    setShowEmojiPicker(false);
  };

  const toggleEmojiPicker = () => {
    setShowEmojiPicker(!showEmojiPicker);
    setShowAttachmentMenu(false);
  };

  const openAttachmentDialog = (type: MediaType) => {
    setAttachmentDialog(type);
    setShowAttachmentMenu(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setFileName(file.name);
    }
  };

  const triggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  // const uploadAndSend = async () => {
  //   if (!selected || !selectedFile || !attachmentDialog) return;

  //   setUploading(true);
  //   let newDocRef: any = null;

  //   try {
  //     // Upload file to Firebase Storage
  //     const downloadURL = await uploadFile(
  //       selectedFile,
  //       `media/${selected.id}/${Date.now()}_${selectedFile.name}`
  //     );

  //     // Create message payload
  //     const msg: Omit<Message, "id"> = {
  //       from: "917710945924", // Using number ID
  //       text: { body: "" },
  //       timestamp: Timestamp.fromDate(new Date()),
  //       type: attachmentDialog,
  //       direction: "outgoing",
  //       status: "sending",
  //       media: {
  //         type: attachmentDialog,
  //         url: downloadURL,
  //         name: selectedFile.name,
  //         size: selectedFile.size,
  //       },
  //     };

  //     // Add message to Firestore
  //     newDocRef = await addMessageToChat(accountId, selected.id, msg);

  //     // Map media types to WhatsApp supported types
  //     const whatsappMediaTypeMap: Record<
  //       MediaType,
  //       "image" | "video" | "document" | "audio"
  //     > = {
  //       image: "image",
  //       video: "video",
  //       pdf: "document",
  //       audio: "audio", // Fallback to document for contacts
  //     };

  //     const whatsappType = whatsappMediaTypeMap[attachmentDialog];

  //     // Send media via WhatsApp API
  //     const response = await sendWhatsAppMessage(
  //       "570983109425469",
  //       selected.contact.phone,
  //       undefined,
  //       {
  //         type: whatsappType,
  //         url: downloadURL,
  //         filename: selectedFile.name,
  //       }
  //     );

  //     // Update Firestore message with WhatsApp response
  //     await updateDoc(newDocRef, {
  //       status: "sent",
  //       id: response.id,
  //     });

  //     setAttachmentDialog(null);
  //     setSelectedFile(null);
  //     setFileName("");
  //   } catch (err) {
  //     console.error("Error sending media:", err);
  //     if (newDocRef) {
  //       await updateDoc(newDocRef, { status: "failed" });
  //     }
  //   } finally {
  //     setUploading(false);
  //   }
  // };

  const uploadAndSend = async () => {
    if (!selected || !selectedFile || !attachmentDialog) return;

    setUploading(true);
    let newDocRef: import("firebase/firestore").DocumentReference | null = null;

    if (!accountId) return;

    try {
      // Map local media types to WhatsApp supported types
      const whatsappMediaTypeMap: Record<
        MediaType,
        "image" | "video" | "document" | "audio"
      > = {
        image: "image",
        video: "video",
        document: "document",
        audio: "audio",
      };

      const whatsappType = whatsappMediaTypeMap[attachmentDialog];

      // 🔁 Step 1: Upload media to WhatsApp
      const mediaId = await uploadMediaToWhatsApp(
        "570983109425469", // your phoneNumberId
        selectedFile,
        selectedFile.type // pass correct MIME type
      );

      // 🔁 Step 2: Create message in Firestore immediately with `sending` status
      const msg: Omit<Message, "id"> = {
        from: "917710945924",
        text: { body: "" },
        timestamp: Timestamp.fromDate(new Date()),
        type: attachmentDialog,
        direction: "outgoing",
        status: "sending",
        media: {
          type: attachmentDialog,
          id: mediaId,
          name: selectedFile.name,
          size: selectedFile.size,
        },
      };

      newDocRef = await addMessageToChat(accountId, selected.id, msg);

      // 🔁 Step 3: Send media message via WhatsApp
      const response = await sendWhatsAppMessage(
        "570983109425469",
        selected.contact.phone,
        undefined,
        {
          type: whatsappType,
          id: mediaId,
          caption: selectedFile.name,
          filename: selectedFile.name,
        }
      );

      // 🔁 Step 4: Update Firestore message with status
      await updateDoc(newDocRef, {
        status: "sent",
        id: response.id,
      });

      setAttachmentDialog(null);
      setSelectedFile(null);
      setFileName("");
    } catch (err) {
      console.error("Error sending media:", err);
      if (newDocRef) {
        await updateDoc(newDocRef, { status: "failed" });
      }
    } finally {
      setUploading(false);
    }
  };

  const getDialogTitle = () => {
    switch (attachmentDialog) {
      case "image":
        return "Upload Image";
      case "video":
        return "Upload Video";
      case "audio":
        return "Upload Audio";
      case "document":
        return "Upload PDF";
      default:
        return "Upload File";
    }
  };

  const getAcceptAttribute = () => {
    switch (attachmentDialog) {
      case "image":
        return "image/*";
      case "video":
        return "video/*";
      case "audio":
        return "audio/*";
      case "document":
        return "application/pdf";
      default:
        return "*";
    }
  };

  const getDialogIcon = () => {
    switch (attachmentDialog) {
      case "image":
        return <FaImage className="text-blue-500 text-xl mr-2" />;
      case "video":
        return <FaVideo className="text-blue-500 text-xl mr-2" />;
      case "audio":
        return <FaFileAudio className="text-blue-500 text-xl mr-2" />;
      case "document":
        return <FaFileAlt className="text-blue-500 text-xl mr-2" />;
      default:
        return <FaUpload className="text-blue-500 text-xl mr-2" />;
    }
  };

  if (showAccountModal) {
    const handleConnect = async () => {
      setConnectError("");
      setConnecting(true);
      try {
        const enteredId = inputAccountId.trim();
        if (!enteredId) {
          setConnectError("Please enter an Account ID.");
          setConnecting(false);
          return;
        }
        // Check if account exists
        const accDoc = await getDoc(doc(db, `accounts/${enteredId}`));
        if (!accDoc.exists()) {
          setConnectError("Account ID not found.");
          setConnecting(false);
          return;
        }
        // Get current user phone number
        const auth = getAuth();
        const user = auth.currentUser;
        if (!user || !user.phoneNumber) {
          setConnectError("User not authenticated.");
          setConnecting(false);
          return;
        }
        const phoneNumber = user.phoneNumber.replace(/[^\d]/g, "");
        // Update user's connectedWABA
        await setDoc(
          doc(db, `crm_users/${phoneNumber}`),
          { connectedWABA: enteredId },
          { merge: true }
        );
        setAccountId(enteredId);
        setShowAccountModal(false);
      } catch (err) {
        setConnectError("Something went wrong. Try again.");
        console.error(err);
      } finally {
        setConnecting(false);
      }
    };

    return (
      <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl p-8 w-full max-w-xs flex flex-col items-center">
          <h2 className="text-lg font-semibold mb-4 text-gray-800">
            Enter Account ID
          </h2>
          <input
            type="text"
            className="w-full px-4 py-2 border rounded mb-4 focus:outline-none"
            placeholder="Account ID"
            value={inputAccountId}
            onChange={(e) => setInputAccountId(e.target.value)}
            autoFocus
          />
          {connectError && (
            <div className="text-red-500 text-xs mb-2">{connectError}</div>
          )}
          <button
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 transition"
            disabled={!inputAccountId.trim() || connecting}
            onClick={handleConnect}
          >
            {connecting ? "Connecting..." : "Connect"}
          </button>
        </div>
      </div>
    );
  }

  if (accountIdLoading) {
    return (
      <div className="flex items-center justify-center h-full w-full">
        <Spinner className="h-8 w-8 text-blue-500" />
      </div>
    );
  }

  return (
    <div className="flex h-[calc(90vh-4rem)] overflow-hidden relative bg-gray-50">
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        accept={attachmentDialog ? getAcceptAttribute() : "*"}
        className="hidden"
      />

      {attachmentDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center border-b p-4">
              <div className="flex items-center">
                {getDialogIcon()}
                <h3 className="text-lg font-semibold">{getDialogTitle()}</h3>
              </div>
              <button
                onClick={() => {
                  setAttachmentDialog(null);
                  setSelectedFile(null);
                  setFileName("");
                }}
                className="p-1 rounded-full hover:bg-gray-100"
              >
                <FaTimes className="h-5 w-5 text-gray-500" />
              </button>
            </div>

            <div className="p-6">
              {!selectedFile ? (
                <div
                  className="flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8 cursor-pointer hover:bg-gray-50 transition"
                  onClick={triggerFileInput}
                >
                  <FaUpload className="text-gray-400 text-4xl mb-4" />
                  <p className="text-gray-500 mb-2">Click to select a file</p>
                  <p className="text-gray-400 text-sm">
                    Supported: {getAcceptAttribute()}
                  </p>
                </div>
              ) : (
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium truncate">{fileName}</p>
                      <p className="text-gray-500 text-sm">
                        {formatFileSize(selectedFile.size)}
                      </p>
                    </div>
                    <button
                      onClick={triggerFileInput}
                      className="text-blue-500 hover:text-blue-700 text-sm font-medium"
                    >
                      Change
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end p-4 border-t">
              <button
                onClick={() => {
                  setAttachmentDialog(null);
                  setSelectedFile(null);
                  setFileName("");
                }}
                className="px-4 py-2 text-gray-600 hover:text-gray-800 font-medium"
              >
                Cancel
              </button>
              <button
                onClick={uploadAndSend}
                disabled={!selectedFile || uploading}
                className={`ml-2 px-4 py-2 rounded-md flex items-center ${
                  selectedFile && !uploading
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-500 cursor-not-allowed"
                }`}
              >
                {uploading ? (
                  <>
                    <Spinner className="h-4 w-4 text-white mr-2" />
                    Uploading...
                  </>
                ) : (
                  "Send"
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="w-80 flex flex-col border-r border-gray-200 bg-white">
        <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
          <input
            type="text"
            className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <button
            className="ml-2 text-xs text-blue-600 underline"
            onClick={() => {
              setAccountId("");
              setShowAccountModal(true);
              setInputAccountId("");
            }}
            title="Change Connected Account"
          >
            Change
          </button>
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <SkeletonLoader count={8} />
          ) : filteredChats.length > 0 ? (
            filteredChats.map((c) => (
              <ChatListItem
                key={c.id}
                chat={c}
                isSelected={selected?.id === c.id}
                onSelect={() => setSelected(c)}
              />
            ))
          ) : (
            <div className="text-xs text-gray-500 p-3 text-center">
              {searchQuery
                ? "No chats match your search"
                : "No chats available"}
            </div>
          )}
        </div>
      </div>

      <div
        className={`flex-1 flex flex-col relative transition-all duration-300 ${
          showContactPanel ? "mr-80" : ""
        }`}
      >
        {selected ? (
          <>
            <div className="p-2.5 border-b bg-white flex items-center sticky top-0 z-20">
              <div className="w-9 h-9 bg-blue-100 text-blue-700 rounded-full flex justify-center items-center font-bold">
                {getInitials(selected.contact.name)}
              </div>
              <div
                className="ml-2.5 flex-1 min-w-0 cursor-pointer"
                onClick={() => setShowContactPanel(true)}
              >
                <div className="font-bold text-gray-800 hover:text-blue-600 truncate text-sm">
                  {selected.contact.name}
                </div>
                <div className="text-xs text-gray-500 flex items-center mt-0.5">
                  <span className="w-2 h-2 bg-green-500 rounded-full mr-1.5"></span>
                  Online
                </div>
              </div>

              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowMenu(!showMenu)}
                  className="p-1 rounded-full hover:bg-gray-100 transition"
                >
                  <svg
                    className="h-5 w-5 text-gray-500"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 12h.01M12 12h.01M19 12h.01M6 12a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0zm7 0a1 1 0 11-2 0 1 1 0 012 0z"
                    />
                  </svg>
                </button>

                {showMenu && (
                  <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg py-1 z-30">
                    <button
                      onClick={clearChat}
                      disabled={clearingChat}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                    >
                      {clearingChat ? (
                        <>
                          <Spinner className="h-4 w-4 text-blue-500 mr-2" />
                          Clearing...
                        </>
                      ) : (
                        "Clear chat"
                      )}
                    </button>
                  </div>
                )}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner className="h-8 w-8 text-blue-500" />
                </div>
              ) : (
                <>
                  {Object.keys(groupedMessages).length > 0 ? (
                    Object.entries(groupedMessages).map(([date, msgs]) => (
                      <div key={date}>
                        <div className="flex justify-center my-4">
                          <div className="px-2.5 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                            {date}
                          </div>
                        </div>
                        {msgs.map((m) => (
                          <MessageItem key={m.id} message={m} />
                        ))}
                      </div>
                    ))
                  ) : (
                    <div className="flex justify-center items-center h-full text-gray-500 text-sm">
                      No messages yet. Start the conversation!
                    </div>
                  )}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="p-2.5 border-t bg-white sticky bottom-0 z-20">
              {showEmojiPicker && (
                <div
                  ref={emojiPickerRef}
                  className="absolute bottom-16 right-16 z-30"
                >
                  <EmojiPicker
                    onEmojiClick={onEmojiClick}
                    autoFocusSearch={false}
                    theme={Theme.LIGHT}
                    emojiStyle={EmojiStyle.NATIVE}
                  />
                </div>
              )}

              <div className="flex items-center">
                <div className="relative" ref={attachmentMenuRef}>
                  <button
                    onClick={toggleAttachmentMenu}
                    className="p-2 rounded-full hover:bg-gray-100 transition mr-1"
                  >
                    <FaPaperclip className="h-4 w-4 text-gray-500 rotate-90" />
                  </button>

                  {showAttachmentMenu && (
                    <div className="absolute bottom-10 left-0 w-48 bg-white rounded-md shadow-lg py-1 z-30 border border-gray-200">
                      <button
                        onClick={() => openAttachmentDialog("document")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                      >
                        <FaFileAlt className="h-4 w-4 text-gray-500 mr-2" />
                        Document
                      </button>
                      <button
                        onClick={() => openAttachmentDialog("image")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 text-gray-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                          />
                        </svg>
                        Image
                      </button>
                      <button
                        onClick={() => openAttachmentDialog("video")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 text-gray-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
                          />
                        </svg>
                        Video
                      </button>
                      <button
                        onClick={() => openAttachmentDialog("audio")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 text-gray-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
                          />
                        </svg>
                        Audio
                      </button>
                      {/* <button
                        onClick={() => openAttachmentDialog("contact")}
                        className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-gray-900 flex items-center"
                      >
                        <svg
                          className="h-4 w-4 text-gray-500 mr-2"
                          fill="none"
                          viewBox="0 0 24 24"
                          stroke="currentColor"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
                          />
                        </svg>
                        Contact
                      </button> */}
                    </div>
                  )}
                </div>

                <button
                  onClick={toggleEmojiPicker}
                  className="p-2 rounded-full hover:bg-gray-100 transition mr-1"
                >
                  <FaSmile className="h-4 w-4 text-gray-500" />
                </button>

                <input
                  className="flex-1 border border-gray-300 rounded-full px-3.5 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !sending && send()}
                  placeholder="Type your message..."
                  disabled={sending}
                />
                <button
                  onClick={send}
                  disabled={!draft.trim() || sending}
                  className={`ml-2 p-2 rounded-full transition-all ${
                    draft.trim() && !sending
                      ? "bg-blue-500 hover:bg-blue-600"
                      : "bg-gray-200 cursor-not-allowed"
                  }`}
                >
                  {sending ? (
                    <Spinner className="h-4 w-4 text-white" />
                  ) : (
                    <svg
                      className="h-4 w-4 text-white"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  )}
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center text-gray-500 p-4 text-sm">
            {loadingChats ? (
              <div className="flex items-center">
                <Spinner className="h-4 w-4 text-blue-500 mr-2" />
                Loading chats...
              </div>
            ) : (
              <div className="text-center">
                <svg
                  className="h-16 w-16 mx-auto text-gray-300"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={1.5}
                    d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                  />
                </svg>
                <div className="mt-4 font-medium text-gray-600">
                  No conversation selected
                </div>
                <p className="mt-1 text-gray-500 max-w-xs">
                  Select a chat from the list to start messaging
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {selected && <ContactInfoPanel />}
    </div>
  );
}
