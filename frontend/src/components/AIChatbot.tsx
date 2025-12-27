import { useState } from 'react';
import { MessageCircle, X, Send } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export function AIChatbot() {
  const { colors, mode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: 'Hello! I am your INDRA AI assistant. How can I help you with rainwater harvesting today?',
    },
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setIsLoading(true);

    try {
      // Determine which chatbot to use based on mode
      const endpoint = mode === 'urban' 
        ? 'http://localhost:8000/api/chatbot/standard'
        : 'http://localhost:8000/api/chatbot/rural';

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });

      if (!response.ok) throw new Error('Failed to get response');

      const data = await response.json();
      setMessages((prev) => [...prev, { role: 'assistant', content: data.response }]);
    } catch (error) {
      console.error('Chatbot error:', error);
      setMessages((prev) => [
        ...prev,
        { 
          role: 'assistant', 
          content: 'Sorry, I encountered an error. Please try again or check if the backend is running.' 
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="rounded-full p-4 text-white shadow-lg hover:scale-110 transition-transform"
          style={{ backgroundColor: colors.primary }}
        >
          <MessageCircle className="w-6 h-6" />
        </button>
      )}

      {isOpen && (
        <div className="bg-white rounded-lg shadow-2xl w-80 sm:w-96 flex flex-col overflow-hidden">
          <div
            className="p-4 text-white flex items-center justify-between"
            style={{ backgroundColor: colors.primary }}
          >
            <div className="flex items-center space-x-2">
              <MessageCircle className="w-5 h-5" />
              <span className="font-semibold">INDRA AI Assistant</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="hover:opacity-80 transition-opacity"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
            {messages.map((message, index) => (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] p-3 rounded-lg ${
                    message.role === 'user'
                      ? 'text-white'
                      : 'bg-white border border-gray-200'
                  }`}
                  style={
                    message.role === 'user' ? { backgroundColor: colors.primary } : {}
                  }
                >
                  <p className="text-sm" style={{ color: message.role === 'user' ? '#ffffff' : '#000000' }}>
                    {message.content}
                  </p>
                </div>
              </div>
            ))}
            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-gray-200 p-3 rounded-lg">
                  <div className="flex space-x-2">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100" />
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200" />
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="p-4 border-t border-gray-200">
            <div className="flex space-x-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask me anything..."
                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2"
                style={{ focusRingColor: colors.primary }}
              />
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="p-2 text-white rounded-lg disabled:opacity-50 hover:opacity-90 transition-opacity"
                style={{ backgroundColor: colors.primary }}
              >
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
