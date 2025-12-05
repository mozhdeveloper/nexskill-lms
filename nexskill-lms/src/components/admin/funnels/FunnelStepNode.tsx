import React from 'react';

interface FunnelStep {
  id: string;
  type: 'entry' | 'page' | 'email' | 'checkout' | 'webhook' | 'end';
  label: string;
  variantKey?: 'A' | 'B';
  position: { x: number; y: number };
  settings?: Record<string, any>;
}

interface FunnelStepNodeProps {
  step: FunnelStep;
  selected: boolean;
  onClick: () => void;
  onMouseDown: (event: React.MouseEvent) => void;
}

const FunnelStepNode: React.FC<FunnelStepNodeProps> = ({
  step,
  selected,
  onClick,
  onMouseDown,
}) => {
  const getTypeBadgeStyle = (type: FunnelStep['type']) => {
    switch (type) {
      case 'entry':
        return 'bg-[#22C55E]/10 text-[#22C55E] border-[#22C55E]/20';
      case 'page':
        return 'bg-[#5E7BFF]/10 text-[#304DB5] border-[#5E7BFF]/20';
      case 'email':
        return 'bg-[#A78BFA]/10 text-[#7C3AED] border-[#A78BFA]/20';
      case 'checkout':
        return 'bg-[#F59E0B]/10 text-[#D97706] border-[#F59E0B]/20';
      case 'webhook':
        return 'bg-[#38BDF8]/10 text-[#0284C7] border-[#38BDF8]/20';
      case 'end':
        return 'bg-[#EF4444]/10 text-[#EF4444] border-[#EF4444]/20';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getTypeIcon = (type: FunnelStep['type']) => {
    switch (type) {
      case 'entry':
        return '🚪';
      case 'page':
        return '📄';
      case 'email':
        return '📧';
      case 'checkout':
        return '💳';
      case 'webhook':
        return '🔗';
      case 'end':
        return '✅';
      default:
        return '📍';
    }
  };

  return (
    <div
      className={`absolute cursor-move select-none transition-all duration-200 ${
        selected ? 'z-20' : 'z-10'
      }`}
      style={{
        left: `${step.position.x}px`,
        top: `${step.position.y}px`,
        transform: selected ? 'scale(1.05)' : 'scale(1)',
      }}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      onMouseDown={onMouseDown}
    >
      <div
        className={`bg-white rounded-xl shadow-md border-2 px-4 py-3 min-w-[180px] hover:shadow-lg transition-all ${
          selected
            ? 'border-[#304DB5] shadow-[0_0_0_4px_rgba(48,77,181,0.1)]'
            : 'border-white hover:border-[#E0E5FF]'
        }`}
      >
        {/* Type Badge */}
        <div className="flex items-center justify-between mb-2">
          <span
            className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold border capitalize ${getTypeBadgeStyle(
              step.type
            )}`}
          >
            <span>{getTypeIcon(step.type)}</span>
            {step.type}
          </span>
          
          {/* Drag Handle Indicator */}
          <div className="text-[#9CA3B5] text-xs opacity-0 group-hover:opacity-100 transition-opacity">
            <svg
              width="16"
              height="16"
              viewBox="0 0 16 16"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <circle cx="4" cy="4" r="1.5" fill="currentColor" />
              <circle cx="12" cy="4" r="1.5" fill="currentColor" />
              <circle cx="4" cy="8" r="1.5" fill="currentColor" />
              <circle cx="12" cy="8" r="1.5" fill="currentColor" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" />
              <circle cx="12" cy="12" r="1.5" fill="currentColor" />
            </svg>
          </div>
        </div>

        {/* Label */}
        <p className="text-sm font-semibold text-[#111827] leading-tight">
          {step.label}
        </p>

        {/* Connection Points */}
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#304DB5] rounded-full border-2 border-white" />
        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-3 h-3 bg-[#304DB5] rounded-full border-2 border-white" />
      </div>
    </div>
  );
};

export default FunnelStepNode;
