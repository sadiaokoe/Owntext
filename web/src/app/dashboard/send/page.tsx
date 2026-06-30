"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { Send, Smartphone, Loader2, AlertCircle, UsersRound, User } from "lucide-react";
import { motion } from "framer-motion";

export default function SendSMSPage() {
  const [devices, setDevices] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [sendType, setSendType] = useState<"single" | "group" | "bulk_manual">("single");
  const [recipient, setRecipient] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [manualNumbers, setManualNumbers] = useState("");
  const [message, setMessage] = useState("");
  const [selectedDevice, setSelectedDevice] = useState("");

  useEffect(() => {
    fetchData();

    // Subscribe to realtime updates for devices
    const channel = supabase
      .channel('public:devices:send')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'devices' }, () => {
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const isDeviceOnline = (device: any) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeenDate = new Date(device.last_seen_at || 0);
    return device.is_online && lastSeenDate >= fiveMinutesAgo;
  };

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [devicesRes, groupsRes] = await Promise.all([
      supabase.from("devices").select("*").eq("user_id", session.user.id).order("last_seen_at", { ascending: false }),
      supabase.from("groups").select("*").eq("user_id", session.user.id).order("name", { ascending: true })
    ]);

    if (devicesRes.data) {
      // Filter online only & deduplicate by device_name
      const onlineDevices = devicesRes.data.filter(isDeviceOnline);
      const map = new Map<string, any>();
      for (const d of onlineDevices) {
        const key = d.device_name || d.id;
        if (!map.has(key)) {
          map.set(key, d);
        } else {
          const existing = map.get(key)!;
          const dSeen = new Date(d.last_seen_at || 0).getTime();
          const exSeen = new Date(existing.last_seen_at || 0).getTime();
          if (dSeen > exSeen) map.set(key, d);
        }
      }
      const deduped = Array.from(map.values());
      setDevices(deduped);
      if (deduped.length > 0 && !deduped.find(d => d.id === selectedDevice)) {
        setSelectedDevice(deduped[0].id);
      }
    }
    if (groupsRes.data) {
      setGroups(groupsRes.data);
      if (groupsRes.data.length > 0 && !selectedGroup) setSelectedGroup(groupsRes.data[0].id);
    }
    
    setLoading(false);
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDevice || !message) return;
    if (sendType === "single" && !recipient) return;
    if (sendType === "group" && !selectedGroup) return;
    if (sendType === "bulk_manual" && !manualNumbers) return;
    
    setSending(true);
    setError(null);
    setSuccess(null);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const batchId = `batch_${Date.now()}`;
    let insertData = [];

    if (sendType === "single") {
      insertData.push({
        user_id: session.user.id,
        device_id: selectedDevice,
        recipient: recipient,
        message_body: message,
        status: "queued",
        direction: "outbound",
        batch_id: batchId
      });
    } else if (sendType === "bulk_manual") {
      // Split by comma or newline and clean up
      const numbers = manualNumbers.split(/[\n,]+/).map(n => n.trim()).filter(n => n);
      if (numbers.length === 0) {
        setError("Please enter at least one valid phone number.");
        setSending(false);
        return;
      }
      
      insertData = numbers.map(num => ({
        user_id: session.user.id,
        device_id: selectedDevice,
        recipient: num,
        message_body: message,
        status: "queued",
        direction: "outbound",
        batch_id: batchId
      }));
    } else {
      // Fetch all contacts in the group
      const { data: groupContacts, error: groupErr } = await supabase
        .from("group_contacts")
        .select("contacts(phone_number)")
        .eq("group_id", selectedGroup);

      if (groupErr || !groupContacts || groupContacts.length === 0) {
        setError("Error fetching group contacts or group is empty.");
        setSending(false);
        return;
      }

      insertData = groupContacts
        .filter((gc: any) => gc.contacts?.phone_number)
        .map((gc: any) => ({
          user_id: session.user.id,
          device_id: selectedDevice,
          recipient: gc.contacts.phone_number,
          message_body: message,
          status: "queued",
          direction: "outbound",
          batch_id: batchId
        }));
    }

    const { error: insertError } = await supabase.from("messages").insert(insertData);

    if (insertError) {
      setError(insertError.message);
    } else {
      setSuccess(`Successfully queued ${insertData.length} message(s)!`);
      if (sendType === "single") setRecipient("");
      setMessage("");
      setTimeout(() => setSuccess(null), 5000);
    }
    
    setSending(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading...</div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Send SMS</h1>
        <p className="text-zinc-400 mt-2">Queue a single message or run a bulk campaign.</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4 flex-wrap">
        <button
          onClick={() => setSendType("single")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            sendType === "single" ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <User className="w-4 h-4" /> Single Number
        </button>
        <button
          onClick={() => setSendType("bulk_manual")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            sendType === "bulk_manual" ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <UsersRound className="w-4 h-4" /> Multiple Numbers
        </button>
        <button
          onClick={() => setSendType("group")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            sendType === "group" ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <UsersRound className="w-4 h-4" /> Contact Group
        </button>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        key={sendType}
        className="bg-white/[0.02] border border-white/10 rounded-2xl p-8 backdrop-blur-md"
      >
        {devices.length === 0 ? (
          <div className="text-center py-8">
            <AlertCircle className="h-12 w-12 text-amber-500 mx-auto mb-4" />
            <h3 className="text-xl font-medium text-white mb-2">No Online Device</h3>
            <p className="text-zinc-400 mb-4">Open the OwnText app on your phone and start the gateway to send messages.</p>
          </div>
        ) : (
          <form onSubmit={handleSend} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Select Sending Device
              </label>
              <div className="relative">
                <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-zinc-500" />
                <select
                  value={selectedDevice}
                  onChange={(e) => setSelectedDevice(e.target.value)}
                  className="appearance-none block w-full pl-10 pr-4 py-3 border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {devices.map(d => (
                    <option key={d.id} value={d.id} className="bg-black text-white">
                      {d.device_name} ({d.network_type || 'Unknown Network'})
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {sendType === "single" && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Recipient Number
                </label>
                <input
                  type="tel"
                  required
                  value={recipient}
                  onChange={(e) => setRecipient(e.target.value)}
                  placeholder="+8801..."
                  className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-lg shadow-sm placeholder-zinc-600 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            )}
            
            {sendType === "bulk_manual" && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Multiple Numbers (Comma or Newline separated)
                </label>
                <textarea
                  required
                  rows={3}
                  value={manualNumbers}
                  onChange={(e) => setManualNumbers(e.target.value)}
                  placeholder="+88017..., +88018...\n+88019..."
                  className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-lg shadow-sm placeholder-zinc-600 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                />
                <p className="mt-1 text-xs text-zinc-500">Enter as many numbers as you want, separated by commas or new lines.</p>
              </div>
            )}
            
            {sendType === "group" && (
              <div>
                <label className="block text-sm font-medium text-zinc-300 mb-2">
                  Select Target Group
                </label>
                <select
                  required
                  value={selectedGroup}
                  onChange={(e) => setSelectedGroup(e.target.value)}
                  className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-lg shadow-sm bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                >
                  {groups.length === 0 && <option value="" disabled>No groups available</option>}
                  {groups.map(g => (
                    <option key={g.id} value={g.id} className="bg-black text-white">
                      {g.name}
                    </option>
                  ))}
                </select>
                {groups.length === 0 && (
                  <p className="mt-2 text-sm text-amber-400">Please create a group in the Contacts page first.</p>
                )}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-zinc-300 mb-2">
                Message Content
              </label>
              <textarea
                required
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="Type your message here..."
                className="appearance-none block w-full px-4 py-3 border border-white/10 rounded-lg shadow-sm placeholder-zinc-600 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              />
              <div className="mt-2 flex justify-between items-center text-xs text-zinc-500">
                <span>Variables like {'{{name}}'} are not yet supported.</span>
                <span>{message.length} characters • {Math.ceil(message.length / 160)} SMS</span>
              </div>
            </div>

            {error && (
              <div className="text-red-400 text-sm bg-red-400/10 p-3 rounded-lg border border-red-400/20">
                {error}
              </div>
            )}
            
            {success && (
              <div className="text-green-400 text-sm bg-green-400/10 p-3 rounded-lg border border-green-400/20 text-center">
                {success}
              </div>
            )}

            <button
              type="submit"
              disabled={sending || !selectedDevice || (sendType === "group" && !selectedGroup)}
              className="w-full flex justify-center items-center gap-2 py-3 px-4 rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 focus:ring-offset-black transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {sending ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              {sending ? "Queueing Campaign..." : sendType === "group" || sendType === "bulk_manual" ? "Launch Campaign" : "Send SMS"}
            </button>
          </form>
        )}
      </motion.div>
    </div>
  );
}
