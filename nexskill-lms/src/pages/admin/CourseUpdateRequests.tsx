import React, { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import AdminAppLayout from "../../layouts/AdminAppLayout";

interface PendingUpdate {
  id: string;
  course_id: string;
  course_title: string;
  coach_id: string;
  coach_name: string;
  update_type: string;
  change_description: string;
  priority: string;
  status: string;
  submitted_at: string;
  reviewed_at?: string;
  reviewer_name?: string;
  review_notes?: string;
  rejection_reason?: string;
  module_changes_count: number;
  content_changes_count: number;
}

interface ModuleUpdate {
  id: string;
  module_id?: string;
  action: string;
  title?: string;
  position?: number;
}

interface ContentItemUpdate {
  id: string;
  content_type: string;
  content_id: string;
  action: string;
  title_change?: string;
  position?: number;
}

const CourseUpdateRequests: React.FC = () => {
  const [pendingUpdates, setPendingUpdates] = useState<PendingUpdate[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUpdate, setSelectedUpdate] = useState<PendingUpdate | null>(null);
  const [moduleUpdates, setModuleUpdates] = useState<ModuleUpdate[]>([]);
  const [contentUpdates, setContentUpdates] = useState<ContentItemUpdate[]>([]);
  const [reviewNotes, setReviewNotes] = useState("");
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [processing, setProcessing] = useState(false);

  useEffect(() => {
    fetchPendingUpdates();
  }, []);

  const fetchPendingUpdates = async () => {
    try {
      const { data, error } = await supabase
        .from("pending_updates_with_details")
        .select("*")
        .eq("status", "pending")
        .order("submitted_at", { ascending: false });

      if (error) throw error;
      setPendingUpdates(data || []);
    } catch (err) {
      console.error("Error fetching pending updates:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchUpdateDetails = async (updateId: string) => {
    try {
      const { data: modules, error: moduleError } = await supabase
        .from("pending_module_updates")
        .select("*")
        .eq("pending_update_id", updateId)
        .order("created_at");

      const { data: content, error: contentError } = await supabase
        .from("pending_content_item_updates")
        .select("*")
        .eq("pending_update_id", updateId)
        .order("created_at");

      if (moduleError) throw moduleError;
      if (contentError) throw contentError;

      setModuleUpdates(modules || []);
      setContentUpdates(content || []);
    } catch (err) {
      console.error("Error fetching update details:", err);
    }
  };

  const handleApprove = async () => {
    if (!selectedUpdate) return;

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      // Approve the update
      const { error } = await supabase.rpc("approve_course_update", {
        p_pending_update_id: selectedUpdate.id,
        p_admin_id: user.id,
        p_review_notes: reviewNotes || null,
      });

      if (error) throw error;

      alert("✅ Course update approved! The new curriculum is now visible to students.");
      setSelectedUpdate(null);
      setReviewNotes("");
      fetchPendingUpdates();
    } catch (err: any) {
      console.error("Error approving update:", err);
      alert("Failed to approve: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  // Helper function to manually fix curriculum publishing
  const handleFixCurriculum = async (courseId: string) => {
    try {
      // Publish all modules
      await supabase
        .from("modules")
        .update({ content_status: 'published' })
        .eq("course_id", courseId);

      // Publish all content items
      const { data: modules } = await supabase
        .from("modules")
        .select("id")
        .eq("course_id", courseId);

      if (modules && modules.length > 0) {
        const moduleIds = modules.map(m => m.id);

        await supabase
          .from("module_content_items")
          .update({ content_status: 'published' })
          .in("module_id", moduleIds);

        // Publish all lessons
        await supabase
          .from("lessons")
          .update({ content_status: 'published' })
          .in("id",
            (await supabase
              .from("module_content_items")
              .select("content_id")
              .in("module_id", moduleIds)
              .eq("content_type", "lesson")
            ).data?.map(l => l.content_id) || []
          );

        // Publish all quizzes
        await supabase
          .from("quizzes")
          .update({ content_status: 'published' })
          .in("id",
            (await supabase
              .from("module_content_items")
              .select("content_id")
              .in("module_id", moduleIds)
              .eq("content_type", "quiz")
            ).data?.map(q => q.content_id) || []
          );
      }

      alert("✅ Curriculum published! Refresh the student page to see changes.");
    } catch (err: any) {
      console.error("Error fixing curriculum:", err);
      alert("Failed to fix curriculum: " + err.message);
    }
  };

  const handleReject = async () => {
    if (!selectedUpdate || !rejectionReason.trim()) {
      alert("Please provide a rejection reason");
      return;
    }

    setProcessing(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { error } = await supabase.rpc("reject_course_update", {
        p_pending_update_id: selectedUpdate.id,
        p_admin_id: user.id,
        p_rejection_reason: rejectionReason,
      });

      if (error) throw error;

      alert("Course update rejected");
      setShowRejectModal(false);
      setRejectionReason("");
      setSelectedUpdate(null);
      fetchPendingUpdates();
    } catch (err: any) {
      console.error("Error rejecting update:", err);
      alert("Failed to reject: " + err.message);
    } finally {
      setProcessing(false);
    }
  };

  const handleViewDetails = async (update: PendingUpdate) => {
    setSelectedUpdate(update);
    await fetchUpdateDetails(update.id);
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-100 text-red-800";
      case "normal":
        return "bg-blue-100 text-blue-800";
      case "low":
        return "bg-gray-100 text-gray-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getUpdateTypeLabel = (type: string) => {
    switch (type) {
      case "content_update":
        return "Content Update";
      case "price_change":
        return "Price Change";
      case "metadata_update":
        return "Metadata Update";
      case "major_revision":
        return "Major Revision";
      default:
        return type;
    }
  };

  return (
    <AdminAppLayout>
      <div className="p-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-text-primary dark:text-dark-text-primary">
            Course Update Requests
          </h1>
          <p className="text-text-secondary dark:text-dark-text-secondary mt-1">
            Review and approve course updates submitted by coaches
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center p-8">
            <div className="w-8 h-8 border-4 border-brand-primary border-t-transparent rounded-full animate-spin" />
          </div>
        ) : pendingUpdates.length === 0 ? (
          <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-card p-8 text-center">
            <div className="text-6xl mb-4">📝</div>
            <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary mb-2">
              No Pending Updates
            </h3>
            <p className="text-text-secondary dark:text-dark-text-secondary">
              All caught up! There are no course updates awaiting review.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {pendingUpdates.map((update) => (
              <div
                key={update.id}
                className="bg-white dark:bg-dark-background-card rounded-2xl shadow-card p-6"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold text-text-primary dark:text-dark-text-primary">
                        {update.course_title}
                      </h3>
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          update.priority
                        )}`}
                      >
                        {update.priority}
                      </span>
                      <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {getUpdateTypeLabel(update.update_type)}
                      </span>
                    </div>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-2">
                      <strong>Coach:</strong> {update.coach_name}
                    </p>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                      <strong>Changes:</strong> {update.module_changes_count} modules,{" "}
                      {update.content_changes_count} content items
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-text-muted dark:text-dark-text-muted mb-2">
                      Submitted {new Date(update.submitted_at).toLocaleDateString()}
                    </p>
                    <button
                      onClick={() => handleViewDetails(update)}
                      className="px-4 py-2 bg-brand-primary text-white rounded-lg hover:bg-brand-primary-dark transition-colors text-sm font-medium"
                    >
                      Review Update
                    </button>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                  <p className="text-sm text-text-secondary dark:text-dark-text-secondary">
                    {update.change_description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Details Modal */}
        {selectedUpdate && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div>
                    <h2 className="text-xl font-bold text-text-primary dark:text-dark-text-primary">
                      {selectedUpdate.course_title}
                    </h2>
                    <p className="text-sm text-text-secondary dark:text-dark-text-secondary mt-1">
                      Update by {selectedUpdate.coach_name} •{" "}
                      {getUpdateTypeLabel(selectedUpdate.update_type)}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedUpdate(null)}
                    className="text-text-muted hover:text-text-primary dark:text-dark-text-muted dark:hover:text-dark-text-primary"
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Change Description */}
                <div>
                  <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-2">
                    Change Description
                  </h3>
                  <p className="text-text-secondary dark:text-dark-text-secondary bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
                    {selectedUpdate.change_description}
                  </p>
                </div>

                {/* Module Updates */}
                {moduleUpdates.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
                      Module Changes ({moduleUpdates.length})
                    </h3>
                    <div className="space-y-2">
                      {moduleUpdates.map((module) => (
                        <div
                          key={module.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              module.action === "create"
                                ? "bg-green-100 text-green-800"
                                : module.action === "update"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {module.action.toUpperCase()}
                          </span>
                          <span className="text-sm text-text-primary dark:text-dark-text-primary">
                            {module.title || `Module #${module.position}`}
                          </span>
                          {module.action === "update" && module.module_id && (
                            <span className="text-xs text-text-muted dark:text-dark-text-muted">
                              (ID: {module.module_id.slice(0, 8)}...)
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Content Item Updates */}
                {contentUpdates.length > 0 && (
                  <div>
                    <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-3">
                      Content Changes ({contentUpdates.length})
                    </h3>
                    <div className="space-y-2">
                      {contentUpdates.map((content) => (
                        <div
                          key={content.id}
                          className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                        >
                          <span
                            className={`px-2 py-1 rounded text-xs font-medium ${
                              content.action === "create"
                                ? "bg-green-100 text-green-800"
                                : content.action === "update"
                                ? "bg-blue-100 text-blue-800"
                                : "bg-red-100 text-red-800"
                            }`}
                          >
                            {content.action.toUpperCase()}
                          </span>
                          <span className="px-2 py-1 bg-purple-100 text-purple-800 rounded text-xs font-medium">
                            {content.content_type.toUpperCase()}
                          </span>
                          <span className="text-sm text-text-primary dark:text-dark-text-primary">
                            {content.title_change || `Content #${content.position}`}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Review Notes */}
                <div>
                  <h3 className="text-sm font-semibold text-text-primary dark:text-dark-text-primary mb-2">
                    Review Notes (Optional)
                  </h3>
                  <textarea
                    value={reviewNotes}
                    onChange={(e) => setReviewNotes(e.target.value)}
                    placeholder="Add any notes for the coach or record-keeping..."
                    className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-background-input text-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:border-transparent"
                    rows={3}
                  />
                </div>
              </div>

              <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-end gap-3">
                <button
                  onClick={() => {
                    setShowRejectModal(true);
                  }}
                  disabled={processing}
                  className="px-6 py-2.5 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 dark:border-red-700 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors font-medium disabled:opacity-50"
                >
                  Reject Update
                </button>
                <button
                  onClick={handleApprove}
                  disabled={processing}
                  className="px-6 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium disabled:opacity-50"
                >
                  {processing ? "Processing..." : "Approve Update"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Reject Modal */}
        {showRejectModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
            <div className="bg-white dark:bg-dark-background-card rounded-2xl shadow-xl max-w-md w-full">
              <div className="p-6">
                <h3 className="text-lg font-bold text-text-primary dark:text-dark-text-primary mb-2">
                  Reject Update
                </h3>
                <p className="text-sm text-text-secondary dark:text-dark-text-secondary mb-4">
                  Please provide a reason for rejecting this update:
                </p>
                <textarea
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="Explain why this update cannot be approved..."
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-dark-background-input text-text-primary dark:text-dark-text-primary focus:ring-2 focus:ring-brand-primary focus:border-transparent mb-4"
                  rows={4}
                  autoFocus
                />
                <div className="flex items-center justify-end gap-3">
                  <button
                    onClick={() => {
                      setShowRejectModal(false);
                      setRejectionReason("");
                    }}
                    className="px-4 py-2 text-text-secondary dark:text-dark-text-secondary hover:text-text-primary dark:hover:text-dark-text-primary transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleReject}
                    disabled={processing || !rejectionReason.trim()}
                    className="px-6 py-2.5 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium disabled:opacity-50"
                  >
                    {processing ? "Processing..." : "Reject Update"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </AdminAppLayout>
  );
};

export default CourseUpdateRequests;
