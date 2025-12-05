import React, { useState, useRef } from 'react';
import FunnelStepNode from './FunnelStepNode';

interface FunnelStep {
  id: string;
  type: 'entry' | 'page' | 'email' | 'checkout' | 'webhook' | 'end';
  label: string;
  variantKey?: 'A' | 'B';
  position: { x: number; y: number };
  settings?: Record<string, any>;
}

interface Connection {
  id: string;
  fromStepId: string;
  toStepId: string;
  conditionLabel?: string;
}

interface FunnelBuilderCanvasProps {
  steps: FunnelStep[];
  connections: Connection[];
  selectedStepId: string | null;
  onSelectStep: (stepId: string) => void;
  onAddStep: (type: string) => void;
  onRemoveStep: (stepId: string) => void;
  onUpdateStepPosition: (stepId: string, position: { x: number; y: number }) => void;
}

const FunnelBuilderCanvas: React.FC<FunnelBuilderCanvasProps> = ({
  steps,
  connections,
  selectedStepId,
  onSelectStep,
  onAddStep,
  onRemoveStep,
  onUpdateStepPosition,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [draggedStepId, setDraggedStepId] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [showAddMenu, setShowAddMenu] = useState(false);
  const canvasRef = useRef<HTMLDivElement>(null);

  const handleNodeMouseDown = (stepId: string, event: React.MouseEvent) => {
    event.stopPropagation();
    
    const step = steps.find((s) => s.id === stepId);
    if (!step) return;

    setIsDragging(true);
    setDraggedStepId(stepId);
    setDragOffset({
      x: event.clientX - step.position.x,
      y: event.clientY - step.position.y,
    });
  };

  const handleMouseMove = (event: React.MouseEvent) => {
    if (!isDragging || !draggedStepId || !canvasRef.current) return;

    const canvasRect = canvasRef.current.getBoundingClientRect();
    const newX = event.clientX - canvasRect.left - dragOffset.x;
    const newY = event.clientY - canvasRect.top - dragOffset.y;

    // Constrain within canvas bounds
    const constrainedX = Math.max(0, Math.min(newX, canvasRect.width - 200));
    const constrainedY = Math.max(0, Math.min(newY, canvasRect.height - 100));

    onUpdateStepPosition(draggedStepId, { x: constrainedX, y: constrainedY });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setDraggedStepId(null);
  };

  const handleCanvasClick = () => {
    onSelectStep(''); // Deselect when clicking canvas background
  };

  const handleAddStep = (type: string) => {
    onAddStep(type);
    setShowAddMenu(false);
  };

  const handleDeleteSelected = () => {
    if (selectedStepId) {
      onRemoveStep(selectedStepId);
    }
  };

  // Draw connection lines
  const renderConnections = () => {
    return connections.map((connection) => {
      const fromStep = steps.find((s) => s.id === connection.fromStepId);
      const toStep = steps.find((s) => s.id === connection.toStepId);

      if (!fromStep || !toStep) return null;

      const fromX = fromStep.position.x + 90; // center of node (approx)
      const fromY = fromStep.position.y + 50; // bottom of node
      const toX = toStep.position.x + 90;
      const toY = toStep.position.y;

      const midY = (fromY + toY) / 2;

      return (
        <svg
          key={connection.id}
          className="absolute inset-0 pointer-events-none"
          style={{ width: '100%', height: '100%' }}
        >
          <path
            d={`M ${fromX} ${fromY} L ${fromX} ${midY} L ${toX} ${midY} L ${toX} ${toY}`}
            stroke="#9CA3B5"
            strokeWidth="2"
            fill="none"
            strokeDasharray={connection.conditionLabel ? '5,5' : '0'}
          />
          {/* Arrow head */}
          <polygon
            points={`${toX},${toY} ${toX - 5},${toY - 8} ${toX + 5},${toY - 8}`}
            fill="#9CA3B5"
          />
          {connection.conditionLabel && (
            <text
              x={(fromX + toX) / 2}
              y={midY - 10}
              fill="#5F6473"
              fontSize="12"
              textAnchor="middle"
              className="font-medium"
            >
              {connection.conditionLabel}
            </text>
          )}
        </svg>
      );
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="bg-white rounded-xl shadow-sm border border-[#EDF0FB] p-3 mb-4 flex items-center justify-between">
        {/* Left: Add Step */}
        <div className="flex items-center gap-3">
          <div className="relative">
            <button
              onClick={() => setShowAddMenu(!showAddMenu)}
              className="px-4 py-2 bg-gradient-to-r from-[#304DB5] to-[#5E7BFF] text-white text-sm font-semibold rounded-full hover:shadow-lg transition-all"
            >
              + Add Step
            </button>
            
            {showAddMenu && (
              <div className="absolute top-full left-0 mt-2 bg-white rounded-xl shadow-lg border border-[#EDF0FB] py-2 min-w-[160px] z-30">
                <button
                  onClick={() => handleAddStep('entry')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F7FF] transition-colors flex items-center gap-2"
                >
                  <span>🚪</span> Entry
                </button>
                <button
                  onClick={() => handleAddStep('page')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F7FF] transition-colors flex items-center gap-2"
                >
                  <span>📄</span> Page
                </button>
                <button
                  onClick={() => handleAddStep('email')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F7FF] transition-colors flex items-center gap-2"
                >
                  <span>📧</span> Email
                </button>
                <button
                  onClick={() => handleAddStep('checkout')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F7FF] transition-colors flex items-center gap-2"
                >
                  <span>💳</span> Checkout
                </button>
                <button
                  onClick={() => handleAddStep('webhook')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F7FF] transition-colors flex items-center gap-2"
                >
                  <span>🔗</span> Webhook
                </button>
                <button
                  onClick={() => handleAddStep('end')}
                  className="w-full px-4 py-2 text-left text-sm hover:bg-[#F5F7FF] transition-colors flex items-center gap-2"
                >
                  <span>✅</span> End
                </button>
              </div>
            )}
          </div>

          {selectedStepId && (
            <button
              onClick={handleDeleteSelected}
              className="px-4 py-2 bg-[#EF4444]/10 text-[#EF4444] text-sm font-semibold rounded-full hover:bg-[#EF4444]/20 transition-all"
            >
              🗑️ Delete Selected
            </button>
          )}
        </div>

        {/* Right: Utilities */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => console.log('Auto-layout clicked')}
            className="px-4 py-2 bg-[#EDF0FB] text-[#5F6473] text-sm font-semibold rounded-full hover:bg-[#E0E5FF] transition-all"
          >
            ✨ Auto-layout
          </button>
          <div className="flex items-center gap-1 px-3 py-2 bg-[#EDF0FB] rounded-full">
            <button
              onClick={() => console.log('Zoom out')}
              className="w-6 h-6 flex items-center justify-center text-[#5F6473] hover:text-[#304DB5] transition-colors"
              title="Zoom out"
            >
              -
            </button>
            <span className="text-xs text-[#5F6473] px-2">100%</span>
            <button
              onClick={() => console.log('Zoom in')}
              className="w-6 h-6 flex items-center justify-center text-[#5F6473] hover:text-[#304DB5] transition-colors"
              title="Zoom in"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* Canvas Area */}
      <div
        ref={canvasRef}
        className="flex-1 bg-slate-50 rounded-2xl border border-[#EDF0FB] shadow-inner relative overflow-hidden min-h-[600px]"
        style={{
          backgroundImage: `
            linear-gradient(to right, #e5e7eb 1px, transparent 1px),
            linear-gradient(to bottom, #e5e7eb 1px, transparent 1px)
          `,
          backgroundSize: '24px 24px',
        }}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onClick={handleCanvasClick}
      >
        {/* Connection Lines */}
        {renderConnections()}

        {/* Step Nodes */}
        {steps.map((step) => (
          <FunnelStepNode
            key={step.id}
            step={step}
            selected={step.id === selectedStepId}
            onClick={() => onSelectStep(step.id)}
            onMouseDown={(e) => handleNodeMouseDown(step.id, e)}
          />
        ))}

        {/* Empty State */}
        {steps.length === 0 && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="text-center">
              <div className="text-6xl mb-4">🎯</div>
              <h3 className="text-xl font-bold text-[#111827] mb-2">
                Start Building Your Funnel
              </h3>
              <p className="text-[#5F6473]">
                Click"Add Step" to create your first funnel step.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FunnelBuilderCanvas;
