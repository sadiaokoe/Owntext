"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { Key, Plus, Trash2, Copy, Check, Terminal, Code2 } from "lucide-react";

export default function ApiKeysPage() {
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  useEffect(() => {
    fetchKeys();
  }, []);

  const fetchKeys = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("api_keys")
      .select("*")
      .eq("user_id", session.user.id)
      .order("created_at", { ascending: false });

    if (data) setApiKeys(data);
    setLoading(false);
  };

  const generateKey = async () => {
    const name = prompt("Enter a name for this API Key (e.g. 'WordPress Plugin'):");
    if (!name) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Generate a random key
    const rawKey = "owntext_" + Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
    
    // In a production app, we would hash this key and only show the rawKey once.
    // Since this is V1, we store it plain in key_hash for simplicity and easy retrieval.
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
      fetchKeys();
      // Show the key to the user (since they might not see it again if it was hashed)
      alert(`API Key Generated: \n\n${rawKey}\n\nPlease copy this immediately.`);
    }
  };

  const revokeKey = async (id: string) => {
    if (!confirm("Are you sure you want to revoke this API Key? Any application using it will instantly lose access.")) return;
    
    await supabase.from("api_keys").delete().eq("id", id);
    fetchKeys();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKey(text);
    setTimeout(() => setCopiedKey(null), 2000);
  };

  if (loading) {
    return <div className="p-8 text-center text-zinc-500">Loading API Keys...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-10">
      <div>
        <h1 className="text-3xl font-bold text-white mb-2">Developer API</h1>
        <p className="text-zinc-400">Generate API Keys to integrate OwnText with your own software, websites, or servers.</p>
      </div>

      {/* API Keys Management */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-white">Your API Keys</h2>
          <button
            onClick={generateKey}
            className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
          >
            <Plus className="w-4 h-4" /> Create API Key
          </button>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
          <table className="w-full text-left text-sm text-zinc-400">
            <thead className="bg-white/[0.02] text-xs uppercase text-zinc-500 border-b border-white/10">
              <tr>
                <th className="px-6 py-4 font-medium">Name</th>
                <th className="px-6 py-4 font-medium">API Key (Secret)</th>
                <th className="px-6 py-4 font-medium">Created On</th>
                <th className="px-6 py-4 font-medium">Last Used</th>
                <th className="px-6 py-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {apiKeys.map((k) => (
                <tr key={k.id} className="hover:bg-white/[0.02] transition-colors">
                  <td className="px-6 py-4 text-white font-medium">{k.name}</td>
                  <td className="px-6 py-4 font-mono">
                    <div className="flex items-center gap-2">
                      <span className="truncate max-w-[150px] inline-block">{k.key_hash}</span>
                      <button onClick={() => copyToClipboard(k.key_hash)} className="text-indigo-400 hover:text-indigo-300">
                        {copiedKey === k.key_hash ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </td>
                  <td className="px-6 py-4">{new Date(k.created_at).toLocaleDateString()}</td>
                  <td className="px-6 py-4">{k.last_used_at ? new Date(k.last_used_at).toLocaleDateString() : "Never"}</td>
                  <td className="px-6 py-4 text-right">
                    <button onClick={() => revokeKey(k.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </td>
                </tr>
              ))}
              {apiKeys.length === 0 && (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-zinc-500">You haven't generated any API keys yet.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Developer Docs */}
      <div className="space-y-6 pt-8 border-t border-white/10">
        <div>
          <h2 className="text-xl font-semibold text-white mb-2">Integration Documentation</h2>
          <p className="text-zinc-400 text-sm">Use this endpoint to programmatically queue an SMS. Ensure your Android device is online with the Gateway Service running to process the queue.</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-4 border border-zinc-800">
          <div className="flex items-center gap-2 mb-4">
            <span className="bg-emerald-500/10 text-emerald-400 font-mono text-xs px-2 py-1 rounded">POST</span>
            <code className="text-sm text-zinc-300">https://your-domain.com/api/v1/send</code>
          </div>

          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">Headers</h3>
              <div className="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-sm">
                <div className="text-indigo-300">Authorization: <span className="text-zinc-300">Bearer {'<YOUR_API_KEY>'}</span></div>
                <div className="text-indigo-300">Content-Type: <span className="text-zinc-300">application/json</span></div>
              </div>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-2">JSON Body</h3>
              <div className="bg-black/50 p-3 rounded-lg border border-white/5 font-mono text-sm text-zinc-300">
                {`{
  "recipient": "+8801700000000",
  "message": "Hello from OwnText API!",
  "device_id": "optional-device-uuid" // Will use default if omitted
}`}
              </div>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-white">
              <Terminal className="w-4 h-4 text-indigo-400" /> cURL Example
            </h3>
            <pre className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed">
{`curl -X POST https://your-domain.com/api/v1/send \\
-H "Authorization: Bearer YOUR_API_KEY" \\
-H "Content-Type: application/json" \\
-d '{
  "recipient": "+8801700000000",
  "message": "API Test"
}'`}
            </pre>
          </div>

          <div className="space-y-2">
            <h3 className="flex items-center gap-2 text-sm font-medium text-white">
              <Code2 className="w-4 h-4 text-indigo-400" /> PHP Example
            </h3>
            <pre className="bg-zinc-900 p-4 rounded-xl border border-zinc-800 overflow-x-auto text-xs text-zinc-300 font-mono leading-relaxed">
{`$ch = curl_init('https://your-domain.com/api/v1/send');
curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
    'recipient' => '+8801700000000',
    'message' => 'API Test'
]));
curl_setopt($ch, CURLOPT_HTTPHEADER, [
    'Authorization: Bearer YOUR_API_KEY',
    'Content-Type: application/json'
]);
$response = curl_exec($ch);
curl_close($ch);`}
            </pre>
          </div>
        </div>
      </div>
    </div>
  );
}
