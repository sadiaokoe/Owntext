import Hero from "@/components/landing/Hero";
import Features from "@/components/landing/Features";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-black text-white">
      <Hero />
      <Features />
      
      {/* How it works section */}
      <section id="how-it-works" className="py-32 border-t border-white/10 relative overflow-hidden">
        {/* Background elements */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-4xl h-[400px] bg-blue-900/20 blur-[120px] rounded-full pointer-events-none" />
        
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
          <div className="text-center mb-24">
            <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl">
              How it works
            </h2>
            <p className="mt-4 text-lg text-zinc-400 max-w-2xl mx-auto">
              Set up your own SMS gateway in less than 5 minutes.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-16 md:gap-12 relative">
            {/* Connecting lines for desktop */}
            <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-[2px] bg-gradient-to-r from-transparent via-white/20 to-transparent z-0"></div>
            
            {[
              { step: 1, title: "Create an Account", desc: "Sign up on the dashboard and generate your secure API Key.", color: "border-blue-500/50 bg-blue-500/10 text-blue-400" },
              { step: 2, title: "Install the App", desc: "Download the OwnText Android app and scan the QR code to connect your device.", color: "border-fuchsia-500/50 bg-fuchsia-500/10 text-fuchsia-400" },
              { step: 3, title: "Start Sending", desc: "Use the REST API or the dashboard to send and receive SMS messages instantly.", color: "border-indigo-500/50 bg-indigo-500/10 text-indigo-400" }
            ].map((item) => (
              <div key={item.step} className="relative z-10 flex flex-col items-center text-center group">
                <div className={`w-24 h-24 rounded-full flex items-center justify-center text-3xl font-bold border ${item.color} mb-8 shadow-lg backdrop-blur-md group-hover:scale-110 transition-transform duration-500`}>
                  {item.step}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{item.title}</h3>
                <p className="text-zinc-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      
      <footer className="py-12 border-t border-white/10 bg-black relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-zinc-500">
          <p>© {new Date().getFullYear()} OwnText. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
