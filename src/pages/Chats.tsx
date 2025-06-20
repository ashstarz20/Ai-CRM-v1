// ✅ src/pages/Chats.tsx
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
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
  subscribeMessages
} from "../services/firebase";
import { updateDoc } from "firebase/firestore";
import { format, isToday, isYesterday } from "date-fns";
import { FaFilePdf, FaFileAlt } from "react-icons/fa";

const getInitials = (name: string) => {
  if (!name) return "?";
  const names = name.split(" ");
  let initials = names[0].charAt(0).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].charAt(0).toUpperCase();
  }
  return initials;
};

const Spinner = ({ className }: { className: string }) => (
  <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
  </svg>
);

const formatFileSize = (bytes: number | undefined): string => {
  if (!bytes) return "";
  if (bytes < 1024) return `${bytes} bytes`;
  if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / 1048576).toFixed(1)} MB`;
};

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
  const accountId = "593329000520625";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const unsubscribeChatsRef = useRef<() => void>(() => {});
  const unsubscribeMessagesRef = useRef<() => void>(() => {});

  const ContactInfoPanel = () => (
    <div className={`h-full w-80 bg-white border-l border-gray-200 shadow-lg z-30 absolute top-0 right-0 transform transition-transform duration-300 ease-in-out ${showContactPanel ? "translate-x-0" : "translate-x-full"}`}>
      <div className="p-4 border-b border-gray-200 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-800">Contact Info</h2>
        <button className="p-2 rounded-full hover:bg-gray-100 transition" onClick={() => setShowContactPanel(false)}>
          <svg className="h-5 w-5 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="p-6 text-center">
        <div className="flex items-center justify-center rounded-full w-24 h-24 mx-auto bg-blue-100 text-blue-700 font-bold text-3xl">
          {getInitials(selected?.contact.name || "")}
        </div>
        <h3 className="mt-4 text-xl font-bold text-gray-800">{selected?.contact.name}</h3>
        <p className="mt-2 text-gray-600">{selected?.contact.phone}</p>
      </div>
    </div>
  );

  // Sort chats with unread messages first, then by last message timestamp
  const sortedChats = useMemo(() => {
    return [...chats].sort((a, b) => {
      // Prioritize chats with unread messages
      if (a.unreadCount && !b.unreadCount) return -1;
      if (!a.unreadCount && b.unreadCount) return 1;
      
      // Then sort by last message timestamp (newest first)
      const aTime = a.lastMessage?.timestamp?.toMillis() || 0;
      const bTime = b.lastMessage?.timestamp?.toMillis() || 0;
      return bTime - aTime;
    });
  }, [chats]);

  const filteredChats = useMemo(() => {
    if (!searchQuery) return sortedChats;
    const query = searchQuery.toLowerCase();
    return sortedChats.filter(chat => 
      chat.contact.name.toLowerCase().includes(query) || 
      chat.contact.phone.includes(query)
    );
  }, [sortedChats, searchQuery]);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    let isMounted = true;
    const fetchAndSubscribeChats = async () => {
      try {
        if (unsubscribeChatsRef.current) unsubscribeChatsRef.current();
        const initialChats = await getChatsByAccount(accountId);
        if (!isMounted) return;
        setChats(initialChats);
        if (initialChats.length > 0) setSelected(initialChats[0]);
        unsubscribeChatsRef.current = subscribeChats(accountId, updatedChats => {
          if (!isMounted) return;
          setChats(updatedChats);
          setSelected(prev => (prev ? updatedChats.find(c => c.id === prev.id) || prev : prev));
        });
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
  }, []);

  useEffect(() => {
    if (!selected) return;
    let isMounted = true;
    setLoadingMessages(true);
    const fetchAndSubscribeMessages = async () => {
      try {
        if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
        // Reset unread count when chat is selected
        await updateDoc(getChatDocument(accountId, selected.id), { unreadCount: 0 });
        const msgs = await getMessagesByChat(accountId, selected.id);
        if (!isMounted) return;
        setMessages(msgs);
        unsubscribeMessagesRef.current = subscribeMessages(accountId, selected.id, newMsgs => {
          if (!isMounted) return;
          setMessages(newMsgs);
        });
      } catch (err) {
        console.error("Error fetching messages:", err);
      } finally {
        if (isMounted) setLoadingMessages(false);
      }
    };
    fetchAndSubscribeMessages();
    return () => {
      isMounted = false;
      if (unsubscribeMessagesRef.current) unsubscribeMessagesRef.current();
    };
  }, [selected]);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const send = async () => {
    if (!selected || !draft.trim() || sending) return;
    setSending(true);
    const msg: Omit<Message, "id"> = {
      body: draft.trim(),
      timestamp: Timestamp.fromDate(new Date()),
      direction: "outgoing",
      status: "sent",
    };
    setDraft("");
    try {
      await addMessageToChat(accountId, selected.id, msg);
      await updateDoc(getChatDocument(accountId, selected.id), {
        lastMessage: {
          body: msg.body,
          timestamp: msg.timestamp,
        },
        unreadCount: 0,
      });
    } catch (err) {
      console.error("Sending message failed:", err);
    } finally {
      setSending(false);
    }
  };

  const clearChat = async () => {
    if (!selected || clearingChat) return;
    setClearingChat(true);
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

  const fmtTime = (t?: Timestamp) => t ? format(t.toDate(), "hh:mm a") : "";
  const fmtDate = (t?: Timestamp) => {
    if (!t) return "";
    const d = t.toDate();
    if (isToday(d)) return "Today";
    if (isYesterday(d)) return "Yesterday";
    return format(d, "MMM d, yyyy");
  };

  const groupedMessages = useMemo(() => {
    const groups: { [key: string]: Message[] } = {};
    messages.forEach(msg => {
      const date = fmtDate(msg.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    return groups;
  }, [messages]);

  // Render media content based on type
  const renderMedia = (m: Message) => {
    if (!m.media) return null;
    
    switch (m.media.type) {
      case 'image':
        return (
          <div className="mb-2">
            <img 
              src={m.media.url} 
              alt={m.media.name || "Image"} 
              className="max-w-full max-h-48 rounded-lg object-contain bg-gray-100"
            />
          </div>
        );
        
      case 'video':
        return (
          <div className="mb-2">
            <video 
              src={m.media.url} 
              controls 
              className="max-w-full max-h-48 rounded-lg bg-black"
            >
              Your browser does not support the video tag.
            </video>
          </div>
        );
        
      case 'pdf':
      case 'document':
        return (
          <a 
            href={m.media.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center p-3 bg-gray-100 rounded-lg mb-2 hover:bg-gray-200 transition"
          >
            {m.media.type === 'pdf' ? (
              <FaFilePdf className="text-red-500 text-xl mr-2" />
            ) : (
              <FaFileAlt className="text-blue-500 text-xl mr-2" />
            )}
            <div>
              <div className="text-sm font-medium truncate max-w-xs">
                {m.media.name || (m.media.type === 'pdf' ? "Document.pdf" : "File.doc")}
              </div>
              {m.media.size && (
                <div className="text-xs text-gray-500">
                  {formatFileSize(m.media.size)}
                </div>
              )}
            </div>
          </a>
        );
        
      case 'audio':
        return (
          <div className="mb-2">
            <audio 
              src={m.media.url} 
              controls 
              className="w-full"
            />
          </div>
        );
        
      default:
        return (
          <a 
            href={m.media.url} 
            target="_blank" 
            rel="noopener noreferrer"
            className="inline-block px-3 py-2 bg-gray-100 rounded-lg mb-2 hover:bg-gray-200 transition"
          >
            Download file
          </a>
        );
    }
  };

  return (
    <div className="flex h-[calc(90vh-4rem)] overflow-hidden relative bg-gray-50">
      {/* Left sidebar - Chat list */}
      <div className="w-80 flex flex-col border-r border-gray-200 bg-white">
        <div className="sticky top-0 z-20 bg-white border-b px-4 py-3">
          <input
            type="text"
            className="w-full px-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
            placeholder="Search chats..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="flex-1 overflow-y-auto">
          {loadingChats ? (
            <div className="flex justify-center items-center h-full">
              <Spinner className="h-7 w-7 text-blue-500" />
            </div>
          ) : filteredChats.length > 0 ? (
            filteredChats.map(c => (
              <div
                key={c.id}
                onClick={() => setSelected(c)}
                className={`p-3 flex items-start cursor-pointer transition ${
                  selected?.id === c.id 
                    ? "bg-blue-50 border-l-2 border-blue-500" 
                    : "hover:bg-gray-50"
                }`}
              >
                <div className="w-9 h-9 flex-shrink-0 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center font-bold">
                  {getInitials(c.contact.name)}
                </div>
                <div className="ml-3 min-w-0 flex-1">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center min-w-0 flex-1">
                      <div className={`${c.unreadCount ? 'font-bold' : 'font-semibold'} text-gray-800 truncate text-sm`}>
                        {c.contact.name}
                      </div>
                      {c.unreadCount && c.unreadCount > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center ml-2 flex-shrink-0">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                    {c.lastMessage && (
                      <div className="text-xs text-gray-400 whitespace-nowrap ml-2 flex-shrink-0">
                        {fmtTime(c.lastMessage.timestamp)}
                      </div>
                    )}
                  </div>
                  {c.lastMessage && (
                    <div className={`text-xs truncate mt-1 ${c.unreadCount ? 'font-semibold text-gray-800' : 'text-gray-500'}`}>
                      {c.lastMessage.body}
                    </div>
                  )}
                </div>
              </div>
            ))
          ) : (
            <div className="text-xs text-gray-500 p-3 text-center">
              {searchQuery ? "No chats match your search" : "No chats available"}
            </div>
          )}
        </div>
      </div>

      {/* Main chat area */}
      <div className={`flex-1 flex flex-col relative transition-all duration-300 ${showContactPanel ? "mr-80" : ""}`}>
        {selected ? (
          <>
            {/* Contact header - fixed top */}
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
              
              {/* Three dots menu */}
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

            {/* Messages area */}
            <div className="flex-1 overflow-y-auto p-3 bg-gray-50">
              {loadingMessages ? (
                <div className="flex justify-center items-center h-full">
                  <Spinner className="h-8 w-8 text-blue-500" />
                </div>
              ) : Object.keys(groupedMessages).length > 0 ? (
                Object.entries(groupedMessages).map(([date, msgs]) => (
                  <div key={date}>
                    <div className="flex justify-center my-4">
                      <div className="px-2.5 py-1 bg-gray-200 text-gray-600 text-xs rounded-full">
                        {date}
                      </div>
                    </div>
                    {msgs.map(m => (
                      <div
                        key={m.id}
                        className={`flex mb-2.5 ${m.direction === "outgoing" ? "justify-end" : "justify-start"}`}
                      >
                        <div
                          className={`max-w-[75%] rounded-lg px-3 py-2 ${
                            m.direction === "outgoing" 
                              ? "bg-blue-500 text-white rounded-br-none" 
                              : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                          }`}
                        >
                          {/* Render media if exists */}
                          {m.media && renderMedia(m)}
                          
                          {/* Message body */}
                          {m.body && <div className="text-sm">{m.body}</div>}
                          
                          {/* Timestamp */}
                          <div className="text-[0.65rem] mt-1 flex justify-end opacity-70">
                            {fmtTime(m.timestamp)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))
              ) : (
                <div className="flex justify-center items-center h-full text-gray-500 text-sm">
                  No messages yet. Start the conversation!
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message input - fixed bottom */}
            <div className="p-2.5 border-t bg-white sticky bottom-0 z-20">
              <div className="flex items-center">
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
              <>
                <div className="mb-1">No chat selected</div>
                <p className="text-center">
                  Select a conversation from the list
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Contact info panel */}
      {selected && <ContactInfoPanel />}
    </div>
  );
}