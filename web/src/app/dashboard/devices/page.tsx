"use client";

import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Smartphone, Activity, CheckCircle2, Clock, ChevronDown, ChevronUp, Wifi, WifiOff } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function DevicesPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showOffline, setShowOffline] = useState(false);

  useEffect(() => {
    fetchDevices();
    
    const channel = supabase
      .channel('public:devices')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
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

    const { data } = await supabase
      .from("devices")
      .select("*")
      .eq("user_id", session.user.id)
      .order("last_seen_at", { ascending: false });

    if (data) setDevices(data);
    setLoading(false);
  };

  const isDeviceOnline = (device: any) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeenDate = new Date(device.last_seen_at || 0);
    return device.is_online && lastSeenDate >= fiveMinutesAgo;
  };

  // Deduplicate by device_name — keep the most recently seen entry per name
  const deduplicated = useMemo(() => {
    const map = new Map<string, any>();
    for (const d of devices) {
      const key = d.device_name || d.id;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, d);
      } else {
        // prefer online over offline; if both same status, prefer more recent
        const dOnline = isDeviceOnline(d);
        const exOnline = isDeviceOnline(existing);
        if (dOnline && !exOnline) {
          map.set(key, d);
        } else if (dOnline === exOnline) {
          const dSeen = new Date(d.last_seen_at || 0).getTime();
          const exSeen = new Date(existing.last_seen_at || 0).getTime();
          if (dSeen > exSeen) map.set(key, d);
        }
      }
    }
    return Array.from(map.values());
  }, [devices]);

  const onlineDevices = deduplicated.filter(isDeviceOnline);
  const offlineDevices = deduplicated.filter(d => !isDeviceOnline(d));

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Devices</h1>
          <p className="text-zinc-400 mt-2">Manage your connected Android phones.</p>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12 text-zinc-500">Loading devices...</div>
      ) : deduplicated.length === 0 ? (
        <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-12 text-center backdrop-blur-md">
          <Smartphone className="h-16 w-16 text-zinc-600 mx-auto mb-4" />
          <h3 className="text-xl font-medium text-white mb-2">No devices connected</h3>
          <p className="text-zinc-400 mb-6">Install the Android app and use an API key to connect your phone.</p>
        </div>
      ) : (
        <>
          {/* Online Devices — Big Prominent Cards */}
          {onlineDevices.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {onlineDevices.map((device, i) => (
                <motion.div
                  key={device.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.1 }}
                  className="bg-white/[0.02] border border-green-500/20 rounded-2xl p-6 backdrop-blur-md relative overflow-hidden group"
                >
                  {/* Green glow effect */}
                  <div className="absolute top-0 right-0 w-32 h-32 bg-green-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
                  
                  <div className="flex justify-between items-start mb-4 relative">
                    <div className="h-12 w-12 rounded-xl bg-green-500/10 flex items-center justify-center">
                      <Smartphone className="h-6 w-6 text-green-400" />
                    </div>
                    <div className="px-3 py-1 rounded-full text-xs font-medium border text-green-400 bg-green-500/10 border-green-500/20 flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                      Online
                    </div>
                  </div>
                  
                  <h3 className="text-lg font-semibold text-white mb-1">{device.device_name}</h3>
                  <p className="text-zinc-500 font-mono text-xs mb-6 truncate">{device.id}</p>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 flex items-center gap-2"><Activity className="h-4 w-4" /> Battery</span>
                      <span className="text-white font-medium">{device.battery_level || 0}%</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 flex items-center gap-2"><Wifi className="h-4 w-4" /> Signal</span>
                      <span className="text-white font-medium">{device.network_type || 'Unknown'}</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-zinc-400 flex items-center gap-2"><Clock className="h-4 w-4" /> Last Seen</span>
                      <span className="text-green-400 font-medium">{device.last_seen_at ? new Date(device.last_seen_at).toLocaleTimeString() : 'Never'}</span>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 text-center backdrop-blur-md mb-8">
              <WifiOff className="h-10 w-10 text-zinc-600 mx-auto mb-3" />
              <h3 className="text-lg font-medium text-white mb-1">No device online</h3>
              <p className="text-zinc-500 text-sm">Open the OwnText app on your phone and start the gateway.</p>
            </div>
          )}

          {/* Offline Devices — Small Collapsible List */}
          {offlineDevices.length > 0 && (
            <div>
              <button
                onClick={() => setShowOffline(!showOffline)}
                className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-300 transition-colors mb-3"
              >
                {showOffline ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                {offlineDevices.length} offline device{offlineDevices.length > 1 ? 's' : ''}
              </button>

              <AnimatePresence>
                {showOffline && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="space-y-2 overflow-hidden"
                  >
                    {offlineDevices.map((device) => (
                      <div
                        key={device.id}
                        className="flex items-center justify-between bg-white/[0.02] border border-white/5 rounded-xl px-4 py-3 text-sm"
                      >
                        <div className="flex items-center gap-3">
                          <Smartphone className="h-4 w-4 text-zinc-600" />
                          <span className="text-zinc-400">{device.device_name}</span>
                        </div>
                        <span className="text-zinc-600 text-xs">
                          {device.last_seen_at ? new Date(device.last_seen_at).toLocaleString() : 'Never seen'}
                        </span>
                      </div>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </>
      )}
    </div>
  );
}
