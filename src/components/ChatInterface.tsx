import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Send, Bot, User, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface ChatInterfaceProps {
  csvData: any[];
  fileName: string;
}

export const ChatInterface = ({ csvData, fileName }: ChatInterfaceProps) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "welcome",
      role: "assistant",
      content: `Hello! Your CSV file "${fileName}" with ${csvData.length} rows is ready. Ask me anything.`,
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setIsLoading(true);

    try {
      const response = await fetch("https://spark-rag.onrender.com/ask", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ question: input.trim() }),
      });

      const result = await response.json();

      if (result.error) {
        toast({ title: "Backend Error", description: result.error, variant: "destructive" });
      } else {
        const assistantMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: "assistant",
          content: `Query: ${result.query}\n\nFinal Answer: ${result.final_answer}`,
          timestamp: new Date()
        };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch {
      toast({ title: "Error", description: "Backend unreachable.", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-4">RAG Chat Assistant for file: {fileName}</Card>
      <Card className="h-96 overflow-y-auto p-4 space-y-4">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : ""}`}>
            <div className={`p-3 rounded-lg ${msg.role === "user" ? "bg-blue-500 text-white" : "bg-gray-100"}`}>
              {msg.content}
            </div>
          </div>
        ))}
        {isLoading && (
          <div className="flex gap-2">
            <Loader2 className="w-4 h-4 animate-spin" /> Thinking...
          </div>
        )}
        <div ref={messagesEndRef} />
      </Card>

      <form onSubmit={handleSubmit} className="flex gap-2">
        <Textarea value={input} onChange={e => setInput(e.target.value)} placeholder="Ask your question..." />
        <Button type="submit" disabled={isLoading || !input.trim()}>
          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
        </Button>
      </form>
    </div>
  );
};
