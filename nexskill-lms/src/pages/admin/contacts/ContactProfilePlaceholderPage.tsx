import React from 'react';
import { useParams, Link } from 'react-router-dom';
import AdminAppLayout from '../../../layouts/AdminAppLayout';

const ContactProfilePlaceholderPage: React.FC = () => {
  const { contactId } = useParams<{ contactId: string }>();

  return (
    <AdminAppLayout>
      <div className="max-w-7xl mx-auto px-8 py-8">
        <div className="bg-white rounded-2xl shadow-md p-8">
          <div className="text-center max-w-2xl mx-auto space-y-6">
            <div className="w-20 h-20 bg-[#E0E5FF] rounded-full flex items-center justify-center mx-auto">
              <span className="text-4xl">👤</span>
            </div>
            
            <div>
              <h1 className="text-2xl font-bold text-[#111827] mb-2">
                Contact Profile
              </h1>
              <p className="text-[#5F6473]">
                This is a placeholder for contact ID: <span className="font-mono text-sm bg-[#F5F7FF] px-2 py-1 rounded">{contactId}</span>
              </p>
            </div>

            <div className="bg-[#F5F7FF] rounded-xl p-6 text-left">
              <p className="text-[#5F6473] text-sm leading-relaxed">
                The detailed contact profile, activity timeline, notes, and ownership workspace 
                will be implemented in a subsequent iteration.
              </p>
              <p className="text-[#5F6473] text-sm leading-relaxed mt-3">
                Future features will include:
              </p>
              <ul className="mt-2 space-y-1 text-[#5F6473] text-sm">
                <li>• Contact information and edit form</li>
                <li>• Activity timeline and interaction history</li>
                <li>• Notes and internal comments</li>
                <li>• Tag management</li>
                <li>• Owner assignment and notifications</li>
              </ul>
            </div>

            <Link
              to="/admin/contacts"
              className="inline-flex items-center gap-2 px-6 py-3 bg-[#304DB5] text-white rounded-full font-semibold hover:bg-[#152457] transition-colors shadow-md hover:shadow-lg"
            >
              <span>←</span>
              Back to contacts
            </Link>
          </div>
        </div>
      </div>
    </AdminAppLayout>
  );
};

export default ContactProfilePlaceholderPage;
