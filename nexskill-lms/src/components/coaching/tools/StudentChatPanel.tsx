import React, { useState, useRef, useEffect } from 'react';

interface Message {
  id: string;
  sender: 'coach' | 'student';
  text: string;
  timestamp: string;
}

interface Student {
  id: string;
  name: string;
  avatar: string;
  lastMessage: string;
  unreadCount: number;
}

const StudentChatPanel: React.FC = () => {
  const [students] = useState<Student[]>([
    {
      id: 'student-1',
      name: 'Emma Wilson',
      avatar: '👩',
      lastMessage: 'Thank you for the session!',
      unreadCount: 0,
    },
    {
      id: 'student-2',
      name: 'James Chen',
      avatar: '👨',
      lastMessage: 'When is our next meeting?',
      unreadCount: 2,
    },
    {
      id: 'student-3',
      name: 'Sophia Martinez',
      avatar: '👩‍🦱',
      lastMessage: 'I have a question about Module 3',
      unreadCount: 1,
    },
    {
      id: 'student-4',
      name: 'Liam Brown',
      avatar: '👨‍🦰',
      lastMessage: 'Great advice, will implement!',
      unreadCount: 0,
    },
  ]);

  const [selectedStudent, setSelectedStudent] = useState<Student | null>(students[1]);
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'msg-1',
      sender: 'student',
      text: 'Hi coach! I really enjoyed our last session.',
      timestamp: '10:30 AM',
    },
    {
      id: 'msg-2',
      sender: 'coach',
      text:"I'm glad you found it helpful! How are you progressing with the action items?",
      timestamp: '10:32 AM',
    },
    {
      id: 'msg-3',
      sender: 'student',
      text:"I've completed 2 out of 3. Still working on the marketing plan.",
      timestamp: '10:35 AM',
    },
    {
      id: 'msg-4',
      sender: 'coach',
      text: 'Great progress! Let me know if you need any guidance on the marketing plan.',
      timestamp: '10:36 AM',
    },
    {
      id: 'msg-5',
      sender: 'student',
      text: 'When is our next meeting?',
      timestamp: '11:45 AM',
    },
  ]);

  const [newMessage, setNewMessage] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !selectedStudent) return;

    const message: Message = {
      id: `msg-${Date.now()}`,
      sender: 'coach',
      text: newMessage,
      timestamp: new Date().toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
    };

    setMessages([...messages, message]);
    setNewMessage('');
    console.log('Message sent:', message);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const filteredStudents = students.filter((student) =>
    student.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const scheduleSession = () => {
    if (!selectedStudent) return;
    console.log('Scheduling session with:', selectedStudent.name);
    alert(`Schedule a session with ${selectedStudent.name}`);
  };

  const viewProfile = () => {
    if (!selectedStudent) return;
    console.log('Viewing profile:', selectedStudent.name);
    alert(`View ${selectedStudent.name}'s profile`);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h3 className="text-2xl font-bold text-[#111827]">Student Chat</h3>
        <p className="text-sm text-[#5F6473] mt-1">
          Message your students directly and stay connected
        </p>
      </div>

      {/* Chat Container */}
      <div className="bg-white rounded-2xl border border-[#EDF0FB] overflow-hidden shadow-lg">
        <div className="grid grid-cols-12 h-[600px]">
          {/* Students List - Left Sidebar */}
          <div className="col-span-12 md:col-span-4 border-r border-[#EDF0FB] flex flex-col">
            {/* Search */}
            <div className="p-4 border-b border-[#EDF0FB]">
              <input
                type="text"
                placeholder="Search students..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5]"
              />
            </div>

            {/* Students List */}
            <div className="flex-1 overflow-y-auto">
              {filteredStudents.map((student) => (
                <div
                  key={student.id}
                  onClick={() => setSelectedStudent(student)}
                  className={`p-4 cursor-pointer hover:bg-[#F5F7FF] transition-colors border-b border-[#EDF0FB] ${
                    selectedStudent?.id === student.id ? 'bg-[#F5F7FF]' : ''
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-2xl">
                        {student.avatar}
                      </div>
                      {student.unreadCount > 0 && (
                        <div className="absolute -top-1 -right-1 w-6 h-6 bg-[#F97316] rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {student.unreadCount}
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <p className="font-semibold text-[#111827] truncate">{student.name}</p>
                      </div>
                      <p className="text-sm text-[#9CA3B5] truncate">{student.lastMessage}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Chat Area - Right */}
          <div className="col-span-12 md:col-span-8 flex flex-col">
            {selectedStudent ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#EDF0FB] flex items-center justify-between bg-gradient-to-r from-[#304DB5] to-[#5E7BFF]">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center text-2xl">
                      {selectedStudent.avatar}
                    </div>
                    <div>
                      <p className="font-semibold text-white">{selectedStudent.name}</p>
                      <p className="text-xs text-white opacity-80">Active now</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={scheduleSession}
                      className="px-4 py-2 bg-white text-[#304DB5] font-medium rounded-full hover:shadow-md transition-all text-sm"
                    >
                      Schedule Session
                    </button>
                    <button
                      onClick={viewProfile}
                      className="px-4 py-2 bg-white bg-opacity-20 text-white font-medium rounded-full hover:bg-opacity-30 transition-all text-sm"
                    >
                      View Profile
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-[#F5F7FF]">
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${
                        message.sender === 'coach' ? 'justify-end' : 'justify-start'
                      }`}
                    >
                      <div
                        className={`max-w-[70%] rounded-2xl px-4 py-3 ${
                          message.sender === 'coach'
                            ? 'bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white'
                            : 'bg-white border border-[#EDF0FB] text-[#111827]'
                        }`}
                      >
                        <p className="text-sm">{message.text}</p>
                        <p
                          className={`text-xs mt-1 ${
                            message.sender === 'coach' ? 'text-white opacity-70' : 'text-[#9CA3B5]'
                          }`}
                        >
                          {message.timestamp}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="p-4 border-t border-[#EDF0FB] bg-white">
                  <div className="flex items-end gap-3">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder="Type your message..."
                      rows={2}
                      className="flex-1 px-4 py-3 rounded-xl border border-[#EDF0FB] focus:outline-none focus:ring-2 focus:ring-[#304DB5] resize-none"
                    />
                    <button
                      onClick={sendMessage}
                      disabled={!newMessage.trim()}
                      className="px-6 py-3 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white font-semibold rounded-full hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Send
                    </button>
                  </div>
                  <p className="text-xs text-[#9CA3B5] mt-2">Press Enter to send, Shift+Enter for new line</p>
                </div>
              </>
            ) : (
              /* No Student Selected */
              <div className="flex-1 flex items-center justify-center bg-[#F5F7FF]">
                <div className="text-center">
                  <div className="text-6xl mb-4">💬</div>
                  <p className="text-lg text-[#5F6473] mb-2">No conversation selected</p>
                  <p className="text-sm text-[#9CA3B5]">
                    Choose a student from the list to start chatting
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] rounded-2xl p-6 text-white">
        <h4 className="font-bold mb-2">💡 Chat Tips</h4>
        <ul className="text-sm space-y-1 opacity-90">
          <li>• Use chat for quick questions and check-ins between sessions</li>
          <li>• Schedule a session directly from the chat for in-depth discussions</li>
          <li>• Keep professional boundaries and response times reasonable</li>
        </ul>
      </div>
    </div>
  );
};

export default StudentChatPanel;
