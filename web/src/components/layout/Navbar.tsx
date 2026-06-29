"use client";

import Link from "next/link";
import { MessageSquare, Menu, X } from "lucide-react";
import { useState } from "react";
import { usePathname } from "next/navigation";

export default function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/50 backdrop-blur-xl border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex-shrink-0 flex items-center gap-2">
            <MessageSquare className="h-8 w-8 text-indigo-500" />
            <span className="font-bold text-xl tracking-tight text-white">OwnText</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <Link href="#features" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm text-zinc-400 hover:text-white transition-colors">
              How it works
            </Link>
            <Link href="/docs" className="text-sm text-zinc-400 hover:text-white transition-colors">
              Docs
            </Link>
          </div>

          <div className="hidden md:flex items-center space-x-4">
            <Link href="/login" className="text-sm font-medium text-zinc-300 hover:text-white transition-colors">
              Log in
            </Link>
            <Link href="/register" className="text-sm font-medium bg-white text-black px-5 py-2 rounded-full hover:bg-zinc-200 transition-colors">
              Get Started
            </Link>
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden flex items-center">
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="text-zinc-400 hover:text-white focus:outline-none"
            >
              {isOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden bg-black/95 backdrop-blur-xl border-b border-white/10">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link href="#features" className="block px-3 py-2 text-base font-medium text-zinc-400 hover:text-white">
              Features
            </Link>
            <Link href="#how-it-works" className="block px-3 py-2 text-base font-medium text-zinc-400 hover:text-white">
              How it works
            </Link>
            <Link href="/docs" className="block px-3 py-2 text-base font-medium text-zinc-400 hover:text-white">
              Docs
            </Link>
            <Link href="/login" className="block px-3 py-2 text-base font-medium text-indigo-400 hover:text-indigo-300">
              Log in
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}
