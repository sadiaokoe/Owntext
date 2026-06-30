"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { MessageSquare, CheckCircle2, Clock, AlertCircle, RefreshCw, ArrowUpRight, ArrowDownLeft } from "lucide-react";
import { motion } from "framer-motion";

export default function MessageLogsPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchMessages();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('public:messages')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'messages' }, payload => {
        fetchMessages(false);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchMessages = async (showLoader = true) => {
    if (showLoader) setLoading(true);
    else setRefreshing(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("messages")
      .select("*, devices(device_name)")
      .eq("user_id", session.user.id)
      .neq("status", "delivered")
      .order("created_at", { ascending: false })
      .limit(50);

    if (data) setMessages(data);
    setLoading(false);
    setRefreshing(false);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent': return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case 'queued': return <Clock className="h-5 w-5 text-amber-500" />;
      case 'failed': return <AlertCircle className="h-5 w-5 text-red-500" />;
      default: return <MessageSquare className="h-5 w-5 text-zinc-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-green-500/10 text-green-400 border border-green-500/20">Sent</span>;
      case 'queued': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/10 text-amber-400 border border-amber-500/20">Queued</span>;
      case 'failed': return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-red-500/10 text-red-400 border border-red-500/20">Failed</span>;
      default: return <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-zinc-500/10 text-zinc-400 border border-zinc-500/20">{status}</span>;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Message Log</h1>
          <p className="text-zinc-400 mt-2">View your recent outgoing and incoming messages.</p>
        </div>
        <button 
          onClick={() => fetchMessages(false)}
          className="p-2 rounded-lg bg-white/5 border border-white/10 text-zinc-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <RefreshCw className={`h-5 w-5 ${refreshing ? "animate-spin text-indigo-400" : ""}`} />
        </button>
      </div>

      <div className="bg-white/[0.02] border border-white/10 rounded-2xl backdrop-blur-md overflow-hidden">
        {loading ? (
          <div className="p-8 text-center text-zinc-500">Loading messages...</div>
        ) : messages.length === 0 ? (
          <div className="p-12 text-center text-zinc-500 flex flex-col items-center">
            <MessageSquare className="h-12 w-12 mb-4 opacity-50" />
            <p>No messages found in your log.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-zinc-400 text-sm bg-white/[0.01]">
                  <th className="px-6 py-4 font-medium w-16">TYPE</th>
                  <th className="px-6 py-4 font-medium">STATUS</th>
                  <th className="px-6 py-4 font-medium">TO</th>
                  <th className="px-6 py-4 font-medium">FROM</th>
                  <th className="px-6 py-4 font-medium">MESSAGE</th>
                  <th className="px-6 py-4 font-medium">DEVICE</th>
                  <th className="px-6 py-4 font-medium text-right">TIME</th>
                </tr>
              </thead>
              <tbody>
                {messages.map((msg) => (
                  <motion.tr 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    key={msg.id} 
                    className="border-b border-white/5 hover:bg-white/[0.02] transition-colors"
                  >
                    <td className="px-6 py-4">
                      {msg.direction === 'outbound' ? (
                        <ArrowUpRight className="h-5 w-5 text-indigo-400" />
                      ) : (
                        <ArrowDownLeft className="h-5 w-5 text-emerald-400" />
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {getStatusBadge(msg.status)}
                    </td>
                    <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                      {msg.direction === 'outbound' ? msg.recipient : '—'}
                    </td>
                    <td className="px-6 py-4 text-white font-medium whitespace-nowrap">
                      {msg.direction === 'inbound' ? msg.recipient : '—'}
                    </td>
                    <td className="px-6 py-4 text-zinc-300 text-sm max-w-xs truncate" title={msg.message_body}>
                      {msg.message_body}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm whitespace-nowrap">
                      {msg.devices?.device_name || "Unknown"}
                    </td>
                    <td className="px-6 py-4 text-zinc-400 text-sm text-right whitespace-nowrap">
                      {new Date(msg.created_at).toLocaleString(undefined, {
                        month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                      })}
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
