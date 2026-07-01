"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowRight, Smartphone, Code, Zap } from "lucide-react";

export default function Hero() {
  return (
    <div className="relative pt-32 pb-20 sm:pt-40 sm:pb-32 overflow-hidden bg-black min-h-screen flex flex-col justify-center">
      {/* Dynamic Animated Background Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[25%] -left-[10%] w-[50%] h-[50%] rounded-full bg-indigo-600/30 blur-[120px] mix-blend-screen animate-[pulse_8s_ease-in-out_infinite]" />
        <div className="absolute top-[20%] -right-[10%] w-[40%] h-[40%] rounded-full bg-fuchsia-600/30 blur-[120px] mix-blend-screen animate-[pulse_10s_ease-in-out_infinite_delay-700ms]" />
        <div className="absolute -bottom-[10%] left-[20%] w-[60%] h-[60%] rounded-full bg-blue-600/20 blur-[150px] mix-blend-screen animate-[pulse_12s_ease-in-out_infinite_delay-1000ms]" />
        
        {/* Subtle grid pattern */}
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20 brightness-100 contrast-150" />
        <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)]" />
      </div>
      
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 w-full">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-8 items-center">
          
          {/* Text Content */}
          <div className="text-left text-center lg:text-left">
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
              className="text-5xl sm:text-7xl font-extrabold tracking-tight mb-6 text-white leading-[1.1]"
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
              className="mt-6 text-xl text-zinc-300 max-w-xl mb-10 leading-relaxed font-light mx-auto lg:mx-0"
            >
              Ditch expensive SMS providers. OwnText connects your Android phone's SIM card to a powerful REST API and Web Dashboard. 
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4"
            >
              <Link href="/register" className="group w-full sm:w-auto px-8 py-4 rounded-full bg-white text-black font-semibold hover:scale-105 hover:shadow-[0_0_30px_rgba(255,255,255,0.3)] transition-all duration-300 flex items-center justify-center gap-2">
                Start for free 
                <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/docs" className="w-full sm:w-auto px-8 py-4 rounded-full bg-white/5 text-white font-medium hover:bg-white/10 backdrop-blur-md transition-all duration-300 flex items-center justify-center gap-2 border border-white/10 hover:border-white/20">
                View Documentation
              </Link>
            </motion.div>
          </div>

          {/* Minimal Code Editor */}
          <motion.div 
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            className="w-full lg:max-w-lg lg:ml-auto"
          >
            <div className="rounded-2xl overflow-hidden bg-[#0c0c0e] border border-white/10 shadow-2xl relative">
              {/* Subtle top gradient */}
              <div className="absolute top-0 inset-x-0 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />
              
              {/* Editor Header */}
              <div className="flex items-center px-4 py-3 bg-[#111113] border-b border-white/5">
                <div className="flex gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20" />
                </div>
                <div className="flex-1 text-center text-[11px] font-medium text-zinc-500 font-mono tracking-wider">
                  send-sms.js
                </div>
              </div>
              
              {/* Editor Body */}
              <div className="p-6 font-mono text-[13px] sm:text-sm leading-relaxed overflow-hidden text-left bg-transparent">
                <div className="flex">
                  <div className="select-none text-zinc-600 text-right pr-4 border-r border-white/5 mr-4 hidden sm:block">
                    1<br/>2<br/>3<br/>4<br/>5<br/>6<br/>7<br/>8
                  </div>
                  <div className="text-zinc-300">
                    <div>
                      <span className="text-indigo-400">const</span> response = <span className="text-indigo-400">await</span> owntext.messages.<span className="text-blue-400">send</span>(&#123;
                    </div>
                    <div className="pl-4">
                      <span className="text-zinc-400">to:</span> <span className="text-emerald-400">"+8801712345678"</span>,
                    </div>
                    <div className="pl-4">
                      <span className="text-zinc-400">message:</span> <span className="text-emerald-400">"Hello from OwnText!"</span>
                    </div>
                    <div>&#125;);</div>
                    <br/>
                    <div className="text-zinc-500">
                      // Response
                    </div>
                    <div>
                      console.<span className="text-blue-400">log</span>(response);
                    </div>
                    <div className="text-zinc-500 mt-1">
                      <span className="text-zinc-600">{`> `}</span> 
                      &#123; <span className="text-zinc-400">id:</span> <span className="text-emerald-400">"msg_123"</span>, <span className="text-zinc-400">status:</span> <span className="text-emerald-400">"queued"</span> &#125;
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>

        {/* Feature quick hit with Glassmorphism */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.5, ease: "easeOut" }}
          className="mt-32 grid grid-cols-1 md:grid-cols-3 gap-6"
        >
          {[
            { icon: Smartphone, title: "Use Your Own SIM", desc: "Send from your personal or business number that your customers already trust.", color: "text-indigo-400", bg: "bg-indigo-500/10", border: "border-indigo-500/20" },
            { icon: Code, title: "Developer Friendly", desc: "Simple REST API with API keys and webhook support for seamless integration.", color: "text-fuchsia-400", bg: "bg-fuchsia-500/10", border: "border-fuchsia-500/20" },
            { icon: Zap, title: "Supabase Powered", desc: "Blazing fast real-time updates and edge functions running on Supabase.", color: "text-blue-400", bg: "bg-blue-500/10", border: "border-blue-500/20" }
          ].map((feature, i) => (
            <div key={i} className={`flex flex-col items-center lg:items-start text-center lg:text-left p-6 rounded-3xl bg-white/[0.02] border ${feature.border} backdrop-blur-sm hover:bg-white/[0.04] hover:-translate-y-1 transition-all duration-300`}>
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
