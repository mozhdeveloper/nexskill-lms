import React from 'react';

interface GroupSession {
  id: string;
  title: string;
  courseName: string;
  dateTime: string;
  registeredStudents: number;
  maxCapacity: number;
  status: 'Upcoming' | 'In Progress' | 'Completed' | 'Cancelled';
}

interface GroupSessionsListProps {
  sessions: GroupSession[];
  onViewDetails?: (sessionId: string) => void;
}

const GroupSessionsList: React.FC<GroupSessionsListProps> = ({ sessions, onViewDetails }) => {
  const getStatusColor = (status: GroupSession['status']) => {
    switch (status) {
      case 'Upcoming':
        return 'bg-blue-100 text-blue-700';
      case 'In Progress':
        return 'bg-green-100 text-green-700';
      case 'Completed':
        return 'bg-slate-100 text-slate-700';
      case 'Cancelled':
        return 'bg-gray-100 text-gray-500';
      default:
        return 'bg-gray-100 text-gray-500';
    }
  };

  return (
    <div className="space-y-3">
      {sessions.map((session) => (
        <div
          key={session.id}
          className="bg-white rounded-xl p-5 border border-[#EDF0FB] hover:shadow-md transition-all"
        >
          <div className="flex items-start justify-between gap-4 mb-3">
            <div className="flex-1">
              <h4 className="text-base font-semibold text-text-primary mb-1">{session.title}</h4>
              <p className="text-sm text-text-secondary">{session.courseName}</p>
            </div>
            <span
              className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(
                session.status
              )}`}
            >
              {session.status}
            </span>
          </div>

          <div className="flex items-center gap-6 mb-4">
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>📅</span>
              <span>{session.dateTime}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-text-secondary">
              <span>👥</span>
              <span>
                {session.registeredStudents} / {session.maxCapacity} students
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex-1">
              {session.status === 'Upcoming' && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg p-2">
                  <p className="text-xs text-amber-800">
                    ⏰ Prepare materials and review student questions before the session
                  </p>
                </div>
              )}
            </div>
            <button
              onClick={() => onViewDetails?.(session.id)}
              className="ml-4 text-sm text-teal-600 hover:text-teal-700 font-medium"
            >
              View Details →
            </button>
          </div>
        </div>
      ))}

      {sessions.length === 0 && (
        <div className="bg-white rounded-2xl p-12 text-center border border-[#EDF0FB]">
          <div className="text-4xl mb-3">📅</div>
          <p className="text-text-primary font-medium mb-1">No sessions scheduled</p>
          <p className="text-sm text-text-muted">Your supervising coach will assign sessions</p>
        </div>
      )}
    </div>
  );
};

export default GroupSessionsList;
