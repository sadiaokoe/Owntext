"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { User, Lock, Save, Loader2 } from "lucide-react";
import { motion } from "framer-motion";

export default function SettingsPage() {
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  
  const [profile, setProfile] = useState({ full_name: "", email: "" });
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [profileMsg, setProfileMsg] = useState({ text: "", type: "" });
  const [passwordMsg, setPasswordMsg] = useState({ text: "", type: "" });

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("profiles")
      .select("full_name")
      .eq("id", session.user.id)
      .single();

    setProfile({
      full_name: data?.full_name || "",
      email: session.user.email || ""
    });
    setLoading(false);
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setProfileMsg({ text: "", type: "" });

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ full_name: profile.full_name })
      .eq("id", session.user.id);

    if (error) {
      setProfileMsg({ text: error.message, type: "error" });
    } else {
      setProfileMsg({ text: "Profile updated successfully!", type: "success" });
      setTimeout(() => setProfileMsg({ text: "", type: "" }), 3000);
    }
    setSavingProfile(false);
  };

  const handleUpdatePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) {
      setPasswordMsg({ text: "Passwords do not match", type: "error" });
      return;
    }
    if (password.length < 6) {
      setPasswordMsg({ text: "Password must be at least 6 characters", type: "error" });
      return;
    }

    setSavingPassword(true);
    setPasswordMsg({ text: "", type: "" });

    const { error } = await supabase.auth.updateUser({
      password: password
    });

    if (error) {
      setPasswordMsg({ text: error.message, type: "error" });
    } else {
      setPasswordMsg({ text: "Password updated successfully!", type: "success" });
      setPassword("");
      setConfirmPassword("");
      setTimeout(() => setPasswordMsg({ text: "", type: "" }), 3000);
    }
    setSavingPassword(false);
  };

  if (loading) return <div className="p-8 text-center text-zinc-500">Loading settings...</div>;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Settings</h1>
        <p className="text-zinc-400">Manage your profile and account security.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Profile Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md h-fit"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <User className="text-indigo-400 w-5 h-5" />
            <h2 className="text-xl font-semibold text-white">Profile Information</h2>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Email Address</label>
              <input
                type="email"
                disabled
                value={profile.email}
                className="w-full px-4 py-2 border border-white/5 rounded-lg bg-white/5 text-zinc-500 cursor-not-allowed"
              />
              <p className="text-xs text-zinc-500 mt-1">Email cannot be changed.</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Full Name</label>
              <input
                type="text"
                required
                value={profile.full_name}
                onChange={(e) => setProfile({ ...profile, full_name: e.target.value })}
                className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="John Doe"
              />
            </div>

            {profileMsg.text && (
              <div className={`p-3 rounded-lg text-sm ${profileMsg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                {profileMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={savingProfile}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 mt-4"
            >
              {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </form>
        </motion.div>

        {/* Security Settings */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md h-fit"
        >
          <div className="flex items-center gap-3 mb-6 border-b border-white/10 pb-4">
            <Lock className="text-indigo-400 w-5 h-5" />
            <h2 className="text-xl font-semibold text-white">Security</h2>
          </div>

          <form onSubmit={handleUpdatePassword} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">New Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">Confirm New Password</label>
              <input
                type="password"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 border border-white/10 rounded-lg bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                placeholder="••••••••"
              />
            </div>

            {passwordMsg.text && (
              <div className={`p-3 rounded-lg text-sm ${passwordMsg.type === 'error' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : 'bg-green-500/10 text-green-400 border border-green-500/20'}`}>
                {passwordMsg.text}
              </div>
            )}

            <button
              type="submit"
              disabled={savingPassword || !password}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors disabled:opacity-50 mt-4"
            >
              {savingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Update Password
            </button>
          </form>
        </motion.div>
      </div>
    </div>
  );
}
