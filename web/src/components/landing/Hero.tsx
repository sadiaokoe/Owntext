"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Smartphone, Code, Zap } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden bg-black min-h-screen flex flex-col justify-center">
      {/* Dynamic Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen animate-pulse" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/30 blur-[120px] mix-blend-screen animate-pulse delay-700" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[150px] mix-blend-screen animate-pulse delay-1000" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: "easeOut" }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/5 border border-white/10 backdrop-blur-md text-sm mb-8 text-indigo-200 shadow-[0_0_15px_rgba(79,70,229,0.3)]"
        >
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-500"></span>
          </span>
          Turn your Android into an SMS Gateway
        </motion.div>

        <motion.h1 
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.7, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 text-white"
        >
          Send SMS via API, <br className="hidden sm:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-fuchsia-400 to-blue-400 animate-gradient-x">
            Zero Per-Message Cost.
          </span>
        </motion.h1>

        <motion.p 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
          className="mt-6 text-xl text-zinc-300 max-w-2xl mx-auto mb-10 leading-relaxed font-light"
        >
          Ditch expensive SMS providers. OwnText connects your Android phone's SIM card to a powerful REST API and Web Dashboard. 
        </motion.p>

        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
          className="flex flex-col sm:flex-row justify-center items-center gap-4"
        >
          <Link href="/register" className="group w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2">
            Start for free 
            <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
          </Link>
          <Link href="/docs" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-medium hover:bg-white/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20">
            View Documentation
          </Link>
        </motion.div>

        {/* Feature quick hit with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
          className="mt-24 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto"
        >
          {[
            { icon: Smartphone, title: "Use Your Own SIM", desc: "Send from your personal or business number that your customers already trust.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
            { icon: Code, title: "Developer Friendly", desc: "Simple REST API with API keys and webhook support for seamless integration.", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
            { icon: Zap, title: "Supabase Powered", desc: "Blazing fast real-time updates and edge functions running on Supabase.", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" }
          ].map((feature, i) => (
            <div key={i} className={`flex flex-col items-center p-6 rounded-3xl bg-white/[0.02] border ${feature.border} backdrop-blur-sm hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300`}>
              <div className={`h-14 w-14 rounded-2xl ${feature.bg} flex items-center justify-center mb-5 shadow-inner`}>
                <feature.icon className={`h-7 w-7 ${feature.color}`} />
              </div>
              <h3 className="font-semibold text-lg mb-2 text-white">{feature.title}</h3>
              <p className="text-zinc-400 text-sm leading-relaxed">{feature.desc}</p>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}
