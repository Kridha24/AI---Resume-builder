import React, { useState, useEffect } from "react";
import { 
  History, Plus, Trash2, Clock, Check, Loader2, AlertCircle, Save, Database, ArrowLeftRight 
} from "lucide-react";
import { collection, query, getDocs, doc, deleteDoc, addDoc } from "firebase/firestore";
import { db } from "../firebase";
import { ResumeData, LayoutSettings } from "../types";

interface ResumeVersion {
  id: string;
  name: string;
  data: ResumeData;
  layout: LayoutSettings;
  createdAt: string;
  updatedAt: string;
}

interface ResumeVersionHistoryProps {
  userId: string;
  activeResumeId: string | null;
  activeResumeName: string | null;
  resumeData: ResumeData;
  layoutSettings: LayoutSettings;
  onLoadResume: (data: ResumeData, layout: LayoutSettings, id: string, name: string) => void;
  onSetCloudResume: (id: string, name: string) => void;
  accentColor: string;
}

export default function ResumeVersionHistory({
  userId,
  activeResumeId,
  activeResumeName,
  resumeData,
  layoutSettings,
  onLoadResume,
  onSetCloudResume,
  accentColor
}: ResumeVersionHistoryProps) {
  const [versions, setVersions] = useState<ResumeVersion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form states for saving new version
  const [newVersionName, setNewVersionName] = useState("");
  // Form states for initial save to cloud (if activeResumeId is null)
  const [initialSaveName, setInitialSaveName] = useState("");

  const fetchVersions = async (resumeId: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const versionsRef = collection(db, "resumes", resumeId, "versions");
      const snap = await getDocs(versionsRef);
      const fetched: ResumeVersion[] = [];
      
      snap.forEach((docRef) => {
        const item = docRef.data();
        fetched.push({
          id: docRef.id,
          name: item.name || "Unnamed Version",
          data: item.data as ResumeData,
          layout: item.layout as LayoutSettings,
          createdAt: item.createdAt || new Date().toISOString(),
          updatedAt: item.updatedAt || new Date().toISOString()
        });
      });

      // Sort by creation or update date descending
      fetched.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      setVersions(fetched);
    } catch (err: any) {
      console.error("Error loading resume versions:", err);
      setError("Failed to load version history. Please verify your connection.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (activeResumeId) {
      fetchVersions(activeResumeId);
    } else {
      setVersions([]);
    }
  }, [activeResumeId]);

  const handleSaveInitialCloud = async (e: React.FormEvent) => {
    e.preventDefault();
    const docName = initialSaveName.trim() || (resumeData.personalInfo.fullName ? `${resumeData.personalInfo.fullName} Resume` : "My Resume Draft");
    setIsSaving(true);
    setError(null);

    try {
      const resumesRef = collection(db, "resumes");
      const newDoc = await addDoc(resumesRef, {
        userId,
        name: docName,
        data: resumeData,
        layout: layoutSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      onSetCloudResume(newDoc.id, docName);
      setSuccessMsg("Resume created in cloud successfully!");
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to initialize cloud resume: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateVersion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeResumeId) return;

    const versionName = newVersionName.trim() || `Version ${versions.length + 1} (${new Date().toLocaleDateString()})`;
    setIsSaving(true);
    setError(null);

    try {
      const versionsRef = collection(db, "resumes", activeResumeId, "versions");
      await addDoc(versionsRef, {
        name: versionName,
        data: resumeData,
        layout: layoutSettings,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      setNewVersionName("");
      setSuccessMsg(`"${versionName}" saved successfully!`);
      setTimeout(() => setSuccessMsg(null), 3000);
      fetchVersions(activeResumeId);
    } catch (err: any) {
      console.error(err);
      setError("Failed to save version: " + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleRestoreVersion = (version: ResumeVersion) => {
    if (!activeResumeId || !activeResumeName) return;
    const confirmRestore = window.confirm(
      `Are you sure you want to restore "${version.name}"? This will overwrite your current active changes in the builder.`
    );
    if (!confirmRestore) return;

    onLoadResume(version.data, version.layout, activeResumeId, activeResumeName);
    setSuccessMsg(`Restored to "${version.name}"`);
    setTimeout(() => setSuccessMsg(null), 3000);
  };

  const handleDeleteVersion = async (versionId: string, versionName: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!activeResumeId) return;

    const confirmDelete = window.confirm(`Are you sure you want to delete "${versionName}" from version history?`);
    if (!confirmDelete) return;

    setIsDeleting(versionId);
    try {
      const docRef = doc(db, "resumes", activeResumeId, "versions", versionId);
      await deleteDoc(docRef);
      setVersions(prev => prev.filter(v => v.id !== versionId));
      setSuccessMsg(`Deleted "${versionName}"`);
      setTimeout(() => setSuccessMsg(null), 3000);
    } catch (err: any) {
      console.error(err);
      setError("Failed to delete version.");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
      });
    } catch {
      return "Just now";
    }
  };

  // 1. Unauthenticated warning is handled at App level, but in case:
  if (!userId) {
    return (
      <div className="p-4 text-center space-y-4">
        <Database className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-sm font-bold text-slate-800">Authentication Required</h3>
        <p className="text-xs text-slate-500">
          Please sign in using your Google account to access cloud saving and version history features.
        </p>
      </div>
    );
  }

  // 2. If no resume is active/saved in cloud yet
  if (!activeResumeId) {
    return (
      <div className="space-y-5 bg-white p-2">
        <div className="p-5 bg-indigo-50/50 rounded-2xl border border-indigo-100 text-center space-y-4">
          <Database className="w-10 h-10 text-indigo-500 mx-auto" />
          <div className="space-y-1.5">
            <h4 className="text-xs font-black uppercase tracking-wider text-slate-900">
              Set Up Cloud Tracking
            </h4>
            <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
              Before tracking individual version iterations, you must save this resume draft to your Firestore Cloud account first.
            </p>
          </div>

          <form onSubmit={handleSaveInitialCloud} className="space-y-2 text-left">
            <label className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
              Resume Name / Title
            </label>
            <input
              type="text"
              required
              placeholder={resumeData.personalInfo.fullName ? `${resumeData.personalInfo.fullName} Resume` : "My Master Resume"}
              value={initialSaveName}
              onChange={(e) => setInitialSaveName(e.target.value)}
              className="w-full text-xs border border-slate-200 rounded-lg p-2.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
            />
            
            <button
              type="submit"
              disabled={isSaving}
              className="w-full inline-flex items-center justify-center space-x-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs py-2.5 px-3 rounded-lg shadow-sm cursor-pointer transition-all disabled:opacity-50"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Creating Cloud Draft...</span>
                </>
              ) : (
                <>
                  <Save className="w-3.5 h-3.5" />
                  <span>Create Cloud Master & Enable History</span>
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      
      {/* Active Resume status */}
      <div className="p-3 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
        <div className="min-w-0">
          <span className="text-[8px] font-extrabold text-slate-400 uppercase tracking-widest block leading-none">
            Tracking Cloud Document
          </span>
          <span className="text-xs font-bold text-slate-800 truncate block mt-1">
            {activeResumeName}
          </span>
        </div>
        <div className="bg-emerald-50 text-emerald-700 text-[9px] font-extrabold uppercase px-2 py-0.5 rounded-full border border-emerald-100 flex items-center space-x-1 shrink-0">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
          <span>Sync Active</span>
        </div>
      </div>

      {/* Save version Form */}
      <div className="p-4 bg-white border border-slate-200 rounded-xl shadow-sm space-y-3">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
          Snapshot Current State
        </span>

        <form onSubmit={handleCreateVersion} className="flex gap-2">
          <input
            type="text"
            required
            placeholder="e.g. Version 2 - added projects"
            value={newVersionName}
            onChange={(e) => setNewVersionName(e.target.value)}
            className="flex-1 text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 transition-all bg-white"
          />
          <button
            type="submit"
            disabled={isSaving}
            style={{ backgroundColor: accentColor }}
            className="text-white text-xs font-bold p-2.5 rounded-lg hover:brightness-95 transition-all shadow-sm shrink-0 cursor-pointer disabled:opacity-40"
            title="Create a point-in-time snapshot version"
          >
            {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          </button>
        </form>
      </div>

      {/* Success / Error Toast notification */}
      {successMsg && (
        <div className="p-2.5 bg-emerald-50 border border-emerald-100 text-emerald-800 text-[11px] rounded-lg font-semibold flex items-center space-x-1.5 animate-fadeIn">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="p-2.5 bg-red-50 border border-red-100 text-red-800 text-[11px] rounded-lg font-semibold flex items-start space-x-1.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Version list */}
      <div className="space-y-2.5">
        <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-wider block">
          Version Backups ({versions.length})
        </span>

        {isLoading ? (
          <div className="py-12 flex flex-col items-center justify-center space-y-2 text-slate-400">
            <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
            <span className="text-xs font-medium">Loading version history...</span>
          </div>
        ) : versions.length === 0 ? (
          <div className="text-center p-6 border border-dashed border-slate-200 bg-slate-50 rounded-xl space-y-1">
            <History className="w-6 h-6 mx-auto text-slate-300" />
            <p className="text-xs font-bold text-slate-600">No versions saved yet</p>
            <p className="text-[10px] text-slate-400 max-w-[200px] mx-auto leading-relaxed">
              Create point-in-time snapshots above so you can easily rollback to any edits later.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {versions.map((version) => (
              <div
                key={version.id}
                onClick={() => handleRestoreVersion(version)}
                className="group p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between cursor-pointer transition-all hover:shadow-sm"
              >
                <div className="min-w-0 flex items-start space-x-2.5">
                  <div className="p-1.5 bg-slate-50 text-slate-500 rounded-lg group-hover:bg-indigo-50 group-hover:text-indigo-600 transition-colors mt-0.5 shrink-0">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <h5 className="text-xs font-bold text-slate-800 group-hover:text-indigo-900 transition-colors truncate">
                      {version.name}
                    </h5>
                    <span className="text-[9px] text-slate-400 block mt-0.5 font-medium">
                      Saved {formatDate(version.createdAt)}
                    </span>
                  </div>
                </div>

                <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button
                    onClick={(e) => handleDeleteVersion(version.id, version.name, e)}
                    disabled={isDeleting === version.id}
                    className="p-1.5 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-md transition-colors cursor-pointer"
                    title="Delete this backup"
                  >
                    {isDeleting === version.id ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin text-red-500" />
                    ) : (
                      <Trash2 className="w-3.5 h-3.5" />
                    )}
                  </button>
                  <div className="p-1.5 text-[10px] font-bold text-indigo-600 bg-indigo-50 rounded-md">
                    Restore
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

    </div>
  );
}
