import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import StudentAppLayout from '../../layouts/StudentAppLayout';

const MessagesPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [newRecipient, setNewRecipient] = useState<{ id: string; name: string } | null>(null);

  // Check for incoming recipient from query params (e.g., from Coach tab)
  useEffect(() => {
    const recipientId = searchParams.get('recipientId');
    const recipientName = searchParams.get('recipientName');

    if (recipientId && recipientName) {
      setNewRecipient({ id: recipientId, name: decodeURIComponent(recipientName) });
      setSelectedConversation('new'); // Indicate new conversation mode
    }
  }, [searchParams]);

  // Mock conversations for UI skeleton
  const conversations = [
    { id: '1', name: 'NexSkill Coach', lastMessage: 'Welcome to the course!', time: '10:00 AM', unread: 2 },
    { id: '2', name: 'Support Team', lastMessage: 'Your ticket has been resolved.', time: 'Yesterday', unread: 0 },
  ];
  return (
    <StudentAppLayout>
      <div className="flex h-full">
        {/* Sidebar */}
        <div className="w-80 border-r border-[#EDF0FB] dark:border-gray-700 bg-white dark:bg-dark-background-card flex flex-col">
          <div className="p-4 border-b border-[#EDF0FB] dark:border-gray-700">
            <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">Messages</h2>
            <div className="mt-4 relative">
              <input
                type="text"
                placeholder="Search messages..."
                className="w-full pl-10 pr-4 py-2 bg-[#F5F7FF] dark:bg-gray-800 border-none rounded-xl text-sm focus:ring-2 focus:ring-brand-primary outline-none"
              />
              <span className="absolute left-3 top-2.5 text-text-muted">🔍</span>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto">
            {conversations.map((conv) => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 hover:bg-[#F5F7FF] dark:hover:bg-gray-800 cursor-pointer transition-colors ${selectedConversation === conv.id ? 'bg-[#F5F7FF] dark:bg-gray-800 border-l-4 border-brand-primary' : ''
                  }`}
              >
                <div className="flex justify-between items-start mb-1">
                  <h3 className="font-semibold text-text-primary dark:text-dark-text-primary">{conv.name}</h3>
                  <span className="text-xs text-text-muted">{conv.time}</span>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary line-clamp-1">{conv.lastMessage}</p>
                  {conv.unread > 0 && (
                    <span className="w-5 h-5 bg-brand-primary text-white text-xs flex items-center justify-center rounded-full">
                      {conv.unread}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
        {/* Chat Area */}
        <div className="flex-1 flex flex-col bg-[#FAFBFF] dark:bg-dark-background">
          {selectedConversation ? (
            <>
              {/* Header */}
              <div className="h-16 bg-white dark:bg-dark-background-card border-b border-[#EDF0FB] dark:border-gray-700 flex items-center px-6 shadow-sm">
                <h3 className="font-bold text-lg text-text-primary dark:text-dark-text-primary">
                  {selectedConversation === 'new' && newRecipient
                    ? newRecipient.name
                    : conversations.find(c => c.id === selectedConversation)?.name}
                </h3>
                {selectedConversation === 'new' && newRecipient && (
                  <span className="ml-2 px-2 py-0.5 bg-green-100 text-green-600 text-xs rounded-full">New</span>
                )}
              </div>
              {/* Messages */}
              <div className="flex-1 p-6 overflow-y-auto space-y-4">
                {selectedConversation === 'new' && newRecipient ? (
                  /* New conversation - empty state */
                  <div className="flex-1 flex flex-col items-center justify-center text-center h-full">
                    <div className="text-4xl mb-4">✉️</div>
                    <h4 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-2">
                      Start a conversation with {newRecipient.name}
                    </h4>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                      Type your message below to begin chatting
                    </p>
                  </div>
                ) : (
                  /* Existing conversation - mock messages */
                  <>
                    <div className="flex justify-center">
                      <span className="text-xs text-text-muted bg-gray-100 dark:bg-gray-800 px-3 py-1 rounded-full">Today</span>
                    </div>
                    <div className="flex justify-start">
                      <div className="bg-white dark:bg-dark-background-card p-3 rounded-2xl rounded-tl-none shadow-sm max-w-[70%]">
                        <p className="text-text-primary dark:text-dark-text-primary">Hello! How can I help you today?</p>
                        <span className="text-xs text-text-muted mt-1 block">10:00 AM</span>
                      </div>
                    </div>
                    <div className="flex justify-end">
                      <div className="bg-brand-primary text-white p-3 rounded-2xl rounded-tr-none shadow-sm max-w-[70%]">
                        <p>I have a question about the React course.</p>
                        <span className="text-xs text-white/70 mt-1 block">10:05 AM</span>
                      </div>
                    </div>
                  </>
                )}
              </div>
              {/* Input */}
              <div className="p-4 bg-white dark:bg-dark-background-card border-t border-[#EDF0FB] dark:border-gray-700">
                <div className="flex gap-4">
                  <input
                    type="text"
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-3 bg-[#F5F7FF] dark:bg-gray-800 border-none rounded-xl focus:ring-2 focus:ring-brand-primary outline-none"
                  />
                  <button className="px-6 py-3 bg-brand-primary text-white font-medium rounded-xl hover:bg-brand-primary-dark transition-colors">
                    Send
                  </button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
              <div className="text-6xl mb-6">💬</div>
              <h3 className="text-xl font-bold text-text-primary dark:text-dark-text-primary mb-2">Select a conversation</h3>
              <p className="text-text-secondary dark:text-dark-text-secondary">Choose a contact to start messaging</p>
            </div>
          )}
        </div>
      </div>
    </StudentAppLayout>
  );
};
export default MessagesPage;
