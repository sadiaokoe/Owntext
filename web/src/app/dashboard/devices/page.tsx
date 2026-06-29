"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Smartphone, Activity, CheckCircle2, Clock } from "lucide-react";
import { motion } from "framer-motion";

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDevices();
    
    // Subscribe to realtime updates for devices
    const channel = supabase
      .channel('public:devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, payload => {
        fetchDevices();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDevices = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data, error } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", session.user.id)
      .order("last_seen_at", { ascending: false });

    if (data) setDevices(data);
    setLoading(false);
  };

  const getStatusColor = (isOnline: boolean, lastSeen: string) => {
    // If last seen is more than 5 minutes ago, consider it offline
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeenDate = new Date(lastSeen || 0);
    
    if (lastSeenDate < fiveMinutesAgo) return "text-zinc-500 bg-zinc-500/10 border-zinc-500/20";
    if (isOnline) return "text-green-400 bg-green-500/10 border-green-500/20";
    return "text-amber-400 bg-amber-500/10 border-amber-500/20";
  };

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Devices</h1>
          <p className="text-zinc-400 mt-2">Manage your connected Android phones.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {loading ? (
          <div className="col-span-full text-center py-12 text-zinc-500">Loading devices...</div>
        ) : devices.length === 0 ? (
          <div className="col-span-full bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
            <Smartphone className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No devices connected</h3>
            <p className="text-zinc-400 mb-6">Install the Android app and use an API key to connect your phone.</p>
          </div>
        ) : (
          devices.map((device, i) => {
             const statusColor = getStatusColor(device.is_online, device.last_seen_at);
             const isOnline = statusColor.includes("green");
             
             return (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="h-12 w-12 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                    <Smartphone className="h-6 w-6 text-indigo-400" />
                  </div>
                  <div className={`px-3 py-1 rounded-full text-xs font-medium border ${statusColor} flex items-center gap-1.5`}>
                    {isOnline && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                    {isOnline ? "Online" : "Offline"}
                  </div>
                </div>
                
                <h3 className="text-lg font-semibold text-white mb-1">{device.device_name}</h3>
                <p className="text-sm text-zinc-500 mb-6 font-mono text-xs">{device.id}</p>
                
                <div className="space-y-3">
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-2"><Activity className="h-4 w-4" /> Battery</span>
                    <span className="text-white font-medium">{device.battery_level || 0}%</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-2"><CheckCircle2 className="h-4 w-4" /> Signal</span>
                    <span className="text-white font-medium">{device.network_type || 'Unknown'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm">
                    <span className="text-zinc-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Last Seen</span>
                    <span className="text-white font-medium">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString() : 'Never'}</span>
                  </div>
                </div>
              </motion.div>
             )
          })
        )}
      </div>
    </div>
  );
}
