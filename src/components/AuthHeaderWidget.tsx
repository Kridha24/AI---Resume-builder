import React, { useState, useEffect } from "react";
import { LogIn, LogOut, User, Loader2, CloudLightning } from "lucide-react";
import { onAuthStateChanged, User as FirebaseUser } from "firebase/auth";
import { auth, signInWithGoogle, logOut } from "../firebase";

interface AuthHeaderWidgetProps {
  onUserChanged?: (user: FirebaseUser | null) => void;
}

export default function AuthHeaderWidget({ onUserChanged }: AuthHeaderWidgetProps) {
  const [user, setUser] = useState<FirebaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setLoading(false);
      if (onUserChanged) {
        onUserChanged(firebaseUser);
      }
    });
    return unsubscribe;
  }, []);

  const handleSignIn = async () => {
    setLoading(true);
    try {
      await signInWithGoogle();
    } catch (err: any) {
      if (err?.code === "auth/popup-closed-by-user" || err?.message?.includes("popup-closed-by-user")) {
        console.log("Sign-in cancelled: user closed the authentication popup window.");
      } else {
        alert("Failed to authenticate with Google. Popups might be blocked.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSignOut = async () => {
    setLoading(true);
    try {
      await logOut();
    } catch (err) {
      alert("Failed to sign out.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center space-x-1.5 text-xs text-slate-400 font-medium">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span className="hidden sm:inline">Connecting Cloud...</span>
      </div>
    );
  }

  if (user) {
    return (
      <div className="flex items-center space-x-3 bg-slate-50 border border-slate-200 py-1.5 px-3 rounded-xl shadow-inner">
        <div className="flex items-center space-x-2">
          {user.photoURL ? (
            <img 
              src={user.photoURL} 
              alt={user.displayName || "User Avatar"} 
              className="w-5.5 h-5.5 rounded-full border border-slate-300"
              referrerPolicy="no-referrer"
            />
          ) : (
            <div className="w-5.5 h-5.5 rounded-full bg-emerald-500 text-white flex items-center justify-center font-bold text-[10px]">
              {user.email?.charAt(0).toUpperCase() || "U"}
            </div>
          )}
          
          <div className="hidden md:block text-left">
            <p className="text-[10px] font-bold text-slate-800 leading-none truncate max-w-[120px]">
              {user.displayName || "Authenticated"}
            </p>
            <p className="text-[8px] text-slate-400 font-semibold leading-none mt-0.5 truncate max-w-[120px]">
              {user.email}
            </p>
          </div>
        </div>

        <button
          onClick={handleSignOut}
          type="button"
          className="p-1 hover:bg-slate-200 text-slate-500 hover:text-red-600 rounded-lg transition-colors cursor-pointer"
          title="Sign Out of Cloud Session"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={handleSignIn}
      type="button"
      className="flex items-center space-x-1.5 text-xs bg-slate-900 hover:bg-slate-800 text-white font-bold py-1.5 px-3.5 rounded-xl transition-all shadow-sm cursor-pointer"
    >
      <LogIn className="w-3.5 h-3.5" />
      <span>Sign In to Save Cloud Files</span>
    </button>
  );
}
