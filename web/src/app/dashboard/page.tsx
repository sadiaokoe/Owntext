"use client";

import { motion } from "framer-motion";
import { Smartphone, Send, Clock, CheckCircle2 } from "lucide-react";

export default function DashboardOverview() {
  const stats = [
    { name: "Messages Sent Today", value: "0", icon: Send, color: "text-blue-400", bg: "bg-blue-500/10" },
    { name: "Active Devices", value: "0", icon: Smartphone, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { name: "Queued Messages", value: "0", icon: Clock, color: "text-amber-400", bg: "bg-amber-500/10" },
    { name: "Success Rate", value: "100%", icon: CheckCircle2, color: "text-indigo-400", bg: "bg-indigo-500/10" },
  ];

  return (
    <div className="max-w-6xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">Dashboard Overview</h1>
        <p className="text-zinc-400 mt-2">Welcome to your OwnText SMS Gateway.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: i * 0.1 }}
            className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md"
          >
            <div className="flex items-center justify-between mb-4">
              <div className={`h-12 w-12 rounded-xl ${stat.bg} flex items-center justify-center`}>
                <stat.icon className={`h-6 w-6 ${stat.color}`} />
              </div>
            </div>
            <p className="text-sm font-medium text-zinc-400">{stat.name}</p>
            <p className="text-3xl font-bold text-white mt-1">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md min-h-[300px]"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Recent Activity</h2>
          <div className="flex flex-col items-center justify-center h-48 text-zinc-500">
            <p>No recent activity found.</p>
            <p className="text-sm mt-1">Connect a device to start sending messages.</p>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.5 }}
          className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 backdrop-blur-md min-h-[300px]"
        >
          <h2 className="text-xl font-semibold text-white mb-6">Getting Started</h2>
          <ol className="space-y-4">
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold mt-0.5">1</div>
              <div>
                <p className="text-white font-medium">Generate an API Key</p>
                <p className="text-sm text-zinc-400">Go to API Keys section and create a new key.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold mt-0.5">2</div>
              <div>
                <p className="text-white font-medium">Connect a Device</p>
                <p className="text-sm text-zinc-400">Download the Android app and scan the QR code from the Devices tab.</p>
              </div>
            </li>
            <li className="flex items-start gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-indigo-500/20 text-indigo-400 flex items-center justify-center text-sm font-bold mt-0.5">3</div>
              <div>
                <p className="text-white font-medium">Send your first SMS</p>
                <p className="text-sm text-zinc-400">Use the dashboard or the REST API to send a message.</p>
              </div>
            </li>
          </ol>
        </motion.div>
      </div>
    </div>
  );
}
