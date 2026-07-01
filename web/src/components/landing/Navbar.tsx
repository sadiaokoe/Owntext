"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { MessageSquare } from "lucide-react";
import { useEffect, useState } from "react";

export default function Navbar() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <motion.nav 
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: "easeOut" }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        scrolled 
          ? "py-3 bg-black/50 backdrop-blur-xl border-b border-white/10 shadow-[0_4px_30px_rgba(0,0,0,0.5)]" 
          : "py-6 bg-transparent border-transparent"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex justify-between items-center">
        <Link href="/" className="flex items-center gap-2 group">
          <div className="relative flex items-center justify-center h-10 w-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 group-hover:bg-indigo-500/20 group-hover:scale-105 transition-all duration-300">
            <MessageSquare className="h-5 w-5 text-indigo-400" />
            <div className="absolute inset-0 bg-indigo-400/20 blur-md rounded-xl opacity-0 group-hover:opacity-100 transition-opacity" />
          </div>
          <span className="font-bold text-2xl tracking-tight text-white/90 group-hover:text-white transition-colors">OwnText</span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          <Link href="#features" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">Features</Link>
          <Link href="#how-it-works" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">How it works</Link>
          <Link href="/docs" className="text-sm font-medium text-zinc-400 hover:text-white transition-colors">API Docs</Link>
        </div>

        <div className="flex items-center gap-4">
          <Link href="/login" className="hidden md:block text-sm font-medium text-zinc-300 hover:text-white transition-colors">
            Sign In
          </Link>
          <Link href="/register" className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-fuchsia-500 rounded-lg blur opacity-60 group-hover:opacity-100 transition duration-300"></div>
            <div className="relative px-5 py-2.5 bg-black rounded-lg leading-none flex items-center">
              <span className="text-sm font-medium text-white group-hover:text-indigo-200 transition-colors">Dashboard</span>
            </div>
          </Link>
        </div>
      </div>
    </motion.nav>
  );
}
