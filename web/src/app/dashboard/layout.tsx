"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { 
  MessageSquare, 
  LayoutDashboard, 
  Smartphone, 
  Send, 
  Inbox, 
  Key, 
  Settings,
  LogOut,
  AlertCircle
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [loading, setLoading] = useState(true);
  const [isApproved, setIsApproved] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [user, setUser] = useState<any>(null);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    let mounted = true;

    const loadProfile = async (userId: string) => {
      const { data: profile } = await supabase
        .from("profiles")
        .select("is_approved, role")
        .eq("id", userId)
        .single();

      if (mounted && profile) {
        setIsApproved(profile.is_approved);
        setIsAdmin(profile.role === 'admin');
        setLoading(false);
      } else if (mounted) {
        setLoading(false);
      }
    };

    const checkSession = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (mounted && session) {
        setUser(session.user);
        loadProfile(session.user.id);
      } else if (mounted) {
        router.push("/login");
      }
    };
    
    checkSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session) {
        if (mounted) {
          setUser(session.user);
          loadProfile(session.user.id);
        }
      } else {
        if (mounted) {
          router.push("/login");
        }
      }
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [router]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  const navItems = [
    { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
    { name: "Devices", href: "/dashboard/devices", icon: Smartphone },
    { name: "Send SMS", href: "/dashboard/send", icon: Send },
    { name: "Message Log", href: "/dashboard/messages", icon: MessageSquare },
    { name: "Contacts", href: "/dashboard/contacts", icon: Inbox },
    { name: "API Keys", href: "/dashboard/api-keys", icon: Key },
    { name: "Settings", href: "/dashboard/settings", icon: Settings },
  ];

  if (isAdmin) {
    navItems.push({ name: "Admin: Users", href: "/dashboard/admin/users", icon: Settings });
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black flex text-white">
      {/* Sidebar */}
      <aside className="w-64 border-r border-white/10 bg-white/[0.02] flex flex-col hidden md:flex">
        <div className="h-16 flex items-center px-6 border-b border-white/10">
          <Link href="/" className="flex items-center gap-2 relative group">
            <div className="relative flex items-center justify-center h-8 w-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 transition-colors">
              <MessageSquare className="h-4 w-4 text-indigo-400" />
            </div>
            <div className="flex flex-col items-start leading-none justify-center">
              <span className="font-bold text-lg tracking-tight text-white/90 group-hover:text-white transition-colors">OwnText</span>
              <span className="text-[9px] font-semibold text-indigo-400/80 mt-[2px] tracking-[0.2em] uppercase">By Sadi</span>
            </div>
          </Link>
        </div>
        
        <div className="flex-1 py-6 px-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors ${
                  isActive 
                    ? "bg-indigo-500/10 text-indigo-400 font-medium" 
                    : "text-zinc-400 hover:text-white hover:bg-white/5"
                }`}
              >
                <item.icon className={`h-5 w-5 ${isActive ? "text-indigo-400" : "text-zinc-500"}`} />
                {item.name}
              </Link>
            )
          })}
        </div>

        <div className="p-4 border-t border-white/10">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-8 h-8 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400 font-bold">
              {user?.email?.charAt(0).toUpperCase()}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-white truncate">{user?.email}</p>
            </div>
          </div>
          <button
            onClick={handleSignOut}
            className="flex w-full items-center gap-3 px-3 py-2.5 text-sm text-red-400 hover:bg-red-400/10 rounded-lg transition-colors"
          >
            <LogOut className="h-5 w-5" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header would go here */}
        
        <div className="flex-1 overflow-y-auto p-8 relative">
           {/* Background subtle glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-900/10 rounded-full blur-[100px] pointer-events-none" />

          {!isApproved ? (
            <div className="max-w-3xl mx-auto mt-20">
              <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-8 text-center backdrop-blur-md">
                <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
                <h2 className="text-2xl font-bold text-white mb-2">Account Pending Approval</h2>
                <p className="text-amber-200/70 mb-6 max-w-lg mx-auto">
                  Your account has been created successfully, but it needs to be approved by an administrator before you can use the gateway features.
                </p>
                <p className="text-sm text-zinc-400">
                  Please contact the administrator or check back later.
                </p>
              </div>
            </div>
          ) : (
            children
          )}
        </div>
      </main>
    </div>
  );
}
