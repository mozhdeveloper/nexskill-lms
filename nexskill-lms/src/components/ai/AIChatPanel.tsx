import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
}

const AIChatPanel: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      sender: 'ai',
      text: 'Hi! I\'m your AI Student Coach. I can help you with study schedules, course recommendations, or explain difficult concepts. How can I assist you today?',
      timestamp: '10:00 AM',
    },
    {
      id: '2',
      sender: 'user',
      text: 'How am I doing with my courses?',
      timestamp: '10:01 AM',
    },
    {
      id: '3',
      sender: 'ai',
      text: 'You\'re making great progress! You\'ve completed 42 lessons across 3 courses with a 5-day learning streak. Your average quiz score is 82%. Keep up the excellent work!',
      timestamp: '10:01 AM',
    },
  ]);
  const [currentInput, setCurrentInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const generateAIResponse = (userMessage: string): string => {
    const lowerMessage = userMessage.toLowerCase();

    if (lowerMessage.includes('quiz')) {
      return"You've scored an average of 82% on quizzes. Keep up the great work! Need help preparing for your next quiz?";
    }
    if (lowerMessage.includes('stuck') || lowerMessage.includes('help')) {
      return"I'm here to help! Can you tell me which lesson or concept you're struggling with? I can explain it in simpler terms.";
    }
    if (lowerMessage.includes('schedule') || lowerMessage.includes('time')) {
      return"Based on your pattern, you're most active on Wednesdays. I recommend scheduling 30-minute blocks at 7 PM for best retention.";
    }
    if (lowerMessage.includes('recommend') || lowerMessage.includes('next course')) {
      return"Based on your progress in UI Design, I recommend exploring 'Advanced Figma Techniques' or 'Design Systems Fundamentals' next. Both align with your learning goals!";
    }
    if (lowerMessage.includes('motivation') || lowerMessage.includes('tired')) {
      return"Remember why you started! You've already completed 35% of your learning path. Small daily progress adds up to big achievements. You've got this! 💪";
    }

    return"Great question! I can help you with course recommendations, study schedules, quiz preparation, or explain difficult concepts. What would you like to focus on?";
  };

  const handleSend = () => {
    if (currentInput.trim()) {
      const userMessage: Message = {
        id: Date.now().toString(),
        sender: 'user',
        text: currentInput,
        timestamp: new Date().toLocaleTimeString('en-US', {
          hour: 'numeric',
          minute: '2-digit',
        }),
      };

      setMessages((prev) => [...prev, userMessage]);

      // Simulate AI thinking delay
      setTimeout(() => {
        const aiResponse: Message = {
          id: (Date.now() + 1).toString(),
          sender: 'ai',
          text: generateAIResponse(currentInput),
          timestamp: new Date().toLocaleTimeString('en-US', {
            hour: 'numeric',
            minute: '2-digit',
          }),
        };
        setMessages((prev) => [...prev, aiResponse]);
      }, 800);

      setCurrentInput('');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="bg-white rounded-3xl shadow-xl p-6 flex flex-col h-[580px]">
      {/* Header */}
      <div className="flex items-center justify-between mb-4 pb-4 border-b border-slate-200">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Chat with your AI coach</h2>
          <p className="text-sm text-slate-600">Get personalized guidance anytime</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1 bg-green-100 rounded-full">
          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
          <span className="text-xs font-medium text-green-700">Online</span>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-[75%] ${message.sender === 'user' ? 'order-2' : 'order-1'}`}>
              <div className="text-xs font-medium text-slate-600 mb-1 px-1">
                {message.sender === 'user' ? 'You' : 'AI Coach'}
              </div>
              <div
                className={`rounded-2xl px-4 py-3 ${
                  message.sender === 'user'
                    ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white rounded-br-sm'
                    : 'bg-slate-100 text-slate-900 rounded-bl-sm'
                }`}
              >
                <p className="text-sm leading-relaxed">{message.text}</p>
              </div>
              <div
                className={`text-xs text-slate-500 mt-1 px-1 ${
                  message.sender === 'user' ? 'text-right' : 'text-left'
                }`}
              >
                {message.timestamp}
              </div>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      {/* Input footer */}
      <div className="flex gap-3">
        <input
          type="text"
          value={currentInput}
          onChange={(e) => setCurrentInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask anything about your courses or progress…"
          className="flex-1 px-5 py-3 bg-slate-100 rounded-full border border-slate-200 focus:border-[#304DB5] focus:outline-none focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400"
        />
        <button
          onClick={handleSend}
          disabled={!currentInput.trim()}
          className={`px-6 py-3 rounded-full font-semibold transition-all ${
            currentInput.trim()
              ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white hover:shadow-lg'
              : 'bg-slate-200 text-slate-400 cursor-not-allowed'
          }`}
        >
          Send
        </button>
      </div>
    </div>
  );
};

export default AIChatPanel;
