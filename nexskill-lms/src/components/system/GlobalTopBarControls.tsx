import MultiLanguageSelector from './MultiLanguageSelector';
import DarkModeToggle from './DarkModeToggle';
import NotificationBell from './NotificationBell';

const GlobalTopBarControls: React.FC = () => {
  return (
    <div className="flex items-center gap-3 flex-wrap">
      <NotificationBell />
      <MultiLanguageSelector />
      <DarkModeToggle />
    </div>
  );
};

export default GlobalTopBarControls;
