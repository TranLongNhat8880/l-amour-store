import { useState, useRef, useEffect } from "react";
import { MessageSquare, X, Send, Sparkles, User, Heart } from "lucide-react";
import axiosClient from "../../api/axiosClient";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router";
import { useAuthStore } from "../../store/authStore";

interface Message {
  role: "user" | "model";
  parts: [{ text: string }];
}

export function AIMuse() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { user } = useAuthStore();

  // Clear chat when user logs out
  useEffect(() => {
    if (!user) {
      setMessages([]);
      setIsOpen(false);
    }
  }, [user]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  if (!user) return null;

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = input;
    setInput("");
    
    // Thêm tin nhắn user vào list (theo định dạng Gemini history)
    const newMessages: Message[] = [
      ...messages,
      { role: "user", parts: [{ text: userMessage }] }
    ];
    setMessages(newMessages);
    setIsLoading(true);

    try {
      const res: any = await axiosClient.post("/ai/consult", {
        message: userMessage,
        history: messages // Gửi lịch sử chat cũ
      });

      setMessages([
        ...newMessages,
        { role: "model", parts: [{ text: res.data.text }] }
      ]);
    } catch (error) {
      console.error("AI Muse Error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderMessageWithLinks = (text: string) => {
    // Regex to match [text](url)
    const markdownLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    const parts = [];
    let lastIndex = 0;
    let match;

    while ((match = markdownLinkRegex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push(text.substring(lastIndex, match.index));
      }
      
      const linkText = match[1];
      const url = match[2];
      parts.push(
        <Link key={match.index} to={url} className="text-rose-600 underline hover:text-rose-800 transition-colors font-semibold">
          {linkText}
        </Link>
      );
      
      lastIndex = markdownLinkRegex.lastIndex;
    }
    
    if (lastIndex < text.length) {
      parts.push(text.substring(lastIndex));
    }

    return parts.length > 0 ? parts : text;
  };

  return (
    <div className="fixed bottom-6 right-6 z-[9999] font-sans">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="absolute bottom-20 right-0 w-[350px] sm:w-[400px] h-[500px] bg-white rounded-2xl shadow-2xl border border-stone-100 flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="bg-rose-900 p-4 text-white flex items-center justify-between shadow-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-md">
                  <Sparkles className="w-5 h-5 text-rose-200" />
                </div>
                <div>
                  <h3 className="font-serif text-lg leading-tight">L'Amour Muse</h3>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></span>
                    <span className="text-[10px] text-rose-200 uppercase tracking-widest font-medium">Đang lắng nghe...</span>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-white/10 rounded-full transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Chat Content */}
            <div 
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-stone-50/50"
            >
              {messages.length === 0 && (
                <div className="text-center py-8 px-4">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Heart className="w-8 h-8 text-rose-300" />
                  </div>
                  <p className="text-stone-800 font-serif text-lg mb-2">Chào nàng,</p>
                  <p className="text-stone-500 text-sm font-light leading-relaxed">
                    Mình là nàng thơ của L'Amour. Đêm nay bạn muốn bản thân trở nên quyến rũ như thế nào? Hãy chia sẻ với mình nhé...
                  </p>
                </div>
              )}

              {messages.map((msg, idx) => (
                <div 
                  key={idx}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`flex gap-2 max-w-[85%] ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${
                      msg.role === 'user' ? 'bg-stone-200' : 'bg-rose-100'
                    }`}>
                      {msg.role === 'user' ? <User className="w-4 h-4 text-stone-500" /> : <Sparkles className="w-4 h-4 text-rose-500" />}
                    </div>
                    <div className={`p-3 rounded-2xl text-sm leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-rose-800 text-white rounded-tr-none' 
                        : 'bg-white text-stone-700 border border-stone-100 rounded-tl-none'
                    }`}>
                      {msg.role === 'model' ? renderMessageWithLinks(msg.parts[0].text) : msg.parts[0].text}
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="flex justify-start">
                  <div className="flex gap-2 items-center bg-white p-3 rounded-2xl rounded-tl-none border border-stone-100 shadow-sm">
                    <div className="flex gap-1">
                      <span className="w-1.5 h-1.5 bg-rose-300 rounded-full animate-bounce"></span>
                      <span className="w-1.5 h-1.5 bg-rose-400 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                      <span className="w-1.5 h-1.5 bg-rose-500 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Input Area */}
            <form onSubmit={handleSend} className="p-4 bg-white border-t border-stone-100">
              <div className="relative">
                <input 
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Gửi một lời thì thầm..."
                  className="w-full bg-stone-100 border-none rounded-full py-3 pl-4 pr-12 text-sm focus:ring-2 focus:ring-rose-200 outline-none transition-all"
                />
                <button 
                  type="submit"
                  disabled={!input.trim() || isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 bg-rose-800 text-white rounded-full flex items-center justify-center hover:bg-rose-700 disabled:bg-stone-300 transition-colors"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
              <p className="text-[10px] text-center text-stone-400 mt-2 uppercase tracking-widest font-medium">
                Powered by Gemini AI
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Toggle Button */}
      <motion.button
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 bg-rose-900 text-white rounded-full shadow-2xl flex items-center justify-center group relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-rose-800 to-rose-600 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        {isOpen ? <X className="w-6 h-6 relative z-10" /> : <MessageSquare className="w-6 h-6 relative z-10" />}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-rose-400 rounded-full border-2 border-white animate-ping"></span>
        )}
      </motion.button>
    </div>
  );
}
