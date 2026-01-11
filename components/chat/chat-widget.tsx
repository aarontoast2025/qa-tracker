"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";
import { 
  MessageSquare, 
  X, 
  Send, 
  Circle, 
  Search, 
  Loader2, 
  ChevronDown,
  Info,
  Pencil,
  Trash2,
  MoreVertical,
  Check,
  RotateCcw,
  Reply
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ChatUser {
  id: string;
  first_name: string | null;
  last_name: string | null;
  email: string | null;
  online?: boolean;
}

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  created_at: string;
  updated_at?: string;
  is_read: boolean;
  reply_to_id?: string | null;
}

export function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [activeChat, setActiveChat] = useState<ChatUser | null>(null);
  const [users, setUsers] = useState<ChatUser[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [onlineUsers, setOnlineUsers] = useState<string[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [unreadCounts, setUnreadCounts] = useState<Record<string, number>>({});
  const [currentUser, setCurrentUser] = useState<any>(null);
  
  // Edit state
  const [editingMsg, setEditingMsg] = useState<Message | null>(null);
  const [editContent, setEditContent] = useState("");
  const [isClearDialogOpen, setIsClearDialogOpen] = useState(false);
  
  // Reply state
  const [replyingTo, setReplyingTo] = useState<Message | null>(null);

  const supabase = createClient();
  const scrollRef = useRef<HTMLDivElement>(null);
  const activeChatRef = useRef<ChatUser | null>(null);
  const isOpenRef = useRef(false);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    scrollToBottom();
  }, [messages, isTyping, isOpen]);

  useEffect(() => {
    activeChatRef.current = activeChat;
    isOpenRef.current = isOpen;
    if (activeChat && isOpen) {
      markAsRead(activeChat.id);
    }
  }, [activeChat, isOpen]);

  const totalUnread = Object.values(unreadCounts).reduce((a, b) => a + b, 0);

  useEffect(() => {
    async function init() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        loadUsers(user.id);
        fetchInitialUnread(user.id);
      }
    }
    init();
  }, []);

  useEffect(() => {
    if (!currentUser) return;

    const channel = supabase.channel('chat_main')
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'user_chats' 
      }, (payload) => {
        const currentActive = activeChatRef.current;

        if (payload.eventType === 'INSERT') {
          const newMsg = payload.new as Message;
          if (
            (newMsg.sender_id === currentActive?.id && newMsg.receiver_id === currentUser.id) ||
            (newMsg.sender_id === currentUser.id && newMsg.receiver_id === currentActive?.id)
          ) {
            setMessages(prev => [...prev.filter(m => m.id !== newMsg.id), newMsg]);
            if (newMsg.sender_id === currentActive?.id) markAsRead(newMsg.sender_id);
          }
          if (newMsg.receiver_id === currentUser.id && (!isOpenRef.current || currentActive?.id !== newMsg.sender_id)) {
            setUnreadCounts(prev => ({ ...prev, [newMsg.sender_id]: (prev[newMsg.sender_id] || 0) + 1 }));
            playNotificationSound();
          }
        } 
        else if (payload.eventType === 'UPDATE') {
          const updatedMsg = payload.new as Message;
          setMessages(prev => prev.map(m => m.id === updatedMsg.id ? updatedMsg : m));
        } 
        else if (payload.eventType === 'DELETE') {
          setMessages(prev => prev.filter(m => m.id !== payload.old.id));
        }
      })
      .on('broadcast', { event: 'typing' }, (payload) => {
        if (payload.payload.senderId === activeChatRef.current?.id) {
          setIsTyping(true);
          setTimeout(() => setIsTyping(false), 3000);
        }
      })
      .subscribe();

    channelRef.current = channel;

    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const onlineIds = Object.values(state).flat().map((p: any) => p.user_id);
        setOnlineUsers(onlineIds);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: currentUser.id });
        }
      });

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [currentUser?.id]);

  useEffect(() => {
    if (activeChat) {
      loadMessages();
    } else {
      setMessages([]);
    }
  }, [activeChat?.id]);

  const fetchInitialUnread = async (myId: string) => {
    const { data } = await supabase
      .from('user_chats')
      .select('sender_id')
      .eq('receiver_id', myId)
      .eq('is_read', false);
    
    if (data) {
      const counts: Record<string, number> = {};
      data.forEach(msg => { counts[msg.sender_id] = (counts[msg.sender_id] || 0) + 1; });
      setUnreadCounts(counts);
    }
  };

  const markAsRead = async (senderId: string) => {
    if (!currentUser) return;
    setUnreadCounts(prev => ({ ...prev, [senderId]: 0 }));
    await supabase.from('user_chats').update({ is_read: true }).eq('receiver_id', currentUser.id).eq('sender_id', senderId).eq('is_read', false);
  };

  const loadUsers = async (myId: string) => {
    setLoadingUsers(true);
    const { data } = await supabase.from('user_profiles').select('id, first_name, last_name, company_email').neq('id', myId);
    if (data) setUsers(data.map(u => ({ id: u.id, first_name: u.first_name, last_name: u.last_name, email: u.company_email })));
    setLoadingUsers(false);
  };

  const loadMessages = async () => {
    if (!activeChat || !currentUser) return;
    setLoading(true);
    const { data } = await supabase.from('user_chats').select('*')
      .or(`and(sender_id.eq.${currentUser.id},receiver_id.eq.${activeChat.id}),and(sender_id.eq.${activeChat.id},receiver_id.eq.${currentUser.id})`)
      .order('created_at', { ascending: true });
    setMessages(data || []);
    setLoading(false);
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !activeChat || !currentUser) return;
    const content = newMessage.trim();
    const reply_to_id = replyingTo?.id || null;
    setNewMessage("");
    setReplyingTo(null);
    await supabase.from('user_chats').insert({ 
      sender_id: currentUser.id, 
      receiver_id: activeChat.id, 
      content,
      reply_to_id 
    });
  };

  const deleteMessage = async (id: string) => {
    await supabase.from('user_chats').delete().eq('id', id);
  };

  const startEditing = (msg: Message) => {
    setEditingMsg(msg);
    setEditContent(msg.content);
  };

  const saveEdit = async () => {
    if (!editingMsg || !editContent.trim()) return;
    await supabase.from('user_chats').update({ 
      content: editContent.trim(), 
      updated_at: new Date().toISOString() 
    }).eq('id', editingMsg.id);
    setEditingMsg(null);
  };

  const clearConversation = async () => {
    if (!activeChat || !currentUser) return;
    
    // Delete all messages where current user is sender and active chat is receiver
    await supabase.from('user_chats').delete()
      .eq('sender_id', currentUser.id)
      .eq('receiver_id', activeChat.id);
    
    // Delete all messages where active chat is sender and current user is receiver
    await supabase.from('user_chats').delete()
      .eq('sender_id', activeChat.id)
      .eq('receiver_id', currentUser.id);
    
    setMessages([]);
    setIsClearDialogOpen(false);
  };

  const handleTyping = () => {
    if (!currentUser || !activeChat || !channelRef.current) return;
    channelRef.current.send({ type: 'broadcast', event: 'typing', payload: { senderId: currentUser.id } });
  };

  const scrollToBottom = () => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  };

  const playNotificationSound = () => {
    try {
      const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2354/2354-preview.mp3');
      audio.volume = 0.5; audio.play().catch(() => {});
    } catch (e) {}
  };

  const filteredUsers = users.filter(u => `${u.first_name} ${u.last_name}`.toLowerCase().includes(searchQuery.toLowerCase()) || u.email?.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end">
      {isOpen && (
        <div className="bg-background border rounded-lg shadow-2xl mb-4 w-[350px] sm:w-[400px] h-[500px] flex flex-col overflow-hidden animate-in slide-in-from-bottom-5 duration-300">
          {/* Header */}
          <div className="p-4 bg-primary text-primary-foreground flex items-center justify-between shadow-md shrink-0">
            <div className="flex items-center gap-3">
              {activeChat ? (
                <button onClick={() => setActiveChat(null)} className="hover:bg-primary-foreground/10 p-1 rounded-full transition-colors">
                  <ChevronDown className="h-5 w-5 rotate-90" />
                </button>
              ) : (
                <MessageSquare className="h-5 w-5" />
              )}
              <div>
                <h3 className="font-bold text-sm">{activeChat ? `${activeChat.first_name} ${activeChat.last_name}` : "Messages"}</h3>
                {activeChat && (
                  <div className="flex items-center gap-1">
                    <Circle className={cn("h-2 w-2 fill-current", onlineUsers.includes(activeChat.id) ? "text-green-400" : "text-gray-400")} />
                    <span className="text-[10px] opacity-80">{onlineUsers.includes(activeChat.id) ? "Online" : "Offline"}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeChat && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/10 rounded-full">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem className="text-destructive gap-2" onClick={() => setIsClearDialogOpen(true)}>
                      <RotateCcw className="h-4 w-4" /> Clear Conversation
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
              <button onClick={() => setIsOpen(false)} className="hover:bg-primary-foreground/10 p-1 rounded-full"><X className="h-5 w-5" /></button>
            </div>
          </div>

          <div className="flex-1 overflow-hidden flex flex-col">
            {!activeChat ? (
              <div className="flex flex-col h-full">
                <div className="p-3 border-b bg-muted/30">
                  <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input placeholder="Search contacts..." className="pl-9 h-9 text-xs" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto p-2">
                  {loadingUsers ? <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : filteredUsers.map(user => (
                    <button key={user.id} onClick={() => setActiveChat(user)} className="w-full flex items-center gap-3 p-3 hover:bg-muted/50 rounded-md transition-colors text-left group relative">
                      <div className="relative">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center font-bold text-primary">{user.first_name?.[0]?.toUpperCase() || "?"}</div>
                        {onlineUsers.includes(user.id) && <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-green-500 border-2 border-background" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{user.first_name} {user.last_name}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
                      </div>
                      {unreadCounts[user.id] > 0 && <div className="h-5 w-5 bg-primary text-primary-foreground rounded-full flex items-center justify-center text-[10px] font-bold">{unreadCounts[user.id]}</div>}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="flex flex-col h-full">
                <div className="bg-muted/30 px-4 py-2 flex items-center gap-2 border-b shrink-0">
                  <Info className="h-3.5 w-3.5 text-muted-foreground" />
                  <p className="text-[10px] text-muted-foreground">Messages are kept for 30 days.</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4" ref={scrollRef}>
                  {loading ? <div className="flex items-center justify-center h-full"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div> : messages.map((msg) => {
                    const isMe = msg.sender_id === currentUser?.id;
                    const isEditing = editingMsg?.id === msg.id;
                    const repliedMsg = msg.reply_to_id ? messages.find(m => m.id === msg.reply_to_id) : null;
                    return (
                      <div key={msg.id} className={cn("flex flex-col group", isMe ? "items-end" : "items-start")}>
                        <div className="flex items-center gap-2 max-w-[85%] group">
                          {isMe && !isEditing && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
                              <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Reply"><Reply className="h-3 w-3" /></button>
                              <button onClick={() => startEditing(msg)} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Edit"><Pencil className="h-3 w-3" /></button>
                              <button onClick={() => deleteMessage(msg.id)} className="p-1 hover:bg-destructive/10 rounded text-destructive" title="Delete"><Trash2 className="h-3 w-3" /></button>
                            </div>
                          )}
                          {!isMe && !isEditing && (
                            <div className="opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 order-2">
                              <button onClick={() => setReplyingTo(msg)} className="p-1 hover:bg-muted rounded text-muted-foreground" title="Reply"><Reply className="h-3 w-3" /></button>
                            </div>
                          )}
                          <div className={cn("rounded-2xl px-4 py-2 text-sm shadow-sm", isMe ? "bg-primary text-primary-foreground rounded-br-none" : "bg-muted rounded-bl-none")}>
                            {repliedMsg && (
                              <div className={cn("mb-2 pb-2 border-l-2 pl-2 text-xs opacity-70", isMe ? "border-primary-foreground/30" : "border-primary/30")}>
                                <div className="flex items-center gap-1 mb-0.5">
                                  <Reply className="h-2.5 w-2.5" />
                                  <span className="font-semibold">{repliedMsg.sender_id === currentUser?.id ? "You" : activeChat?.first_name}</span>
                                </div>
                                <p className="truncate">{repliedMsg.content}</p>
                              </div>
                            )}
                            {isEditing ? (
                              <div className="flex flex-col gap-2 min-w-[200px]">
                                <Input value={editContent} onChange={e => setEditContent(e.target.value)} className="h-8 text-xs bg-primary-foreground text-primary focus-visible:ring-0" autoFocus onKeyDown={e => e.key === 'Enter' && saveEdit()} />
                                <div className="flex justify-end gap-1">
                                  <button onClick={() => setEditingMsg(null)} className="text-[10px] underline">Cancel</button>
                                  <button onClick={saveEdit} className="text-[10px] font-bold flex items-center gap-0.5"><Check className="h-3 w-3" /> Save</button>
                                </div>
                              </div>
                            ) : msg.content}
                          </div>
                        </div>
                        <div className="flex items-center gap-1.5 mt-1 px-1">
                          {msg.updated_at && <span className="text-[9px] text-muted-foreground italic">edited</span>}
                          <span className="text-[9px] text-muted-foreground">{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                        </div>
                      </div>
                    );
                  })}
                  {isTyping && <div className="flex items-start"><div className="bg-muted rounded-2xl rounded-bl-none px-4 py-2 text-sm shadow-sm flex gap-1"><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:'150ms'}} /><span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{animationDelay:'300ms'}} /></div></div>}
                </div>
                <form onSubmit={sendMessage} className="p-4 border-t bg-background shrink-0">
                  {replyingTo && (
                    <div className="mb-2 p-2 bg-muted/50 rounded-lg flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1 mb-1">
                          <Reply className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs font-semibold text-muted-foreground">
                            Replying to {replyingTo.sender_id === currentUser?.id ? "yourself" : activeChat?.first_name}
                          </span>
                        </div>
                        <p className="text-xs text-muted-foreground truncate">{replyingTo.content}</p>
                      </div>
                      <button 
                        type="button"
                        onClick={() => setReplyingTo(null)} 
                        className="p-1 hover:bg-muted rounded text-muted-foreground shrink-0"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  )}
                  <div className="flex items-center gap-2">
                    <Input placeholder="Type a message..." className="flex-1 h-9 text-sm focus-visible:ring-1" value={newMessage} onChange={e => {setNewMessage(e.target.value); handleTyping();}} />
                    <Button type="submit" size="icon" className="h-9 w-9 shrink-0" disabled={!newMessage.trim()}><Send className="h-4 w-4" /></Button>
                  </div>
                </form>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Clear Dialog */}
      <AlertDialog open={isClearDialogOpen} onOpenChange={setIsClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <Trash2 className="h-5 w-5 text-destructive" />
              Clear Conversation?
            </AlertDialogTitle>
            <AlertDialogDescription className="flex items-start gap-2">
              <Info className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
              <span>This will permanently delete all messages in this chat for both you and {activeChat?.first_name}. This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="flex items-center gap-2">
              <X className="h-4 w-4" />
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction onClick={clearConversation} className="bg-destructive text-destructive-foreground hover:bg-destructive/90 flex items-center gap-2">
              <Trash2 className="h-4 w-4" />
              Delete All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Button onClick={() => setIsOpen(!isOpen)} className="h-14 w-14 rounded-full shadow-2xl relative group hover:scale-105 transition-all duration-200" size="icon">
        {isOpen ? <X className="h-6 w-6" /> : <MessageSquare className="h-6 w-6" />}
        {totalUnread > 0 && <div className="absolute -top-1 -right-1 h-6 w-6 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center text-[10px] font-bold border-2 border-background animate-bounce">{totalUnread > 9 ? "9+" : totalUnread}</div>}
      </Button>
    </div>
  );
}
