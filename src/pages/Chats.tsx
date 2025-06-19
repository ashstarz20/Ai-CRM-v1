// ✅ src/pages/Chats.tsx
import { useState, useEffect, useRef, useMemo } from "react";
import {
  getChatsByAccount,
  getMessagesByChat,
  addMessageToChat,
  getChatDocument,
  Chat,
  Message,
  Timestamp,
  subscribeChats,
  subscribeMessages
} from "../services/firebase";
import { updateDoc } from "firebase/firestore";
import { format } from "date-fns";

// Helper function to get initials from name
const getInitials = (name: string) => {
  if (!name) return "?";
  const names = name.split(" ");
  let initials = names[0].charAt(0).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].charAt(0).toUpperCase();
  }
  return initials;
};

export default function Chats() {
  const [chats, setChats] = useState<Chat[]>([]);
  const [selected, setSelected] = useState<Chat | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [draft, setDraft] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const accountId = "593329000520625";
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  // Filter chats based on search query
  const filteredChats = useMemo(() => {
    if (!searchQuery) return chats;
    const query = searchQuery.toLowerCase();
    return chats.filter(chat => 
      chat.contact.name.toLowerCase().includes(query) || 
      chat.contact.phone.includes(query)
    );
  }, [chats, searchQuery]);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Fetch initial chats and set up real-time updates
  useEffect(() => {
    const fetchInitialChats = async () => {
      const initialChats = await getChatsByAccount(accountId);
      setChats(initialChats);
      if (initialChats.length > 0 && !selected) {
        setSelected(initialChats[0]);
      }
    };
    
    fetchInitialChats();
    
    const unsubscribe = subscribeChats(accountId, (updatedChats) => {
      setChats(updatedChats);
      
      // Update selected chat if it exists in the updated list
      if (selected) {
        const updatedSelected = updatedChats.find(c => c.id === selected.id);
        if (updatedSelected) {
          setSelected(updatedSelected);
        }
      }
    });
    
    return unsubscribe;
  }, []);

  // Subscribe to messages when a chat is selected
  useEffect(() => {
    if (!selected) return;
    
    // Reset unread count
    updateDoc(getChatDocument(accountId, selected.id), { unreadCount: 0 });
    
    // Fetch initial messages
    const fetchInitialMessages = async () => {
      const msgs = await getMessagesByChat(accountId, selected.id);
      setMessages(msgs);
    };
    fetchInitialMessages();
    
    // Set up real-time message updates
    const unsubscribe = subscribeMessages(accountId, selected.id, (msgs) => {
      setMessages(msgs);
    });
    
    return unsubscribe;
  }, [selected]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Send message function
  const send = async () => {
    if (!selected || !draft.trim()) return;
    
    // Create temporary message for instant UI update
    const tempMsg: Message = {
      id: `temp-${Date.now()}`,
      body: draft.trim(),
      timestamp: Timestamp.fromDate(new Date()),
      direction: "outgoing",
      status: "sending",
    };
    
    // Update UI immediately
    setMessages(prev => [...prev, tempMsg]);
    setDraft("");
    
    try {
      // Send to Firebase
      const msg: Omit<Message, 'id'> = {
        body: draft.trim(),
        timestamp: Timestamp.fromDate(new Date()),
        direction: "outgoing",
        status: "sent",
      };
      
      await addMessageToChat(accountId, selected.id, msg);
      await updateDoc(getChatDocument(accountId, selected.id), {
        lastMessage: {
          body: msg.body,
          timestamp: msg.timestamp
        },
        unreadCount: 0,
      });
      
      // Remove temp message and add final message
      const newMessageId = `sent-${Date.now()}`;
      setMessages(prev => [
        ...prev.filter(m => m.id !== tempMsg.id), 
        { ...msg, id: newMessageId }
      ]);
      
    } catch (error) {
      // Update message status if sending fails
      setMessages(prev => prev.map(m => 
        m.id === tempMsg.id ? {...m, status: 'failed'} : m
      ));
      console.error("Error sending message:", error);
    }
  };

  // Format timestamp
  const fmtTime = (t?: Timestamp) => t ? format(t.toDate(), "hh:mm a") : "";
  const fmtDate = (t?: Timestamp) => t ? format(t.toDate(), "MMM d, yyyy") : "";

  // Group messages by date
  const groupedMessages = () => {
    const groups: {[key: string]: Message[]} = {};
    
    messages.forEach(msg => {
      const date = fmtDate(msg.timestamp);
      if (!groups[date]) groups[date] = [];
      groups[date].push(msg);
    });
    
    return groups;
  };

  return (
    <div className="flex h-screen bg-gray-50 overflow-hidden">
      {/* Chat List */}
      <div className="w-80 flex flex-col border-r border-gray-200 bg-white">
        <div className="p-4 border-b border-gray-200">
          <h1 className="text-xl font-bold text-gray-800">Chats</h1>
          <div className="mt-2 relative">
            <input
              type="text"
              placeholder="Search chats..."
              className="w-full px-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
            <svg 
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto">
          {filteredChats.map(c => (
            <div
              key={c.id}
              onClick={() => setSelected(c)}
              className={`p-4 cursor-pointer transition flex items-start ${
                selected?.id === c.id ? "bg-blue-50" : "hover:bg-gray-50"
              }`}
            >
              <div className="flex items-center justify-center rounded-full w-12 h-12 flex-shrink-0 bg-blue-100 text-blue-700 font-bold">
                {getInitials(c.contact.name)}
              </div>
              <div className="ml-3 flex-1 min-w-0">
                <div className="flex justify-between">
                  <div className="font-semibold text-gray-800 truncate">{c.contact.name}</div>
                  {c.lastMessage && (
                    <div className="text-xs text-gray-500 whitespace-nowrap ml-2">
                      {fmtTime(c.lastMessage.timestamp)}
                    </div>
                  )}
                </div>
                <div className="text-sm text-gray-600 truncate">{c.contact.phone}</div>
                {c.lastMessage && (
                  <div className="text-sm text-gray-500 truncate mt-1">
                    {c.lastMessage.body}
                  </div>
                )}
                {c.unreadCount && c.unreadCount > 0 ? (
                  <div className="mt-1">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 text-xs font-bold leading-none text-white bg-blue-500 rounded-full">
                      {c.unreadCount}
                    </span>
                  </div>
                ) : null}
              </div>
            </div>
          ))}
          {filteredChats.length === 0 && (
            <div className="p-4 text-center text-gray-500">
              {searchQuery ? "No chats match your search" : "No chats available"}
            </div>
          )}
        </div>
      </div>

      {/* Chat Panel */}
      <div className="flex flex-col flex-1">
        {selected ? (
          <>
            {/* Header */}
            <div className="p-4 border-b border-gray-200 bg-white flex items-center">
              <div className="flex items-center justify-center rounded-full w-12 h-12 flex-shrink-0 bg-blue-100 text-blue-700 font-bold">
                {getInitials(selected.contact.name)}
              </div>
              <div className="ml-3">
                <div className="font-bold text-lg text-gray-800">{selected.contact.name}</div>
                <div className="text-sm text-gray-600">Online</div>
              </div>
              <div className="ml-auto flex space-x-2">
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </button>
                <button className="p-2 rounded-full hover:bg-gray-100">
                  <svg className="h-5 w-5 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 bg-gradient-to-b from-gray-50 to-gray-100"
            >
              {Object.entries(groupedMessages()).map(([date, dateMessages]) => (
                <div key={date}>
                  <div className="flex justify-center my-4">
                    <div className="px-3 py-1 bg-gray-200 text-gray-600 text-sm rounded-full">
                      {date}
                    </div>
                  </div>
                  {dateMessages.map(m => (
                    <div
                      key={m.id}
                      className={`flex mb-4 ${
                        m.direction === "outgoing" ? "justify-end" : "justify-start"
                      }`}
                    >
                      <div
                        className={`max-w-md rounded-2xl px-4 py-2 ${
                          m.direction === "outgoing"
                            ? "bg-blue-500 text-white rounded-br-none"
                            : "bg-white text-gray-800 rounded-bl-none border border-gray-200"
                        }`}
                      >
                        <div>{m.body ?? <i className="opacity-70">[No content]</i>}</div>
                        <div className={`text-xs mt-1 flex justify-end ${
                          m.direction === "outgoing" ? "text-blue-100" : "text-gray-500"
                        }`}>
                          {fmtTime(m.timestamp)}
                          {m.direction === "outgoing" && m.status && m.status !== "sending" && (
                            <span className="ml-1">
                              {m.status === "sent" ? "✓" : 
                               m.status === "delivered" ? "✓✓" : 
                               m.status === "read" ? "✓✓ (Read)" : ""}
                            </span>
                          )}
                          {m.direction === "outgoing" && m.status === "sending" && (
                            <span className="ml-1 animate-pulse">Sending...</span>
                          )}
                          {m.direction === "outgoing" && m.status === "failed" && (
                            <span className="ml-1 text-red-300">Failed</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            {/* Input Area */}
            <div className="p-4 border-t border-gray-200 bg-white">
              <div className="flex items-center">
                <button className="p-2 text-gray-500 hover:text-gray-700">
                  <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                  </svg>
                </button>
                <div className="flex-1 mx-2">
                  <input
                    className="w-full border border-gray-300 rounded-full px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-400"
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => e.key === "Enter" && send()}
                    placeholder="Type your message..."
                  />
                </div>
                <button 
                  onClick={send}
                  disabled={!draft.trim()}
                  className={`p-3 rounded-full ${
                    draft.trim() 
                      ? "bg-blue-500 hover:bg-blue-600" 
                      : "bg-gray-200 cursor-not-allowed"
                  }`}
                >
                  <svg 
                    className="h-5 w-5 text-white" 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                </button>
              </div>
            </div>
          </>
        ) : (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center bg-gray-50">
            <div className="max-w-md">
              <div className="flex items-center justify-center rounded-full w-16 h-16 mx-auto bg-blue-100 text-blue-700 font-bold text-xl">
                ?
              </div>
              <h2 className="mt-4 text-xl font-bold text-gray-800">No chat selected</h2>
              <p className="mt-2 text-gray-600">
                Select a chat from the list to start messaging, or start a new conversation
              </p>
              <button className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-full hover:bg-blue-600 transition">
                Start New Chat
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}