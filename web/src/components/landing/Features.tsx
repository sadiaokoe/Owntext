"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Shield, Globe, Zap, Cpu, Bell, Smartphone } from "lucide-react";

export default function Features() {
  const features = [
    {
      icon: Zap,
      title: "No Per-Message Cost",
      description: "Unlike Twilio or MessageBird, you only pay your carrier's standard rate. If you have an unlimited plan, it's essentially free.",
      color: "from-amber-400 to-orange-500"
    },
    {
      icon: Globe,
      title: "Real-time Dashboard",
      description: "Monitor your connected devices, message queues, and delivery statuses in real-time, powered by Supabase WebSockets.",
      color: "from-blue-400 to-indigo-500"
    },
    {
      icon: Cpu,
      title: "Developer REST API",
      description: "Integrate with any platform using our simple REST API. Send messages, check status, and manage devices programmatically.",
      color: "from-fuchsia-400 to-pink-500"
    },
    {
      icon: Bell,
      title: "Webhook Support",
      description: "Get notified instantly when a message is sent, delivered, or when you receive an incoming SMS on your device.",
      color: "from-emerald-400 to-teal-500"
    },
    {
      icon: Smartphone, // Wait, I need to import Smartphone. Let's use CheckCircle2 for now or import it.
      title: "Multi-Device Support",
      description: "Connect multiple Android phones to scale your throughput and handle high volume messaging automatically.",
      color: "from-cyan-400 to-blue-500"
    },
    {
      icon: Shield,
      title: "Secure & Private",
      description: "Your data is secured by Supabase Row Level Security. Only you have access to your messages and API keys.",
      color: "from-violet-400 to-purple-500"
    },
  ];

  return (
    <section id="features" className="py-32 bg-black relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-900/20 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-fuchsia-900/10 rounded-full blur-[150px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-4xl md:text-5xl font-extrabold tracking-tight text-white mb-6"
          >
            Everything you need for an <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-fuchsia-400">
              Enterprise SMS Gateway
            </span>
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6, delay: 0.1 }}
            className="text-xl text-zinc-400 max-w-2xl mx-auto"
          >
            A complete solution with a powerful API, real-time dashboard, and a reliable Android client.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: index * 0.1 }}
              className="group relative bg-white/[0.02] border border-white/5 p-8 rounded-3xl hover:bg-white/[0.05] hover:border-white/10 transition-all duration-300"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-white/[0.02] to-transparent rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity" />
              
              <div className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-6 bg-gradient-to-br ${feature.color} shadow-lg shadow-black/50`}>
                <feature.icon className="h-6 w-6 text-white" />
              </div>
              
              <h3 className="text-xl font-semibold mb-3 text-white">{feature.title}</h3>
              <p className="text-zinc-400 leading-relaxed group-hover:text-zinc-300 transition-colors">{feature.description}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
