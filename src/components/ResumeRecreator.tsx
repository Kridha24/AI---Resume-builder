import React, { useState, useRef } from "react";
import { 
  Sparkles, Loader2, ArrowRight, ClipboardCopy, FileText, AlertCircle, 
  UploadCloud, X, File, FileUp
} from "lucide-react";
import { ResumeData } from "../types";

interface ResumeRecreatorProps {
  onParsed: (data: ResumeData) => void;
  colorTheme: string;
}

export default function ResumeRecreator({ onParsed, colorTheme }: ResumeRecreatorProps) {
  const [activeTab, setActiveTab] = useState<"upload" | "paste">("upload");
  const [rawText, setRawText] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // File loading helper
  const handleFileChange = (file: File) => {
    if (!file) return;

    // Verify format
    const isPdf = file.type === "application/pdf" || file.name.endsWith(".pdf");
    const isTxt = file.type === "text/plain" || file.name.endsWith(".txt");

    if (!isPdf && !isTxt) {
      setError("Unsupported format! Please upload a PDF (.pdf) or text (.txt) file.");
      return;
    }

    if (file.size > 8 * 1024 * 1024) { // 8MB limit
      setError("File is too large! Please upload a file smaller than 8MB.");
      return;
    }

    setSelectedFile(file);
    setError(null);

    const reader = new FileReader();
    if (isTxt) {
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setRawText(text);
        setFileBase64(null); // No base64 needed for TXT files
      };
      reader.readAsText(file);
    } else {
      // PDF - read as data URL to extract base64
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64 = result.split(",")[1];
        setFileBase64(base64);
        setRawText(""); // Clear rawText so we parse the file base64
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileChange(e.dataTransfer.files[0]);
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFileChange(e.target.files[0]);
    }
  };

  const clearSelectedFile = (e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setSelectedFile(null);
    setFileBase64(null);
    setRawText("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  // Handle parse request
  const handleParse = async () => {
    setIsLoading(true);
    setError(null);

    try {
      let bodyData: any = {};

      if (activeTab === "upload") {
        if (!selectedFile) {
          throw new Error("Please upload or drag a resume file first!");
        }

        if (fileBase64) {
          bodyData = { fileBase64, mimeType: "application/pdf" };
        } else if (rawText) {
          bodyData = { rawText };
        } else {
          throw new Error("Could not process the uploaded file. Try pasting the plain text instead.");
        }
      } else {
        if (!rawText.trim()) {
          throw new Error("Please paste your existing resume content first!");
        }
        bodyData = { rawText };
      }

      const response = await fetch("/api/ai/parse-resume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(bodyData),
      });

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error || "Failed to parse resume content.");
      }

      if (data.parsedResume) {
        onParsed(data.parsedResume);
      } else {
        throw new Error("Invalid response received from AI parsing engine.");
      }
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred while parsing. Please check your connection or GEMINI_API_KEY.");
    } finally {
      setIsLoading(false);
    }
  };

  // Quick helper to load sample old text
  const loadSampleOldText = () => {
    setRawText(`Mihir Shekhar
Email: mihir@example.com | Phone: +1-555-0192 | LinkedIn: linkedin.com/in/mihir
Location: San Francisco, CA | GitHub: github.com/mihir

OBJECTIVE
Experienced software developer looking for high-impact roles in React/Node engineering.

EXPERIENCE
Lead Software Engineer | ByteTech Corp | 2023 - Present
- Lead development of enterprise dashboard platform using React, TypeScript and Redux.
- Decreased bundle sizes by 32% by implementing lazy loading and code splitting.
- Managed and mentored a team of 4 junior frontend developers.

Frontend Developer | Innovate Web Solutions | 2021 - 2023
- Built dynamic responsive pages using Tailwind CSS and Next.js.
- Integrated REST APIs and optimized graph performance, cutting response times.

EDUCATION
B.S. in Computer Science | California State University | 2017 - 2021
GPA: 3.8 / 4.0

SKILLS
React, JavaScript, TypeScript, Node.js, Express, CSS, Tailwind CSS, PostgreSQL, Git, Agile Scrum`);
  };

  const isFormEmpty = activeTab === "upload" ? !selectedFile : !rawText.trim();

  return (
    <div className="space-y-5 p-5 bg-white border border-slate-200 rounded-xl shadow-sm">
      <div className="space-y-1">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center space-x-1.5">
          <Sparkles className="w-4.5 h-4.5" style={{ color: colorTheme }} />
          <span>Recreate with AI Resume Importer</span>
        </h3>
        <p className="text-xs text-slate-500 leading-normal">
          Have an old resume? Upload your PDF/TXT document or paste raw text below. Our Gemini AI parsing engine will automatically analyze the structure, extract contacts, work experience, education history, and skills categories, and load them instantly into your builder dashboard!
        </p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-100">
        <button
          type="button"
          onClick={() => {
            setActiveTab("upload");
            setError(null);
          }}
          className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === "upload"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <FileUp className="w-3.5 h-3.5" />
          <span>Upload PDF / TXT File</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab("paste");
            setError(null);
          }}
          className={`flex-1 pb-2.5 text-xs font-bold text-center border-b-2 transition-all cursor-pointer flex items-center justify-center space-x-1.5 ${
            activeTab === "paste"
              ? "border-indigo-600 text-indigo-600 font-extrabold"
              : "border-transparent text-slate-500 hover:text-slate-800"
          }`}
        >
          <ClipboardCopy className="w-3.5 h-3.5" />
          <span>Paste Raw Text</span>
        </button>
      </div>

      {/* Upload Panel */}
      {activeTab === "upload" && (
        <div className="space-y-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileInput}
            accept=".pdf,.txt"
            className="hidden"
          />

          {!selectedFile ? (
            <div
              onDragEnter={handleDrag}
              onDragOver={handleDrag}
              onDragLeave={handleDrag}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all flex flex-col items-center justify-center space-y-3 ${
                isDragActive 
                  ? "border-indigo-500 bg-indigo-50/50" 
                  : "border-slate-200 hover:border-indigo-400 hover:bg-slate-50/50"
              }`}
            >
              <div className="p-3 bg-indigo-50 text-indigo-600 rounded-full">
                <UploadCloud className="w-6 h-6" />
              </div>
              <div className="space-y-1">
                <p className="text-xs font-extrabold text-slate-700">
                  Drag and drop your old resume here
                </p>
                <p className="text-[11px] text-slate-400 font-semibold">
                  Supports PDF (.pdf) or Text (.txt) up to 8MB
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg border border-indigo-100 hover:bg-indigo-100 transition-all">
                Browse System Files
              </span>
            </div>
          ) : (
            <div className="p-4 bg-slate-50 border border-slate-150 rounded-xl flex items-center justify-between">
              <div className="flex items-center space-x-3 min-w-0">
                <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
                  <File className="w-5 h-5" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-bold text-slate-800 truncate">
                    {selectedFile.name}
                  </p>
                  <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                    {(selectedFile.size / 1024).toFixed(1)} KB • {selectedFile.type || "Document"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={clearSelectedFile}
                className="p-1.5 hover:bg-rose-50 hover:text-rose-600 text-slate-400 rounded-md transition-colors cursor-pointer shrink-0"
                title="Remove uploaded file"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}

      {/* Paste Panel */}
      {activeTab === "paste" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-widest flex items-center space-x-1">
              <ClipboardCopy className="w-3.5 h-3.5" />
              <span>Raw Resume Content</span>
            </label>
            <button
              type="button"
              onClick={loadSampleOldText}
              className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 hover:underline bg-indigo-50 px-2 py-0.5 rounded cursor-pointer"
            >
              Load Sample Old Text
            </button>
          </div>

          <textarea
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder="Paste old resume content here... (e.g., Name, Experience, Job Details, Education, Bullet points, Skills)"
            rows={12}
            className="w-full text-xs font-mono p-4 border border-slate-200 rounded-xl bg-slate-50/50 focus:bg-white focus:outline-none focus:ring-1 focus:ring-indigo-500 shadow-inner leading-relaxed resize-y"
          />
        </div>
      )}

      {error && (
        <div className="flex items-start space-x-2 p-3 bg-red-50 text-red-700 text-xs rounded-lg border border-red-100">
          <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="font-semibold leading-normal">{error}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-1 border-t border-slate-100">
        <div className="flex items-center space-x-2 text-[10px] text-slate-400 font-medium">
          <FileText className="w-3.5 h-3.5" />
          <span>Accurately populates contact, skills, and work collections</span>
        </div>

        <button
          type="button"
          onClick={handleParse}
          disabled={isLoading || isFormEmpty}
          className="flex items-center space-x-1.5 text-xs font-bold text-white py-2 px-5 rounded-lg transition-all shadow-md disabled:opacity-50 cursor-pointer"
          style={{
            backgroundColor: colorTheme,
            boxShadow: `${colorTheme}15 0px 4px 6px`
          }}
        >
          {isLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>Parsing and Restructuring...</span>
            </>
          ) : (
            <>
              <span>Parse & Open in Builder</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </>
          )}
        </button>
      </div>
    </div>
  );
}
