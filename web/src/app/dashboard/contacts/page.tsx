"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Users, UsersRound, Upload, Plus, Trash2, Edit } from "lucide-react";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export default function ContactsPage() {
  const [activeTab, setActiveTab] = useState<"contacts" | "groups">("contacts");
  
  const [contacts, setContacts] = useState<any[]>([]);
  const [groups, setGroups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const [showAddModal, setShowAddModal] = useState(false);
  const [newContact, setNewContact] = useState({ phone_number: "", first_name: "", last_name: "" });
  const [savingContact, setSavingContact] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const [contactsRes, groupsRes] = await Promise.all([
      supabase.from("contacts").select("*").order("created_at", { ascending: false }),
      supabase.from("groups").select("*").order("created_at", { ascending: false })
    ]);

    if (contactsRes.data) setContacts(contactsRes.data);
    if (groupsRes.data) setGroups(groupsRes.data);
    setLoading(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    const targetGroupId = e.target.dataset.group;
    if (!file) return;

    setUploading(true);
    
    try {
      if (file.name.endsWith(".csv")) {
        Papa.parse(file, {
          header: true,
          skipEmptyLines: true,
          complete: async (results) => {
            await processImportedData(results.data, targetGroupId);
          }
        });
      } else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
        const reader = new FileReader();
        reader.onload = async (evt) => {
          const bstr = evt.target?.result;
          const wb = XLSX.read(bstr, { type: "binary" });
          const wsname = wb.SheetNames[0];
          const ws = wb.Sheets[wsname];
          const data = XLSX.utils.sheet_to_json(ws);
          await processImportedData(data, targetGroupId);
        };
        reader.readAsBinaryString(file);
      } else {
        alert("Please upload a valid CSV or Excel file.");
        setUploading(false);
      }
    } catch (err) {
      console.error(err);
      alert("Failed to process file.");
      setUploading(false);
    }
  };

  const processImportedData = async (data: any[], targetGroupId?: string) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const formattedContacts = data.map((row: any) => ({
      user_id: session.user.id,
      phone_number: String(row.phone_number || row.phone || row.Phone || row.number || row.Number || "").trim(),
      first_name: String(row.first_name || row.firstName || row.Name || row.name || "").trim(),
      last_name: String(row.last_name || row.lastName || "").trim(),
    })).filter(c => c.phone_number);

    if (formattedContacts.length === 0) {
      alert("No valid phone numbers found. Make sure your column is named 'phone_number', 'phone', or 'number'.");
      setUploading(false);
      return;
    }

    // 1. Upsert contacts
    const { data: insertedContacts, error } = await supabase
      .from("contacts")
      .upsert(formattedContacts, { onConflict: 'user_id, phone_number' })
      .select();

    if (error) {
      console.error(error);
      alert("Error importing contacts.");
    } else {
      // 2. If targetGroupId is provided, link them
      if (targetGroupId && insertedContacts && insertedContacts.length > 0) {
        const groupLinks = insertedContacts.map(c => ({
          group_id: targetGroupId,
          contact_id: c.id
        }));
        await supabase.from("group_contacts").upsert(groupLinks, { onConflict: 'group_id, contact_id' });
      }

      alert(`Successfully imported ${formattedContacts.length} contacts!`);
      fetchData();
    }
    
    setUploading(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const createGroup = async () => {
    const name = prompt("Enter group name:");
    if (!name) return;

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("groups")
      .insert({ user_id: session.user.id, name });

    if (error) {
      alert("Error creating group.");
    } else {
      fetchData();
    }
  };

  const deleteContact = async (id: string) => {
    if (!confirm("Delete this contact?")) return;
    await supabase.from("contacts").delete().eq("id", id);
    fetchData();
  };

  const deleteGroup = async (id: string) => {
    if (!confirm("Delete this group and all its contact associations?")) return;
    await supabase.from("groups").delete().eq("id", id);
    fetchData();
  };

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.phone_number) return;
    setSavingContact(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Which group are they trying to import into?
    const targetGroupId = fileInputRef.current?.dataset.group || null;

    const contactData = {
      user_id: session.user.id,
      phone_number: newContact.phone_number.trim(),
      first_name: newContact.first_name.trim(),
      last_name: newContact.last_name.trim()
    };

    const { data: insertedContacts, error } = await supabase
      .from("contacts")
      .upsert([contactData], { onConflict: 'user_id, phone_number' })
      .select();

    if (!error && insertedContacts && targetGroupId) {
       await supabase.from("group_contacts").upsert([{
          group_id: targetGroupId,
          contact_id: insertedContacts[0].id
        }], { onConflict: 'group_id, contact_id' });
    }

    if (error) {
      alert("Error adding contact: " + error.message);
    } else {
      setShowAddModal(false);
      setNewContact({ phone_number: "", first_name: "", last_name: "" });
      fetchData();
    }
    setSavingContact(false);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">Contacts & Groups</h1>
        <p className="text-zinc-400">Manage your contacts for bulk SMS campaigns.</p>
      </div>

      <div className="flex gap-4 border-b border-white/10 pb-4">
        <button
          onClick={() => setActiveTab("contacts")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "contacts" ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <Users className="w-4 h-4" /> All Contacts
        </button>
        <button
          onClick={() => setActiveTab("groups")}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
            activeTab === "groups" ? "bg-indigo-500/20 text-indigo-400" : "text-zinc-400 hover:text-white hover:bg-white/5"
          }`}
        >
          <UsersRound className="w-4 h-4" /> Groups
        </button>
      </div>

      {activeTab === "contacts" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Contacts ({contacts.length})</h2>
            <div className="flex gap-2 flex-wrap sm:flex-nowrap justify-end w-full sm:w-auto">
              <select
                className="appearance-none bg-white/5 border border-white/10 rounded-lg px-4 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-indigo-500 min-w-[200px]"
                onChange={(e) => {
                  if (fileInputRef.current) {
                    fileInputRef.current.dataset.group = e.target.value;
                  }
                }}
                title="Select a group to import into"
              >
                <option value="" className="bg-black text-white">Import to All Contacts</option>
                {groups.map(g => (
                  <option key={g.id} value={g.id} className="bg-black text-white">Import to: {g.name}</option>
                ))}
              </select>
              <input
                type="file"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e)}
                accept=".csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 border border-indigo-500/20 rounded-lg hover:bg-indigo-500/30 transition-colors disabled:opacity-50 whitespace-nowrap"
              >
                <Upload className="w-4 h-4" />
                {uploading ? "Importing..." : "Excel/CSV"}
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors whitespace-nowrap"
              >
                <Plus className="w-4 h-4" /> Add
              </button>
            </div>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-white/[0.02] text-xs uppercase text-zinc-500 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Name</th>
                  <th className="px-6 py-4 font-medium">Phone Number</th>
                  <th className="px-6 py-4 font-medium">Added On</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {contacts.map((c) => (
                  <tr key={c.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white">
                      {c.first_name} {c.last_name}
                      {!c.first_name && !c.last_name && <span className="text-zinc-500 italic">Unknown</span>}
                    </td>
                    <td className="px-6 py-4 font-mono">{c.phone_number}</td>
                    <td className="px-6 py-4">{new Date(c.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteContact(c.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {contacts.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">No contacts found. Import an Excel/CSV file to get started.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Add Contact Modal */}
          {showAddModal && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-6 w-full max-w-md shadow-2xl">
                <h3 className="text-xl font-semibold text-white mb-4">Add New Contact</h3>
                <form onSubmit={handleAddContact} className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Phone Number</label>
                    <input
                      type="tel"
                      required
                      value={newContact.phone_number}
                      onChange={(e) => setNewContact({...newContact, phone_number: e.target.value})}
                      placeholder="+8801700000000"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">First Name (Optional)</label>
                    <input
                      type="text"
                      value={newContact.first_name}
                      onChange={(e) => setNewContact({...newContact, first_name: e.target.value})}
                      placeholder="John"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-zinc-400 mb-1">Last Name (Optional)</label>
                    <input
                      type="text"
                      value={newContact.last_name}
                      onChange={(e) => setNewContact({...newContact, last_name: e.target.value})}
                      placeholder="Doe"
                      className="w-full px-4 py-2 bg-white/5 border border-white/10 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div className="flex gap-3 pt-4 border-t border-white/10">
                    <button
                      type="button"
                      onClick={() => setShowAddModal(false)}
                      className="flex-1 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={savingContact || !newContact.phone_number}
                      className="flex-1 px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors disabled:opacity-50"
                    >
                      {savingContact ? "Saving..." : "Save Contact"}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}
        </div>
      )}

      {activeTab === "groups" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Groups ({groups.length})</h2>
            <button
              onClick={createGroup}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-500 text-white rounded-lg hover:bg-indigo-600 transition-colors"
            >
              <Plus className="w-4 h-4" /> Create Group
            </button>
          </div>

          <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
            <table className="w-full text-left text-sm text-zinc-400">
              <thead className="bg-white/[0.02] text-xs uppercase text-zinc-500 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 font-medium">Group Name</th>
                  <th className="px-6 py-4 font-medium">Description</th>
                  <th className="px-6 py-4 font-medium">Created On</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {groups.map((g) => (
                  <tr key={g.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-6 py-4 text-white font-medium">{g.name}</td>
                    <td className="px-6 py-4">{g.description || "-"}</td>
                    <td className="px-6 py-4">{new Date(g.created_at).toLocaleDateString()}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => deleteGroup(g.id)} className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
                {groups.length === 0 && !loading && (
                  <tr>
                    <td colSpan={4} className="p-8 text-center text-zinc-500">No groups found. Create a group to organize your contacts.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
