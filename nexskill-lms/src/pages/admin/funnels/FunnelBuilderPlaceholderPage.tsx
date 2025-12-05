import React from 'react';
import { useParams } from 'react-router-dom';
import AdminAppLayout from '../../../layouts/AdminAppLayout';

const FunnelBuilderPlaceholderPage: React.FC = () => {
  const { funnelId } = useParams<{ funnelId: string }>();

  return (
    <AdminAppLayout>
      <div className="max-w-4xl mx-auto px-8 py-16 text-center">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-[#304DB5] to-[#5E7BFF] flex items-center justify-center text-6xl shadow-2xl">
            🚧
          </div>
        </div>

        {/* Title */}
        <h1 className="text-4xl font-bold text-[#111827] mb-4">
          Funnel Builder Coming Soon
        </h1>

        {/* Description */}
        <p className="text-lg text-[#5F6473] mb-6">
          You're viewing the placeholder for funnel:{' '}
          <span className="font-mono font-semibold text-[#304DB5]">{funnelId}</span>
        </p>

        {/* Info Card */}
        <div className="bg-white rounded-2xl shadow-md p-8 max-w-2xl mx-auto space-y-4 text-left">
          <h2 className="text-xl font-bold text-[#111827] mb-3">
            What's Coming Next:
          </h2>
          <ul className="space-y-3 text-[#5F6473]">
            <li className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <span>
                <strong className="text-[#111827]">Drag-and-drop canvas</strong> to design
                funnel steps visually
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <span>
                <strong className="text-[#111827]">Step configuration</strong> for landing pages,
                forms, emails, and more
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <span>
                <strong className="text-[#111827]">Conditional logic</strong> to create dynamic
                user journeys
              </span>
            </li>
            <li className="flex items-start gap-3">
              <span className="text-xl">✅</span>
              <span>
                <strong className="text-[#111827]">Analytics integration</strong> to track
                performance at every step
              </span>
            </li>
          </ul>
        </div>

        {/* Note */}
        <p className="mt-8 text-sm text-[#9CA3B5] italic">
          This will be implemented in the next development phase (items 154–157).
        </p>
      </div>
    </AdminAppLayout>
  );
};

export default FunnelBuilderPlaceholderPage;
