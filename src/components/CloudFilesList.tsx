import React, { useState, useEffect } from "react";
import { 
  FileText, Calendar, Cloud, ChevronRight, Loader2, Trash2, FolderOpen, AlertCircle, RefreshCw, PenTool 
} from "lucide-react";
import { collection, query, where, getDocs, doc, deleteDoc, orderBy } from "firebase/firestore";
import { db } from "../firebase";
import { ResumeData, LayoutSettings } from "../types";

interface CloudFilesListProps {
  userId: string;
  onLoadResume: (data: ResumeData, layout: LayoutSettings, id?: string, name?: string) => void;
  onLoadCoverLetter: (targetRole: string, targetCompany: string, jobDescription: string, content: string) => void;
  onOpenCoverLetterView: () => void;
  accentColor: string;
}

interface SavedResume {
  id: string;
  name: string;
  data: ResumeData;
  layout: LayoutSettings;
  updatedAt: string;
}

interface SavedCoverLetter {
  id: string;
  title: string;
  targetRole: string;
  targetCompany: string;
  jobDescription: string;
  content: string;
  updatedAt: string;
}

export default function CloudFilesList({
  userId,
  onLoadResume,
  onLoadCoverLetter,
  onOpenCoverLetterView,
  accentColor
}: CloudFilesListProps) {
  const [resumes, setResumes] = useState<SavedResume[]>([]);
  const [coverLetters, setCoverLetters] = useState<SavedCoverLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  const fetchCloudFiles = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // 1. Fetch resumes
      const resumesRef = collection(db, "resumes");
      const resumesQuery = query(
        resumesRef, 
        where("userId", "==", userId)
      );
      const resumesSnap = await getDocs(resumesQuery);
      const fetchedResumes: SavedResume[] = [];
      resumesSnap.forEach((doc) => {
        const item = doc.data();
        fetchedResumes.push({
          id: doc.id,
          name: item.name || "Untitled Resume",
          data: item.data as ResumeData,
          layout: item.layout as LayoutSettings,
          updatedAt: item.updatedAt || new Date().toISOString()
        });
      });
      // Sort in-memory to avoid needing immediate composite index configuration
      fetchedResumes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setResumes(fetchedResumes);

      // 2. Fetch cover letters
      const lettersRef = collection(db, "coverLetters");
      const lettersQuery = query(
        lettersRef,
        where("userId", "==", userId)
      );
      const lettersSnap = await getDocs(lettersQuery);
      const fetchedLetters: SavedCoverLetter[] = [];
      lettersSnap.forEach((doc) => {
        const item = doc.data();
        fetchedLetters.push({
          id: doc.id,
          title: item.title || "Untitled Cover Letter",
          targetRole: item.targetRole || "",
          targetCompany: item.targetCompany || "",
          jobDescription: item.jobDescription || "",
          content: item.content || "",
          updatedAt: item.updatedAt || new Date().toISOString()
        });
      });
      fetchedLetters.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      setCoverLetters(fetchedLetters);

    } catch (err: any) {
      console.error("Error fetching cloud files:", err);
      setError("Could not load saved documents from database. Make sure your FireStore database is provisioned.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (userId) {
      fetchCloudFiles();
    }
  }, [userId]);

  const handleDeleteResume = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved resume from the cloud?")) return;
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "resumes", id));
      setResumes(prev => prev.filter(r => r.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete resume.");
    } finally {
      setIsDeleting(null);
    }
  };

  const handleDeleteLetter = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved cover letter?")) return;
    setIsDeleting(id);
    try {
      await deleteDoc(doc(db, "coverLetters", id));
      setCoverLetters(prev => prev.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
      alert("Failed to delete cover letter.");
    } finally {
      setIsDeleting(null);
    }
  };

  const formatDate = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric"
      });
    } catch {
      return "Recently";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Cloud className="w-5 h-5 text-emerald-500" />
          <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider">
            Your Cloud Career Library
          </h3>
        </div>
        
        <button
          onClick={fetchCloudFiles}
          className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-500 hover:text-slate-800 transition-colors cursor-pointer"
          title="Refresh Library List"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {isLoading ? (
        <div className="py-8 flex flex-col items-center justify-center text-slate-400 space-y-2">
          <Loader2 className="w-6 h-6 animate-spin text-slate-400" />
          <p className="text-xs font-medium">Synchronizing documents...</p>
        </div>
      ) : error ? (
        <div className="p-4 bg-red-50 text-red-700 text-xs rounded-xl border border-red-100 flex items-start space-x-2">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-semibold leading-relaxed">{error}</p>
        </div>
      ) : resumes.length === 0 && coverLetters.length === 0 ? (
        <div className="p-6 bg-slate-50 border border-dashed border-slate-200 rounded-xl text-center text-slate-400 space-y-2">
          <FolderOpen className="w-8 h-8 mx-auto text-slate-300" />
          <p className="text-xs font-semibold">No saved cloud files found yet</p>
          <p className="text-[11px] text-slate-400 leading-normal max-w-xs mx-auto">
            Create or edit any resume, then click "Save to Cloud" to store it securely in your Firestore library!
          </p>
        </div>
      ) : (
        <div className="space-y-5">
          {/* Saved Resumes List */}
          {resumes.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Saved Resumes ({resumes.length})
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {resumes.map((resume) => (
                  <div
                    key={resume.id}
                    onClick={() => onLoadResume(resume.data, resume.layout, resume.id, resume.name)}
                    className="p-3 bg-white border border-slate-200 hover:border-emerald-300 rounded-xl flex items-center justify-between group cursor-pointer shadow-sm hover:shadow transition-all"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2.5 bg-emerald-50 text-emerald-600 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                        <FileText className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                          {resume.name}
                        </h4>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Saved {formatDate(resume.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDeleteResume(resume.id, e)}
                        disabled={isDeleting === resume.id}
                        className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-all shrink-0 cursor-pointer"
                        title="Delete Resume"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4.5 h-4.5 text-slate-300 group-hover:text-emerald-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Saved Cover Letters List */}
          {coverLetters.length > 0 && (
            <div className="space-y-2">
              <span className="text-[10px] font-extrabold text-slate-500 uppercase tracking-widest block">
                Saved Cover Letters ({coverLetters.length})
              </span>
              <div className="grid grid-cols-1 gap-2.5">
                {coverLetters.map((letter) => (
                  <div
                    key={letter.id}
                    onClick={() => {
                      onLoadCoverLetter(letter.targetRole, letter.targetCompany, letter.jobDescription, letter.content);
                      onOpenCoverLetterView();
                    }}
                    className="p-3 bg-white border border-slate-200 hover:border-indigo-300 rounded-xl flex items-center justify-between group cursor-pointer shadow-sm hover:shadow transition-all"
                  >
                    <div className="flex items-center space-x-3 min-w-0">
                      <div className="p-2.5 bg-indigo-50 text-indigo-600 rounded-lg group-hover:scale-105 transition-transform shrink-0">
                        <PenTool className="w-4.5 h-4.5" />
                      </div>
                      <div className="min-w-0 space-y-0.5">
                        <h4 className="text-xs font-bold text-slate-800 truncate leading-snug">
                          {letter.title}
                        </h4>
                        <div className="flex items-center space-x-1.5 text-[10px] text-slate-400">
                          <Calendar className="w-3.5 h-3.5" />
                          <span>Saved {formatDate(letter.updatedAt)}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-1">
                      <button
                        onClick={(e) => handleDeleteLetter(letter.id, e)}
                        disabled={isDeleting === letter.id}
                        className="p-2 hover:bg-red-50 hover:text-red-600 text-slate-400 rounded-lg transition-all shrink-0 cursor-pointer"
                        title="Delete Cover Letter"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                      <ChevronRight className="w-4.5 h-4.5 text-slate-300 group-hover:text-indigo-500 transition-colors" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
