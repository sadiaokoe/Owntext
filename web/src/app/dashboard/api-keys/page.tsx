"use client";

import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { Key, Plus, Trash2, Copy, Check, Terminal, Code2, Eye, EyeOff, Smartphone, ChevronDown, Activity, Server } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [devices, setDevices] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({});
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  
  // For interactive docs
  const [selectedKey, setSelectedKey] = useState<string>("");
  const [selectedDevice, setSelectedDevice] = useState<string>("");
  const [showDocs, setShowDocs] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const [keysResponse, devicesResponse] = await Promise.all([
      supabase.from("api_keys").select("*").eq("user_id", session.user.id).order("created_at", { ascending: false }),
      supabase.from("devices").select("*").eq("user_id", session.user.id).order("last_seen_at", { ascending: false })
    ]);

    if (keysResponse.data) {
      setApiKeys(keysResponse.data);
      if (keysResponse.data.length > 0) setSelectedKey(keysResponse.data[0].key_hash);
    }
    
    if (devicesResponse.data) {
      const uniqueDevices = getDeduplicatedDevices(devicesResponse.data);
      setDevices(uniqueDevices);
      if (uniqueDevices.length > 0) setSelectedDevice(uniqueDevices[0].id);
    }
    
    setLoading(false);
  };

  const getDeduplicatedDevices = (rawDevices: any[]) => {
    const map = new Map<string, any>();
    for (const d of rawDevices) {
      const key = d.device_name || d.id;
      const existing = map.get(key);
      if (!existing) {
        map.set(key, d);
      } else {
        const dSeen = new Date(d.last_seen_at || 0).getTime();
        const exSeen = new Date(existing.last_seen_at || 0).getTime();
        if (dSeen > exSeen) map.set(key, d);
      }
    }
    return Array.from(map.values());
  };

  const generateKey = async () => {
    const name = prompt("Enter a name for this API Key (e.g. 'WordPress Plugin'):");
    if (!name) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const rawKey = "owntext_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    const { error } = await supabase
      .from("api_keys")
      .insert({
        user_id: session.user.id,
        name: name,
        key_prefix: "owntext_***",
        key_hash: rawKey
      });

    if (error) {
      alert("Failed to generate API Key");
    } else {
      fetchData();
      alert(`API Key Generated!\n\nPlease copy it now. For security, treat this as a password.`);
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API Key? Any application using it will instantly lose access.")) return;
    await supabase.from("api_keys").delete().eq("id", id);
    fetchData();
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedStates({ ...copiedStates, [id]: true });
    setTimeout(() => {
      setCopiedStates(prev => ({ ...prev, [id]: false }));
    }, 2000);
  };

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const isDeviceOnline = (device: any) => {
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    const lastSeenDate = new Date(device.last_seen_at || 0);
    return device.is_online && lastSeenDate >= fiveMinutesAgo;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  const selectedKeyName = apiKeys.find(k => k.key_hash === selectedKey)?.name || "Selected API Key";
  const selectedDeviceName = devices.find(d => d.id === selectedDevice)?.device_name || "Selected Device";

  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white mb-2">Developer API</h1>
          <p className="text-zinc-400">Integrate OwnText SMS gateway directly into your applications.</p>
        </div>
        <button
          onClick={generateKey}
          className="flex items-center gap-2 px-5 py-2.5 bg-gradient-to-r from-indigo-500 to-violet-500 text-white font-medium rounded-xl hover:from-indigo-400 hover:to-violet-400 transition-all shadow-lg shadow-indigo-500/25 active:scale-95"
        >
          <Plus className="w-5 h-5" /> Generate New Key
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-8">
        {/* API KEYS SECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Key className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Your API Keys</h2>
          </div>
          
          <div className="space-y-4">
            {apiKeys.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center backdrop-blur-md">
                <Key className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No API keys found.</p>
              </div>
            ) : (
              apiKeys.map((k) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                  key={k.id} 
                  className="group relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 hover:border-indigo-500/50 rounded-2xl p-5 transition-all overflow-hidden"
                >
                  <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                  
                  <div className="flex justify-between items-start mb-4 relative z-10">
                    <div>
                      <h3 className="text-white font-medium">{k.name}</h3>
                      <p className="text-xs text-zinc-500 mt-1">Created on {new Date(k.created_at).toLocaleDateString()}</p>
                    </div>
                    <button onClick={() => revokeKey(k.id)} className="p-2 text-red-400/50 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="Revoke API Key">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                  
                  <div className="flex items-center gap-2 relative z-10">
                    <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between group/input">
                      <span className="font-mono text-sm text-zinc-300 truncate mr-4">
                        {revealedKeys[k.id] ? k.key_hash : "owntext_" + "•".repeat(24)}
                      </span>
                      <div className="flex items-center gap-1">
                        <button onClick={() => toggleReveal(k.id)} className="p-1.5 text-zinc-500 hover:text-zinc-300 rounded-md transition-colors" title={revealedKeys[k.id] ? "Hide Key" : "Reveal Key"}>
                          {revealedKeys[k.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                        </button>
                        <button 
                          onClick={() => copyToClipboard(k.key_hash, `key-${k.id}`)} 
                          className="p-1.5 text-indigo-400 hover:text-indigo-300 hover:bg-indigo-500/10 rounded-md transition-colors flex items-center gap-1"
                          title="Copy API Key"
                        >
                          {copiedStates[`key-${k.id}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* DEVICES SECTION */}
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-2">
            <Smartphone className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-semibold text-white">Your Device IDs</h2>
          </div>
          
          <div className="space-y-4">
            {devices.length === 0 ? (
              <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-8 text-center backdrop-blur-md">
                <Smartphone className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
                <p className="text-zinc-400">No devices connected yet.</p>
              </div>
            ) : (
              devices.map((d) => {
                const online = isDeviceOnline(d);
                return (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    key={d.id} 
                    className="group relative bg-zinc-900/50 backdrop-blur-xl border border-white/10 hover:border-emerald-500/50 rounded-2xl p-5 transition-all overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex justify-between items-start mb-4 relative z-10">
                      <div>
                        <h3 className="text-white font-medium flex items-center gap-2">
                          {d.device_name}
                          <span className={`flex items-center gap-1.5 text-xs px-2 py-0.5 rounded-full border ${online ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-zinc-500/10 border-zinc-500/20 text-zinc-400'}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${online ? 'bg-emerald-400 animate-pulse' : 'bg-zinc-400'}`} />
                            {online ? 'Online' : 'Offline'}
                          </span>
                        </h3>
                        <p className="text-xs text-zinc-500 mt-1">Last seen: {d.last_seen_at ? new Date(d.last_seen_at).toLocaleString() : 'Never'}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-2 relative z-10">
                      <div className="flex-1 bg-black/40 border border-white/5 rounded-xl px-4 py-3 flex items-center justify-between">
                        <span className="font-mono text-sm text-zinc-300 truncate mr-4">
                          {d.id}
                        </span>
                        <button 
                          onClick={() => copyToClipboard(d.id, `dev-${d.id}`)} 
                          className="p-1.5 text-emerald-400 hover:text-emerald-300 hover:bg-emerald-500/10 rounded-md transition-colors flex items-center gap-1"
                          title="Copy Device ID"
                        >
                          {copiedStates[`dev-${d.id}`] ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* INTERACTIVE DOCUMENTATION SECTION */}
      <div className="pt-10 border-t border-white/10">
        <button 
          onClick={() => setShowDocs(!showDocs)}
          className="flex items-center justify-between w-full text-left"
        >
          <div>
            <h2 className="text-2xl font-bold text-white mb-2">Interactive Documentation</h2>
            <p className="text-zinc-400">Ready-to-use code snippets with your real API Key and Device ID injected.</p>
          </div>
          <div className="p-2 bg-white/5 rounded-full hover:bg-white/10 transition-colors">
            <ChevronDown className={`w-5 h-5 text-white transition-transform ${showDocs ? 'rotate-180' : ''}`} />
          </div>
        </button>

        <AnimatePresence>
          {showDocs && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden mt-8"
            >
              <div className="bg-zinc-900/80 backdrop-blur-xl border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                {/* Configuration Bar */}
                <div className="p-4 border-b border-white/10 bg-black/20 flex flex-col sm:flex-row gap-4 items-center justify-between">
                  <div className="flex items-center gap-3 text-sm text-zinc-400">
                    <Server className="w-4 h-4" />
                    <span>Live Environment</span>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                    <select 
                      value={selectedKey}
                      onChange={(e) => setSelectedKey(e.target.value)}
                      className="bg-black/50 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-indigo-500 transition-colors"
                    >
                      <option value="" disabled>Select API Key...</option>
                      {apiKeys.map(k => (
                        <option key={k.id} value={k.key_hash}>{k.name}</option>
                      ))}
                    </select>
                    <select 
                      value={selectedDevice}
                      onChange={(e) => setSelectedDevice(e.target.value)}
                      className="bg-black/50 border border-white/10 text-white text-sm rounded-lg px-3 py-2 outline-none focus:border-emerald-500 transition-colors"
                    >
                      <option value="" disabled>Select Device ID...</option>
                      {devices.map(d => (
                        <option key={d.id} value={d.id}>{d.device_name}</option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="p-6 md:p-8 space-y-8">
                  {/* Endpoint Details */}
                  <div>
                    <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">API Endpoint</h3>
                    <div className="flex items-center gap-3 bg-black/40 p-4 rounded-xl border border-white/5">
                      <span className="bg-emerald-500/20 text-emerald-400 font-mono text-xs px-2.5 py-1 rounded-md border border-emerald-500/20">POST</span>
                      <code className="text-zinc-300 font-mono text-sm break-all">https://your-domain.com/api/v1/send</code>
                    </div>
                  </div>

                  {/* Code Snippets */}
                  <div className="grid xl:grid-cols-3 md:grid-cols-2 gap-6">
                    {/* cURL */}
                    <div className="space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                          <Terminal className="w-4 h-4 text-indigo-400" /> cURL
                        </h3>
                        <button 
                          onClick={() => copyToClipboard(`curl -X POST https://your-domain.com/api/v1/send \\
-H "Authorization: Bearer ${selectedKey || 'YOUR_API_KEY'}" \\
-H "Content-Type: application/json" \\
-d '{
  "recipient": "+8801700000000",
  "message": "Hello from OwnText!",
  "device_id": "${selectedDevice || 'YOUR_DEVICE_ID'}"
}'`, 'copy-curl')}
                          className="text-xs flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                        >
                          {copiedStates['copy-curl'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedStates['copy-curl'] ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-black/60 p-5 rounded-xl border border-white/5 overflow-x-auto text-xs font-mono leading-loose text-zinc-300">
<span className="text-emerald-400">curl</span> -X POST https://your-domain.com/api/v1/send \<br/>
-H <span className="text-yellow-300">"Authorization: Bearer {selectedKey || 'YOUR_API_KEY'}"</span> \<br/>
-H <span className="text-yellow-300">"Content-Type: application/json"</span> \<br/>
-d <span className="text-indigo-300">{'{'}</span><br/>
&nbsp;&nbsp;<span className="text-blue-300">"recipient"</span>: <span className="text-orange-300">"+8801700000000"</span>,<br/>
&nbsp;&nbsp;<span className="text-blue-300">"message"</span>: <span className="text-orange-300">"Hello from OwnText!"</span>,<br/>
&nbsp;&nbsp;<span className="text-blue-300">"device_id"</span>: <span className="text-orange-300">"{selectedDevice || 'YOUR_DEVICE_ID'}"</span><br/>
<span className="text-indigo-300">{'}'}</span>'
                      </pre>
                    </div>

                    {/* PHP */}
                    <div className="space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                          <Code2 className="w-4 h-4 text-violet-400" /> PHP (cURL)
                        </h3>
                        <button 
                          onClick={() => copyToClipboard(`<?php
$ch = curl_init('https://your-domain.com/api/v1/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'recipient' => '+8801700000000',
    'message' => 'Hello from OwnText!',
    'device_id' => '${selectedDevice || 'YOUR_DEVICE_ID'}'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer ${selectedKey || 'YOUR_API_KEY'}',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
curl_close($ch);
echo $response;
?>`, 'copy-php')}
                          className="text-xs flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                        >
                          {copiedStates['copy-php'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedStates['copy-php'] ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-black/60 p-5 rounded-xl border border-white/5 overflow-x-auto text-xs font-mono leading-loose text-zinc-300">
<span className="text-zinc-500">&lt;?php</span><br/>
<span className="text-blue-400">$ch</span> = <span className="text-yellow-200">curl_init</span>(<span className="text-orange-300">'https://your-domain.com/api/v1/send'</span>);<br/>
<span className="text-yellow-200">curl_setopt</span>(<span className="text-blue-400">$ch</span>, CURLOPT_POSTFIELDS, <span className="text-yellow-200">json_encode</span>([<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">'recipient'</span> =&gt; <span className="text-orange-300">'+8801700000000'</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">'message'</span> =&gt; <span className="text-orange-300">'Hello from OwnText!'</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">'device_id'</span> =&gt; <span className="text-orange-300">'{selectedDevice || 'YOUR_DEVICE_ID'}'</span><br/>
]));<br/>
<span className="text-yellow-200">curl_setopt</span>(<span className="text-blue-400">$ch</span>, CURLOPT_HTTPHEADER, [<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">'Authorization: Bearer {selectedKey || 'YOUR_API_KEY'}'</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">'Content-Type: application/json'</span><br/>
]);<br/>
<span className="text-blue-400">$response</span> = <span className="text-yellow-200">curl_exec</span>(<span className="text-blue-400">$ch</span>);<br/>
<span className="text-zinc-500">?&gt;</span>
                      </pre>
                    </div>

                    {/* JavaScript (Fetch API) */}
                    <div className="space-y-3 relative group">
                      <div className="flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-medium text-white">
                          <Code2 className="w-4 h-4 text-yellow-400" /> JavaScript (Fetch)
                        </h3>
                        <button 
                          onClick={() => copyToClipboard(`fetch('https://your-domain.com/api/v1/send', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer ${selectedKey || 'YOUR_API_KEY'}',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    recipient: '+8801700000000',
    message: 'Hello from OwnText!',
    device_id: '${selectedDevice || 'YOUR_DEVICE_ID'}'
  })
})
.then(res => res.json())
.then(console.log);`, 'copy-js')}
                          className="text-xs flex items-center gap-1 text-zinc-500 hover:text-white transition-colors"
                        >
                          {copiedStates['copy-js'] ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          {copiedStates['copy-js'] ? 'Copied' : 'Copy'}
                        </button>
                      </div>
                      <pre className="bg-black/60 p-5 rounded-xl border border-white/5 overflow-x-auto text-xs font-mono leading-loose text-zinc-300">
<span className="text-yellow-200">fetch</span>(<span className="text-orange-300">'https://your-domain.com/api/v1/send'</span>, {'{'} <br/>
&nbsp;&nbsp;<span className="text-blue-300">method</span>: <span className="text-orange-300">'POST'</span>,<br/>
&nbsp;&nbsp;<span className="text-blue-300">headers</span>: {'{'} <br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">'Authorization'</span>: <span className="text-orange-300">'Bearer {selectedKey || 'YOUR_API_KEY'}'</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-orange-300">'Content-Type'</span>: <span className="text-orange-300">'application/json'</span><br/>
&nbsp;&nbsp;{'}'},<br/>
&nbsp;&nbsp;<span className="text-blue-300">body</span>: <span className="text-yellow-200">JSON</span>.<span className="text-yellow-200">stringify</span>({'{'} <br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">recipient</span>: <span className="text-orange-300">'+8801700000000'</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">message</span>: <span className="text-orange-300">'Hello from OwnText!'</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span className="text-blue-300">device_id</span>: <span className="text-orange-300">'{selectedDevice || 'YOUR_DEVICE_ID'}'</span><br/>
&nbsp;&nbsp;{'}'})<br/>
{'}'})<br/>
.<span className="text-yellow-200">then</span>(<span className="text-blue-400">res</span> =&gt; <span className="text-blue-400">res</span>.<span className="text-yellow-200">json</span>())<br/>
.<span className="text-yellow-200">then</span>(<span className="text-blue-400">console</span>.<span className="text-yellow-200">log</span>);
                      </pre>
                    </div>

                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
