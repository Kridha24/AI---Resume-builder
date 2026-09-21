import React, { useState } from "react";
import {
  Check,
  X,
  RotateCcw,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  Filter,
} from "lucide-react";
import { ChangeProposal, ResumeData } from "../types";

interface ChangeReviewPanelProps {
  proposals: ChangeProposal[];
  onUpdateProposalStatus: (id: string, status: "pending" | "accepted" | "rejected") => void;
  onApplyChanges: () => void;
  onCancel?: () => void;
  isApplying?: boolean;
}

export const ChangeReviewPanel: React.FC<ChangeReviewPanelProps> = ({
  proposals,
  onUpdateProposalStatus,
  onApplyChanges,
  onCancel,
  isApplying = false,
}) => {
  const [filter, setFilter] = useState<"all" | "pending" | "accepted" | "rejected">("all");

  const acceptedCount = proposals.filter((p) => p.status === "accepted").length;
  const rejectedCount = proposals.filter((p) => p.status === "rejected").length;
  const pendingCount = proposals.filter((p) => p.status === "pending").length;

  const filteredProposals = proposals.filter((p) => {
    if (filter === "all") return true;
    return p.status === filter;
  });

  const handleAcceptAll = () => {
    proposals.forEach((p) => {
      if (p.status !== "accepted") {
        onUpdateProposalStatus(p.id, "accepted");
      }
    });
  };

  const handleRejectAll = () => {
    proposals.forEach((p) => {
      if (p.status !== "rejected") {
        onUpdateProposalStatus(p.id, "rejected");
      }
    });
  };

  return (
    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden flex flex-col max-h-[85vh]">
      {/* Header */}
      <div className="p-6 bg-slate-900 text-white flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            <h2 className="text-xl font-bold">Review Proposed Tailoring Changes</h2>
          </div>
          <p className="text-sm text-slate-300 mt-1">
            Carefully review each proposed modification. You have complete control: accept, reject, or undo any change.
          </p>
        </div>

        {/* Action Counters & Bulk actions */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleAcceptAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
          >
            Accept All
          </button>
          <button
            type="button"
            onClick={handleRejectAll}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
          >
            Reject All
          </button>
        </div>
      </div>

      {/* Filter and stats bar */}
      <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-500" />
          <span className="text-xs font-medium text-slate-600 uppercase tracking-wider">Filter:</span>
          <div className="flex gap-1.5 bg-slate-200/80 p-1 rounded-lg text-xs">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "all" ? "bg-white text-slate-900 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              All ({proposals.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter("pending")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "pending" ? "bg-white text-amber-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Pending ({pendingCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("accepted")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "accepted" ? "bg-white text-emerald-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Accepted ({acceptedCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("rejected")}
              className={`px-2.5 py-1 rounded-md font-medium transition-all ${
                filter === "rejected" ? "bg-white text-rose-700 shadow-sm" : "text-slate-600 hover:text-slate-900"
              }`}
            >
              Rejected ({rejectedCount})
            </button>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-500">
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
            {acceptedCount} accepted
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
            {rejectedCount} rejected
          </span>
          <span className="flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
            {pendingCount} pending
          </span>
        </div>
      </div>

      {/* Proposals List */}
      <div className="p-6 overflow-y-auto space-y-5 flex-1 bg-slate-50/50">
        {filteredProposals.length === 0 ? (
          <div className="text-center py-12 text-slate-500">
            <CheckCircle2 className="w-10 h-10 text-slate-300 mx-auto mb-2" />
            <p className="font-medium">No proposals in this filter view.</p>
          </div>
        ) : (
          filteredProposals.map((prop, idx) => {
            const isAccepted = prop.status === "accepted";
            const isRejected = prop.status === "rejected";
            const isPending = prop.status === "pending";

            return (
              <div
                key={prop.id}
                className={`bg-white rounded-xl border transition-all p-5 shadow-sm ${
                  isAccepted
                    ? "border-emerald-300 ring-2 ring-emerald-100"
                    : isRejected
                    ? "border-rose-200 bg-rose-50/30 opacity-75"
                    : "border-slate-200 hover:border-indigo-200"
                }`}
              >
                {/* Header row: Section, Requirement target, Status badge */}
                <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
                      {prop.section}
                    </span>
                    {prop.targetRequirementIds && prop.targetRequirementIds.length > 0 && (
                      <span className="text-xs text-slate-500 font-medium truncate max-w-xs">
                        Target: {prop.targetRequirementIds.join(", ")}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {prop.needsConfirmation && (
                      <span className="flex items-center gap-1 text-xs font-semibold px-2.5 py-0.5 rounded-full bg-amber-100 text-amber-800 border border-amber-300">
                        <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
                        Needs Confirmation
                      </span>
                    )}
                    <span
                      className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${
                        isAccepted
                          ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                          : isRejected
                          ? "bg-rose-100 text-rose-800 border border-rose-300"
                          : "bg-amber-100 text-amber-800 border border-amber-200"
                      }`}
                    >
                      {prop.status.toUpperCase()}
                    </span>
                  </div>
                </div>

                {/* Diff View */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-4">
                  {/* Original Text */}
                  <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 text-xs">
                    <span className="block font-semibold text-slate-500 uppercase tracking-wider text-[10px] mb-1.5">
                      Original Text
                    </span>
                    <p className="text-slate-700 whitespace-pre-wrap leading-relaxed">
                      {prop.originalText || <em className="text-slate-400">None (new addition)</em>}
                    </p>
                  </div>

                  {/* Proposed Text */}
                  <div
                    className={`p-3.5 rounded-lg border text-xs leading-relaxed ${
                      isAccepted
                        ? "bg-emerald-50/50 border-emerald-200 text-emerald-950"
                        : "bg-indigo-50/40 border-indigo-200 text-slate-900"
                    }`}
                  >
                    <span className="block font-semibold text-indigo-700 uppercase tracking-wider text-[10px] mb-1.5 flex items-center gap-1">
                      <Sparkles className="w-3 h-3" />
                      Proposed Tailored Text
                    </span>
                    <p className="whitespace-pre-wrap font-medium">{prop.proposedText}</p>
                  </div>
                </div>

                {/* Rationale & Supporting Evidence */}
                <div className="mb-4 text-xs text-slate-600 bg-slate-50/80 p-3 rounded-lg border border-slate-200 space-y-1.5">
                  <p>
                    <strong className="text-slate-800">Reason:</strong> {prop.reason}
                  </p>
                  {prop.supportingFactIds && prop.supportingFactIds.length > 0 && (
                    <p className="flex items-center gap-1.5 text-slate-500">
                      <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                      <span>
                        <strong>Grounded in:</strong> {prop.supportingFactIds.join(", ")}
                      </span>
                    </p>
                  )}
                  {prop.needsConfirmation && (
                    <div className="mt-1 p-2 rounded bg-amber-50 border border-amber-200 text-amber-800 text-[11px]">
                      <strong>Verification notice:</strong> {prop.needsConfirmation}
                    </div>
                  )}
                </div>

                {/* Actions: Accept, Reject, Undo */}
                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  {isPending ? (
                    <>
                      <button
                        type="button"
                        onClick={() => onUpdateProposalStatus(prop.id, "rejected")}
                        className="px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold flex items-center gap-1 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                        Reject
                      </button>
                      <button
                        type="button"
                        onClick={() => onUpdateProposalStatus(prop.id, "accepted")}
                        className="px-3.5 py-1.5 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 text-xs font-semibold flex items-center gap-1 shadow-sm transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Accept
                      </button>
                    </>
                  ) : (
                    <button
                      type="button"
                      onClick={() => onUpdateProposalStatus(prop.id, "pending")}
                      className="px-3 py-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-100 text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      Undo Decision
                    </button>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer / Apply Bar */}
      <div className="p-6 bg-white border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="text-xs text-slate-500">
          {acceptedCount > 0 ? (
            <span className="text-emerald-700 font-semibold">
              {acceptedCount} {acceptedCount === 1 ? "change" : "changes"} will be applied to your resume.
            </span>
          ) : (
            <span>Accept one or more changes to apply them to your tailored draft.</span>
          )}
        </div>

        <div className="flex items-center gap-3 w-full sm:w-auto">
          {onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 sm:flex-initial px-4 py-2 rounded-xl border border-slate-300 text-slate-700 hover:bg-slate-50 font-medium text-sm transition-colors"
            >
              Cancel
            </button>
          )}
          <button
            type="button"
            disabled={acceptedCount === 0 || isApplying}
            onClick={onApplyChanges}
            className="flex-1 sm:flex-initial px-6 py-2.5 rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2"
          >
            {isApplying ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Applying Changes...</span>
              </>
            ) : (
              <>
                <span>Apply {acceptedCount} Accepted Changes</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
