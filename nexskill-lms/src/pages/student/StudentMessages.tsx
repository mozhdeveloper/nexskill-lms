import React, { useState } from 'react';
import StudentAppLayout from '../../layouts/StudentAppLayout';
import { Search, Send, Archive, Star, MoreVertical, Paperclip, Plus } from 'lucide-react';

interface Conversation {
  id: string;
  coachName: string;
  coachAvatar?: string;
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
  isFromStudent: boolean;
  attachments?: Array<{ name: string; size: string; type: string }>;
}

const StudentMessages: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [messageInput, setMessageInput] = useState('');
  const [filterTab, setFilterTab] = useState<'all' | 'unread' | 'starred'>('all');
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);

  const [conversations, setConversations] = useState<Conversation[]>([
    {
      id: 'conv-1',
      coachName: 'Sarah Johnson',
      lastMessage: 'Hi Alex! How are you progressing with the React hooks assignment?',
      timestamp: '10 min ago',
      unread: true,
      starred: false,
      course: 'React Fundamentals',
    },
    {
      id: 'conv-2',
      coachName: 'Mike Chen',
      lastMessage: 'Your JavaScript project looks great! Just a few suggestions...',
      timestamp: '2 hours ago',
      unread: true,
      starred: true,
      course: 'JavaScript Mastery',
    },
    {
      id: 'conv-3',
      coachName: 'Emma Wilson',
      lastMessage: 'Thanks for submitting your design portfolio. I\'ll review it today.',
      timestamp: '5 hours ago',
      unread: false,
      starred: false,
      course: 'UI/UX Design',
    },
    {
      id: 'conv-4',
      coachName: 'David Park',
      lastMessage: 'The next live session is scheduled for tomorrow at 3 PM.',
      timestamp: 'Yesterday',
      unread: false,
      starred: true,
      course: 'Python for Data Science',
    },
  ]);

  const [messages, setMessages] = useState<Record<string, Message[]>>({
    'conv-1': [
      {
        id: 'msg-1',
        content: 'Hi Coach Sarah! I\'m working on the React hooks assignment and have a question about useEffect.',
        timestamp: '9:30 AM',
        isFromStudent: true,
      },
      {
        id: 'msg-2',
        content: 'Hi Alex! Happy to help. What specifically are you struggling with regarding useEffect?',
        timestamp: '10:15 AM',
        isFromStudent: false,
      },
      {
        id: 'msg-3',
        content: 'Hi Alex! How are you progressing with the React hooks assignment?',
        timestamp: '10:20 AM',
        isFromStudent: false,
      },
    ],
    'conv-2': [
      {
        id: 'msg-4',
        content: 'Hi Coach Mike! I submitted my JavaScript project. Could you review it?',
        timestamp: 'Yesterday 3:00 PM',
        isFromStudent: true,
      },
      {
        id: 'msg-5',
        content: 'Your JavaScript project looks great! Just a few suggestions...',
        timestamp: 'Today 8:00 AM',
        isFromStudent: false,
      },
    ],
  });

  const handleSendMessage = () => {
    if (!messageInput.trim() || !selectedConversation) return;

    const newMessage: Message = {
      id: `msg-${Date.now()}`,
      content: messageInput,
      timestamp: new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
      isFromStudent: true,
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

    window.alert(`💬 Message Sent\n\n📨 Delivered to: ${conversations.find(c => c.id === selectedConversation)?.coachName}\n\n✅ Message Details:\n• Sent: ${new Date().toLocaleTimeString()}\n• Status: Delivered\n• Read receipt: Enabled\n\n📱 Coach Notification:\n• Email: Sent\n• In-app: Delivered\n• Push notification: Sent\n\n💡 Coaches typically respond within 2-4 hours during business days.`);

    setMessageInput('');
  };

  const handleStarConversation = (conversationId: string) => {
    setConversations(prev =>
      prev.map(conv =>
        conv.id === conversationId ? { ...conv, starred: !conv.starred } : conv
      )
    );
    const conv = conversations.find(c => c.id === conversationId);
    window.alert(`${conv?.starred ? '☆' : '⭐'} Conversation ${conv?.starred ? 'Unstarred' : 'Starred'}\n\nCoach: ${conv?.coachName}\n\n${conv?.starred ? '• Removed from starred messages\n• Still accessible in all messages' : '• Added to starred messages\n• Quick access from starred filter\n• Never auto-archived'}\n\n💡 Star important conversations for easy access.`);
  };

  const handleArchiveConversation = (conversationId: string) => {
    const conv = conversations.find(c => c.id === conversationId);
    window.alert(`📦 Archive Conversation\n\nCoach: ${conv?.coachName}\nCourse: ${conv?.course}\n\n✅ Archiving:\n• Conversation moved to archive\n• Removed from main inbox\n• Can be restored anytime\n• Coach can still message you\n\n📬 New messages will automatically unarchive this conversation.\n\n💡 Archive old conversations to keep your inbox organized.`);

    setConversations(prev => prev.filter(c => c.id !== conversationId));
    if (selectedConversation === conversationId) {
      setSelectedConversation(null);
    }
  };

  const handleAttachment = () => {
    window.alert(`📎 Attach Files\n\n📤 Supported Attachments:\n• Documents: PDF, DOC, DOCX, TXT\n• Images: JPG, PNG, GIF, SVG\n• Spreadsheets: XLS, XLSX, CSV\n• Presentations: PPT, PPTX\n• Code files: All common formats\n\n📏 File Limits:\n• Max file size: 25 MB\n• Max files per message: 5\n• Total storage: Unlimited\n\n✅ Files are:\n• Scanned for viruses\n• Encrypted in transit\n• Stored securely\n• Available for 90 days\n\n💡 Use attachments to share resources, feedback, and supplementary materials.`);
  };

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.coachName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         (conv.course && conv.course.toLowerCase().includes(searchQuery.toLowerCase()));

    if (filterTab === 'unread') return matchesSearch && conv.unread;
    if (filterTab === 'starred') return matchesSearch && conv.starred;
    return matchesSearch;
  });

  const selectedConv = conversations.find(c => c.id === selectedConversation);
  const conversationMessages = selectedConversation ? messages[selectedConversation] || [] : [];

  const handleStartNewConversation = () => {
    setShowNewConversationModal(true);
  };

  return (
    <StudentAppLayout>
      <div className="flex-1 flex overflow-hidden">
        {/* Conversations List */}
        <div className="w-96 border-r border-slate-200 dark:border-gray-700 flex flex-col bg-white dark:bg-dark-background-card">
          {/* Header */}
          <div className="p-6 border-b border-slate-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <h1 className="text-2xl font-bold text-slate-900 dark:text-dark-text-primary">Messages</h1>
              <button
                onClick={handleStartNewConversation}
                className="p-2 bg-blue-500 hover:bg-blue-600 text-white rounded-full transition-colors shadow-lg hover:shadow-xl"
                title="Start new conversation"
              >
                <Plus className="w-5 h-5" />
              </button>
            </div>

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
                      {conv.coachName.split(' ').map(n => n[0]).join('')}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className={`font-semibold ${conv.unread ? 'text-slate-900 dark:text-dark-text-primary' : 'text-slate-700 dark:text-dark-text-secondary'}`}>
                          {conv.coachName}
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
                    {selectedConv.coachName.split(' ').map((n: string) => n[0]).join('')}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary">{selectedConv.coachName}</h2>
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
                    className={`flex ${message.isFromStudent ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-lg ${message.isFromStudent ? 'order-2' : 'order-1'}`}>
                      <div
                        className={`rounded-2xl px-4 py-3 ${
                          message.isFromStudent
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
                      <p className={`text-xs text-slate-500 dark:text-dark-text-muted mt-1 ${message.isFromStudent ? 'text-right' : 'text-left'}`}>
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
                <p className="text-slate-600 dark:text-dark-text-secondary">Choose a coach from the list to start messaging</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* New Conversation Modal */}
      {showNewConversationModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-dark-background-card rounded-lg p-6 w-full max-w-md mx-4">
            <h2 className="text-xl font-bold text-slate-900 dark:text-dark-text-primary mb-4">Start New Conversation</h2>
            <p className="text-slate-600 dark:text-dark-text-secondary mb-4">Select a coach to start messaging:</p>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {/* Mock coaches - in real app, this would come from API */}
              {[
                { id: 'coach-1', name: 'Coach Sarah', avatar: 'S', course: 'React Development' },
                { id: 'coach-2', name: 'Coach Mike', avatar: 'M', course: 'JavaScript Fundamentals' },
                { id: 'coach-3', name: 'Coach Emily', avatar: 'E', course: 'Advanced React' },
              ].map(coach => (
                <button
                  key={coach.id}
                  onClick={() => {
                    // Create new conversation
                    const newConvId = `conv-${Date.now()}`;
                    const newConversation: Conversation = {
                      id: newConvId,
                      coachName: coach.name,
                      coachAvatar: coach.avatar,
                      lastMessage: 'New conversation started',
                      timestamp: 'Just now',
                      unread: false,
                      starred: false,
                      course: coach.course,
                    };

                    setConversations(prev => [newConversation, ...prev]);
                    setSelectedConversation(newConvId);
                    setMessages(prev => ({
                      ...prev,
                      [newConvId]: [],
                    }));
                    setShowNewConversationModal(false);
                  }}
                  className="w-full p-3 text-left hover:bg-slate-50 dark:hover:bg-gray-800 rounded-lg transition-colors flex items-center gap-3"
                >
                  <div className="w-10 h-10 bg-blue-500 text-white rounded-full flex items-center justify-center font-semibold">
                    {coach.avatar}
                  </div>
                  <div>
                    <p className="font-medium text-slate-900 dark:text-dark-text-primary">{coach.name}</p>
                    <p className="text-sm text-slate-600 dark:text-dark-text-secondary">{coach.course}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="flex gap-3 mt-6">
              <button
                onClick={() => setShowNewConversationModal(false)}
                className="flex-1 px-4 py-2 border border-slate-300 dark:border-gray-600 text-slate-700 dark:text-dark-text-primary rounded-lg hover:bg-slate-50 dark:hover:bg-gray-800 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </StudentAppLayout>
  );
};

export default StudentMessages;
