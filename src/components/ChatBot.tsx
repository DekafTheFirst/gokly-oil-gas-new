import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, X, Send, Bot } from "lucide-react";

interface Message {
  role: "user" | "bot";
  content: string;
}

const companyResponses: Record<string, string> = {
  services:
    "Gokly Oil and Gas Services Limited offers a wide range of services including: Specialized Oil & Gas Training, Facility Management, Oil & Gas Consulting, Industrial Safety Management, Drilling & Well Engineering, Construction Services, Procurement & Supplies, Environmental Management Studies, Pipeline Installation, Offshore Maintenance, Waste Management, EPCI Projects, Tank Farm Revamp, Fabrication, Crude Oil Tank Dewatering, Audit & Documentation, and Host Community Advisory Services.",
  about:
    "Gokly Oil and Gas Services Limited is a leading provider of comprehensive solutions to the oil and gas industry. We operate in both midstream and upstream sectors in Nigeria. Our mission is to deliver exceptional services that enhance operational efficiency, safety, sustainability, and stakeholders' collaboration.",
  location:
    "We are located at Okobabian Plaza, Kaka New Road, Isaac Boro Expressway, Yenagoa, Bayelsa State, Nigeria.",
  contact:
    "You can reach us by email at info@goklyoilandgas.com or visit our Contact page to submit an inquiry. Our team typically responds within 24 business hours.",
  training:
    "We provide specialized oil and gas training programs including Metal Fabrication and Pipe Fitting Training, safety management courses, and industry-specific technical training to develop skilled professionals for the energy sector.",
  safety:
    "Safety is paramount at Gokly. We offer General Industrial Safety Management services and maintain 100% HSE compliance across all our operations. We follow international best practices in health, safety, and environmental management.",
  hours:
    "Our office hours are Monday to Friday, 8:00 AM - 5:00 PM (WAT). For urgent inquiries outside business hours, you can leave a message here and our team will respond as soon as possible.",
  drilling:
    "Our Drilling and Well Engineering services cover the full lifecycle of well operations. We provide comprehensive drilling solutions using modern techniques and equipment to ensure efficiency and safety.",
};

function getBotResponse(input: string): string {
  const lower = input.toLowerCase();

  if (lower.includes("service") || lower.includes("what do you do") || lower.includes("offer"))
    return companyResponses.services;
  if (lower.includes("about") || lower.includes("who") || lower.includes("company") || lower.includes("gokly"))
    return companyResponses.about;
  if (lower.includes("where") || lower.includes("location") || lower.includes("address") || lower.includes("office"))
    return companyResponses.location;
  if (lower.includes("contact") || lower.includes("reach") || lower.includes("email") || lower.includes("phone"))
    return companyResponses.contact;
  if (lower.includes("training") || lower.includes("learn") || lower.includes("course"))
    return companyResponses.training;
  if (lower.includes("safety") || lower.includes("hse") || lower.includes("safe"))
    return companyResponses.safety;
  if (lower.includes("hour") || lower.includes("time") || lower.includes("open") || lower.includes("weekend"))
    return companyResponses.hours;
  if (lower.includes("drill") || lower.includes("well"))
    return companyResponses.drilling;
  if (lower.includes("hello") || lower.includes("hi") || lower.includes("hey") || lower.includes("good"))
    return "Hello! Welcome to Gokly Oil and Gas Services Limited. I'm G Bot, your virtual assistant. How can I help you today? You can ask about our services, location, contact information, or anything about the oil and gas industry.";

  return "Thank you for your question. While I may not have the specific answer right now, I'd recommend reaching out to our team directly through the Contact page or email us at info@goklyoilandgas.com. Our staff will provide you with detailed assistance during business hours (Mon-Fri, 8 AM - 5 PM WAT). Is there anything else I can help with?";
}

const ChatBot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      content:
        "Hello! I'm G Bot, Gokly Oil and Gas virtual assistant. I can help you with company information, our services, contact details, and general oil & gas questions. How can I assist you today?",
    },
  ]);
  const [input, setInput] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMsg }]);

    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: getBotResponse(userMsg) },
      ]);
    }, 800);
  };

  return (
    <>
      {/* Floating Button */}
      <motion.button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-elevated hover:opacity-90 transition-opacity"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        animate={!isOpen ? { boxShadow: ["0 0 20px hsl(145 63% 32% / 0.3)", "0 0 40px hsl(145 63% 32% / 0.6)", "0 0 20px hsl(145 63% 32% / 0.3)"] } : {}}
        transition={!isOpen ? { duration: 2, repeat: Infinity } : {}}
      >
        {isOpen ? <X size={22} /> : <MessageCircle size={22} />}
      </motion.button>

      {/* Chat Window */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-24 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] h-[500px] bg-card rounded-2xl shadow-elevated border border-border flex flex-col overflow-hidden"
          >
            {/* Header */}
            <div className="px-5 py-4 bg-primary text-primary-foreground flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary-foreground/20 flex items-center justify-center">
                <Bot size={20} />
              </div>
              <div>
                <h3 className="font-heading font-bold text-sm">G Bot</h3>
                <p className="text-xs opacity-70 font-body">Gokly Virtual Assistant</p>
              </div>
              <div className="ml-auto w-2.5 h-2.5 rounded-full bg-gokly-gold animate-pulse" />
            </div>

            {/* Messages */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto p-4 space-y-3"
            >
              {messages.map((msg, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] px-4 py-2.5 rounded-2xl text-sm font-body leading-relaxed ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground rounded-br-md"
                        : "bg-secondary text-secondary-foreground rounded-bl-md"
                    }`}
                  >
                    {msg.content}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="p-3 border-t border-border">
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSend();
                }}
                className="flex gap-2"
              >
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2.5 rounded-full bg-muted text-foreground font-body text-sm outline-none focus:ring-2 focus:ring-primary/30"
                />
                <button
                  type="submit"
                  className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center hover:opacity-90 transition-opacity flex-shrink-0"
                >
                  <Send size={16} />
                </button>
              </form>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ChatBot;
