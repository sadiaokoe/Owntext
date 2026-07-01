import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";
import Navbar from "@/components/landing/Navbar";
import Link from "next/link";
import { MessageSquare } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white selection:bg-indigo-500/30">
      <Navbar />
      <Hero />
      
      {/* Premium Stats/Trust Section */}
      <div className="relative z-10 bg-black border-y border-white/5 py-12">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/5 via-transparent to-fuchsia-500/5" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 divide-x divide-white/5">
            {[
              { label: "Uptime SLA", value: "99.99%", color: "text-emerald-400" },
              { label: "Per-Message Cost", value: "$0.00", color: "text-indigo-400" },
              { label: "Global Coverage", value: "190+", color: "text-blue-400" },
              { label: "Setup Time", value: "< 3m", color: "text-fuchsia-400" }
            ].map((stat, i) => (
              <div key={i} className={`flex flex-col items-center justify-center text-center px-4 ${i === 0 ? 'border-none' : ''}`}>
                <div className={`text-4xl sm:text-5xl font-extrabold tracking-tight mb-2 ${stat.color} drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]`}>
                  {stat.value}
                </div>
                <div className="text-sm sm:text-base font-medium text-zinc-500 tracking-wide uppercase">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Features />
      
      {/* How it works section */}
      <section id="how-it-works" className="py-32 border-t border-white/10 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-[400px] bg-indigo-900/10 blur-[150px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-4xl font-extrabold tracking-tight sm:text-5xl text-white mb-6">
              How it works
            </h2>
            <p className="mt-4 text-xl text-zinc-400 max-w-2xl mx-auto font-light">
              Set up your own SMS gateway in less than 3 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-8 relative">
            {/* Animated Connecting lines for desktop */}
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-[2px] bg-white/5 z-0">
               <div className="absolute top-0 left-0 h-full w-full bg-gradient-to-r from-transparent via-indigo-500 to-transparent opacity-50 animate-[shimmer_3s_infinite]" />
            </div>
            
            {[
              { step: 1, title: "Create an Account", desc: "Sign up on the dashboard and generate your secure API Key.", color: "group-hover:border-blue-500/50 group-hover:bg-blue-500/20 text-blue-400 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.3)]", bg: "bg-blue-500/10" },
              { step: 2, title: "Install the App", desc: "Download the OwnText Android app and log in securely to connect your device.", color: "group-hover:border-fuchsia-500/50 group-hover:bg-fuchsia-500/20 text-fuchsia-400 group-hover:shadow-[0_0_30px_rgba(217,70,239,0.3)]", bg: "bg-fuchsia-500/10" },
              { step: 3, title: "Start Sending", desc: "Use the REST API or the dashboard to send and receive SMS messages instantly.", color: "group-hover:border-indigo-500/50 group-hover:bg-indigo-500/20 text-indigo-400 group-hover:shadow-[0_0_30px_rgba(99,102,241,0.3)]", bg: "bg-indigo-500/10" }
            ].map((item) => (
              <div key={item.step} className="relative z-10 flex flex-col items-center text-center group cursor-default">
                <div className={`w-24 h-24 rounded-2xl flex items-center justify-center text-3xl font-bold border border-white/10 ${item.bg} mb-8 backdrop-blur-md transition-all duration-500 ${item.color}`}>
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold mb-3 text-white group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-white group-hover:to-zinc-400 transition-all">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed max-w-sm mx-auto">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      {/* Rich Footer */}
      <footer className="pt-20 pb-10 border-t border-white/10 bg-black relative z-10 overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[200px] bg-indigo-900/10 blur-[100px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
            <div className="md:col-span-1">
              <Link href="/" className="flex items-center gap-2 mb-4">
                <MessageSquare className="h-8 w-8 text-indigo-500" />
                <span className="font-bold text-2xl tracking-tight text-white">OwnText</span>
              </Link>
              <p className="text-zinc-500 text-sm leading-relaxed mb-6">
                Turn your Android device into a powerful SMS Gateway. Zero per-message cost, full developer control.
              </p>
              <div className="flex items-center gap-4 text-zinc-500">
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/></svg>
                </a>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M15 22v-4a4.8 4.8 0 0 0-1-3.5c3 0 6-2 6-5.5.08-1.25-.27-2.48-1-3.5.28-1.15.28-2.35 0-3.5 0 0-1 0-3 1.5-2.64-.5-5.36-.5-8 0C6 2 5 2 5 2c-.3 1.15-.3 2.35 0 3.5A5.403 5.403 0 0 0 4 9c0 3.5 3 5.5 6 5.5-.39.49-.68 1.05-.85 1.65-.17.6-.22 1.23-.15 1.85v4"/><path d="M9 18c-4.51 2-5-2-7-2"/></svg>
                </a>
                <a href="#" className="hover:text-indigo-400 transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
                </a>
              </div>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><Link href="#features" className="hover:text-indigo-400 transition-colors">Features</Link></li>
                <li><Link href="#how-it-works" className="hover:text-indigo-400 transition-colors">How it works</Link></li>
                <li><Link href="/docs" className="hover:text-indigo-400 transition-colors">API Reference</Link></li>
                <li><Link href="/pricing" className="hover:text-indigo-400 transition-colors">Pricing</Link></li>
              </ul>
            </div>
            
            <div>
              <h4 className="text-white font-semibold mb-4">Resources</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Documentation</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Blog</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Community</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Help Center</a></li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-zinc-500">
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-indigo-400 transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/10 text-center text-sm text-zinc-600 flex flex-col md:flex-row justify-between items-center gap-4">
            <p>© {new Date().getFullYear()} OwnText. All rights reserved.</p>
            <p className="flex items-center gap-1">Designed with <span className="text-fuchsia-500">♥</span> for developers</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
