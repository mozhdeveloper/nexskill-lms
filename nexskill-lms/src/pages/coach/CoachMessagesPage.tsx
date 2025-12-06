import React, { useState } from 'react';
import CoachAppLayout from '../../layouts/CoachAppLayout';
import { Search, Send, Archive, Star, MoreVertical, Paperclip } from 'lucide-react';

interface Conversation {
  id: string;
  studentName: string;
  studentAvatar?: string;
  lastMessage: string;
  timestamp: string;
  unread: boolean;
  starred: boolean;
  course?: string;
}

interface Message {
  id: string;
  content: string;
  timestamp: string;
  isFromCoach: boolean;
  attachments?: Array<{ name: string; size: string; type: string }>;
}

const CoachMessagesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'starred'>('all');

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      studentName: 'Emma Wilson',
      lastMessage: 'Thank you for the feedback on my assignment!',
      timestamp: '10 min ago',
      unread: true,
      starred: false,
      course: 'Web Development Bootcamp',
    },
    {
      id: 'conv-2',
      studentName: 'Michael Chen',
      lastMessage: 'Could you explain the async/await concept again?',
      timestamp: '2 hours ago',
      unread: true,
      starred: true,
      course: 'JavaScript Mastery',
    },
    {
      id: 'conv-3',
      studentName: 'Sarah Johnson',
      lastMessage: 'I completed all the exercises. Ready for review!',
      timestamp: '5 hours ago',
      unread: false,
      starred: false,
      course: 'React Fundamentals',
    },
    {
      id: 'conv-4',
      studentName: 'David Park',
      lastMessage: 'When is the next live Q&A session?',
      timestamp: 'Yesterday',
      unread: false,
      starred: true,
      course: 'Python for Data Science',
    },
    {
      id: 'conv-5',
      studentName: 'Lisa Anderson',
      lastMessage: 'Great course! Just finished module 3.',
      timestamp: '2 days ago',
      unread: false,
      starred: false,
      course: 'Web Development Bootcamp',
    },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'conv-1': [
      {
        id: 'msg-1',
        content: 'Hi! I just submitted my assignment for module 5. Could you take a look when you have time?',
        timestamp: '9:30 AM',
        isFromCoach: false,
      },
      {
        id: 'msg-2',
        content: 'Hi Emma! I reviewed your assignment and left detailed feedback. You did an excellent job with the implementation. Keep up the great work!',
        timestamp: '10:15 AM',
        isFromCoach: true,
      },
      {
        id: 'msg-3',
        content: 'Thank you for the feedback on my assignment!',
        timestamp: '10:20 AM',
        isFromCoach: false,
      },
    ],
    'conv-2': [
      {
        id: 'msg-4',
        content: 'Hi! I\'m having trouble understanding async/await in JavaScript.',
        timestamp: 'Yesterday 3:00 PM',
        isFromCoach: false,
      },
      {
        id: 'msg-5',
        content: 'Could you explain the async/await concept again?',
        timestamp: 'Today 8:00 AM',
        isFromCoach: false,
      },
    ],
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isFromCoach: true,
    };

    setMessages(prev => ({
      ...prev,
      [selectedConversation]: [...(prev[selectedConversation] || []), newMessage],
    }));

    // Update conversation last message
    setConversations(prev =>
      prev.map(conv =>
        conv.id === selectedConversation
          ? { ...conv, lastMessage: messageInput, timestamp: 'Just now', unread: false }
          : conv
      )
    );

    window.alert(`💬 Message Sent\n\n📨 Delivered to: ${conversations.find(c => c.id === selectedConversation)?.studentName}\n\n✅ Message Details:\n• Sent: ${new Date().toLocaleTimeString()}\n• Status: Delivered\n• Read receipt: Enabled\n\n📱 Student Notification:\n• Email: Sent\n• In-app: Delivered\n• Push notification: Sent\n\n💡 Students typically respond within 2-4 hours during business days.`);

    setMessageInput('');
  };

  const handleStarConversation = (conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, starred: !conv.starred } : conv
      )
    );
    const conv = conversations.find(c => c.id === conversationId);
    window.alert(`${conv?.starred ? '☆' : '⭐'} Conversation ${conv?.starred ? 'Unstarred' : 'Starred'}\n\nStudent: ${conv?.studentName}\n\n${conv?.starred ? '• Removed from starred messages\n• Still accessible in all messages' : '• Added to starred messages\n• Quick access from starred filter\n• Never auto-archived'}\n\n💡 Star important conversations for easy access.`);
  };

  const handleArchiveConversation = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    window.alert(`📦 Archive Conversation\n\nStudent: ${conv?.studentName}\nCourse: ${conv?.course}\n\n✅ Archiving:\n• Conversation moved to archive\n• Removed from main inbox\n• Can be restored anytime\n• Student can still message you\n\n📬 New messages will automatically unarchive this conversation.\n\n💡 Archive old conversations to keep your inbox organized.`);
    
    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation === conversationId) {
      setSelectedConversation(null);
    }
  };

  const handleAttachment = () => {
    window.alert(`📎 Attach Files\n\n📤 Supported Attachments:\n• Documents: PDF, DOC, DOCX, TXT\n• Images: JPG, PNG, GIF, SVG\n• Spreadsheets: XLS, XLSX, CSV\n• Presentations: PPT, PPTX\n• Code files: All common formats\n\n📏 File Limits:\n• Max file size: 25 MB\n• Max files per message: 5\n• Total storage: Unlimited\n\n✅ Files are:\n• Scanned for viruses\n• Encrypted in transit\n• Stored securely\n• Available for 90 days\n\n💡 Use attachments to share resources, feedback, and supplementary materials.`);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv.course && conv.course.toLowerCase().includes(searchQuery.toLowerCase()));
    
    if (filterTab === 'unread') return matchesSearch && conv.unread;
    if (filterTab === 'starred') return matchesSearch && conv.starred;
    return matchesSearch;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  return (
    <CoachAppLayout>
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-96 border-r border-slate-200 dark:border-gray-700 flex flex-col bg-white dark:bg-dark-background-card">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-gray-700">
            <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary mb-4">Messages</h1>
            
            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-50 dark:bg-gray-800 rounded-lg border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Filter Tabs */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilterTab('all')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterTab === 'all'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-slate-600 dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
              >
                All ({conversations.length})
              </button>
              <button
                onClick={() => setFilterTab('unread')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterTab === 'unread'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-slate-600 dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
              >
                Unread ({conversations.filter(c => c.unread).length})
              </button>
              <button
                onClick={() => setFilterTab('starred')}
                className={`flex-1 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filterTab === 'starred'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                    : 'text-slate-600 dark:text-dark-text-secondary hover:bg-slate-100 dark:hover:bg-gray-800'
                }`}
              >
                <Star className="w-4 h-4 inline mr-1" />
                {conversations.filter(c => c.starred).length}
              </button>
            </div>
          </div>

          {/* Conversations */}
          <div className="flex-1 overflow-y-auto">
            {filteredConversations.map(conv => (
              <div
                key={conv.id}
                onClick={() => setSelectedConversation(conv.id)}
                className={`p-4 border-b border-slate-200 dark:border-gray-700 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-gray-800 ${
                  selectedConversation === conv.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                }`}
              >
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold">
                      {conv.studentName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${conv.unread ? 'text-slate-900 dark:text-dark-text-primary' : 'text-slate-700 dark:text-dark-text-secondary'}`}>
                          {conv.studentName}
                        </h3>
                        {conv.starred && <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />}
                      </div>
                      {conv.course && (
                        <p className="text-xs text-slate-500 dark:text-dark-text-muted">{conv.course}</p>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 dark:text-dark-text-muted">{conv.timestamp}</span>
                </div>
                <p className={`text-sm ${conv.unread ? 'text-slate-900 dark:text-dark-text-primary font-medium' : 'text-slate-600 dark:text-dark-text-secondary'} truncate`}>
                  {conv.lastMessage}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Message Thread */}
        <div className="flex-1 flex flex-col bg-slate-50 dark:bg-dark-background">
          {selectedConv ? (
            <>
              {/* Thread Header */}
              <div className="p-6 bg-white dark:bg-dark-background-card border-b border-slate-200 dark:border-gray-700 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white font-semibold text-lg">
                    {selectedConv.studentName.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary">{selectedConv.studentName}</h2>
                    {selectedConv.course && (
                      <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{selectedConv.course}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleStarConversation(selectedConv.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title={selectedConv.starred ? 'Unstar' : 'Star'}
                  >
                    <Star className={`w-5 h-5 ${selectedConv.starred ? 'text-yellow-500 fill-yellow-500' : 'text-slate-400'}`} />
                  </button>
                  <button
                    onClick={() => handleArchiveConversation(selectedConv.id)}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                    title="Archive"
                  >
                    <Archive className="w-5 h-5 text-slate-400" />
                  </button>
                  <button className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors">
                    <MoreVertical className="w-5 h-5 text-slate-400" />
                  </button>
                </div>
              </div>

              {/* Messages */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                {conversationMessages.map(message => (
                  <div
                    key={message.id}
                    className={`flex ${message.isFromCoach ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-lg ${message.isFromCoach ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.isFromCoach
                            ? 'bg-blue-600 text-white'
                            : 'bg-white dark:bg-dark-background-card text-slate-900 dark:text-dark-text-primary border border-slate-200 dark:border-gray-700'
                        }`}
                      >
                        <p className="text-sm leading-relaxed">{message.content}</p>
                        {message.attachments && (
                          <div className="mt-2 space-y-1">
                            {message.attachments.map((att, idx) => (
                              <div key={idx} className="flex items-center gap-2 text-xs opacity-90">
                                <Paperclip className="w-3 h-3" />
                                <span>{att.name}</span>
                                <span>({att.size})</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                      <p className={`text-xs text-slate-500 dark:text-dark-text-muted mt-1 ${message.isFromCoach ? 'text-right' : 'text-left'}`}>
                        {message.timestamp}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Message Input */}
              <div className="p-6 bg-white dark:bg-dark-background-card border-t border-slate-200 dark:border-gray-700">
                <div className="flex items-end gap-3">
                  <button
                    onClick={handleAttachment}
                    className="p-2 hover:bg-slate-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                  >
                    <Paperclip className="w-5 h-5 text-slate-400" />
                  </button>
                  <div className="flex-1">
                    <textarea
                      value={messageInput}
                      onChange={(e) => setMessageInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Type your message..."
                      rows={3}
                      className="w-full px-4 py-3 bg-slate-50 dark:bg-gray-800 rounded-xl border border-slate-200 dark:border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!messageInput.trim()}
                    className="p-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
                <p className="text-xs text-slate-500 dark:text-dark-text-muted mt-2">
                  Press Enter to send, Shift + Enter for new line
                </p>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <div className="w-20 h-20 mx-auto mb-4 bg-slate-200 dark:bg-gray-800 rounded-full flex items-center justify-center">
                  <Send className="w-10 h-10 text-slate-400" />
                </div>
                <h3 className="text-xl font-semibold text-slate-900 dark:text-dark-text-primary mb-2">Select a conversation</h3>
                <p className="text-slate-600 dark:text-dark-text-secondary">Choose a student from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </CoachAppLayout>
  );
};

export default CoachMessagesPage;
