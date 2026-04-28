import React from 'react';
import { useUser } from '../../context/UserContext';
import MultiLanguageSelector from './MultiLanguageSelector';
import DarkModeToggle from './DarkModeToggle';
import NotificationBell from './NotificationBell';
import NotificationBellStudent from './NotificationBellStudent';
import NotificationBellAdmin from './NotificationBellAdmin';

const GlobalTopBarControls: React.FC = () => {
  const { profile } = useUser();
  const role = profile?.role?.toUpperCase();

  return (
    <div className="flex items-center gap-3 flex-wrap">
      {role === 'ADMIN' ? (
        <NotificationBellAdmin />
      ) : role === 'STUDENT' ? (
        <NotificationBellStudent />
      ) : (
        <NotificationBell />
      )}
      <MultiLanguageSelector />
      <DarkModeToggle />
    </div>
  );
};

export default GlobalTopBarControls;
