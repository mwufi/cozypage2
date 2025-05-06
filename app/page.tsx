import Image from "next/image";
import { loadConfiguration } from "@/app/landing/helpers";
import HamburgerMenu from "@/app/HamburgerMenu";

export default function Home() {
  // Load configuration for taglines
  const config = loadConfiguration();

  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A0B2E] via-[#1D1F59] to-[#0A0B2E] relative overflow-hidden text-white font-sans m-3 rounded-3xl p-3">
      {/* Radial gradient decorations */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 right-1/3 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold">
          Ara <span className="bg-gradient-to-r from-blue-400 via-indigo-500 to-violet-600 bg-clip-text text-transparent animate-gradient-x">Companion</span>
        </div>
        <HamburgerMenu />
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-24">
        {/* Hero Header */}
        <header id="hero" className="flex flex-col items-center mb-24 pt-20">
          <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight mb-8">
            <span className="inline-block text-blue-300">{config.tagline}</span>
          </h1>

          <p className="text-xl text-white/80 text-center max-w-2xl mb-12">
            {config.subtagline}
          </p>

          <div className="flex gap-6 flex-col sm:flex-row">
            <a href="#beta" className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-8 py-3 rounded-full font-medium flex items-center justify-center">
              Meet Your Ara
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M12.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L14.586 11H3a1 1 0 110-2h11.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </a>
            <a href="#demo" className="border border-white/30 hover:bg-white/10 transition-colors text-white px-8 py-3 rounded-full font-medium flex items-center justify-center">
              Try the Demo
            </a>
          </div>

          {/* Search Bar Style Element */}
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-full p-2 pl-6 flex items-center mt-16 border border-white/20">
            <input
              type="text"
              placeholder="Ask Ara anything..."
              className="bg-transparent flex-grow outline-none text-white placeholder-white/60"
            />
            <button className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-6 py-3 rounded-full">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10.293 5.293a1 1 0 011.414 0l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414-1.414L12.586 11H5a1 1 0 110-2h7.586l-2.293-2.293a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
          </div>
        </header>

        {/* Section 1 - What Ara is */}
        <section id="what" className="prose prose-lg prose-invert mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 md:p-12 max-w-4xl mb-24">
          <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">Your Life, Understood</h2>
          <p className="mb-6 text-white/90 text-center">
            Ara is your lifelong AI companion. It remembers your preferences, your projects, your people.
            Unlike generic tools, Ara has memory, personality, and agency.
          </p>

          <div className="grid md:grid-cols-3 gap-8 mt-12">
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="text-blue-300 text-xl mb-3">A planner that nudges you kindly</div>
              <p className="text-white/80 text-base">Ara keeps track of your goals and gently reminds you of priorities.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="text-blue-300 text-xl mb-3">A friend who knows your taste</div>
              <p className="text-white/80 text-base">Ara learns your preferences and tailors recommendations just for you.</p>
            </div>
            <div className="bg-white/5 p-6 rounded-xl border border-white/10">
              <div className="text-blue-300 text-xl mb-3">A teammate who already read the brief</div>
              <p className="text-white/80 text-base">Ara understands context and helps you move forward without repetition.</p>
            </div>
          </div>

          <p className="mt-10 text-white/90 text-center text-xl">
            It's not "just another chatbot." It's an agent built around <span className="text-blue-300">you</span>.
          </p>
        </section>

        {/* Section 2 - Core Features */}
        <section id="features" className="prose prose-lg prose-invert mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 md:p-12 max-w-4xl mb-24">
          <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">Built for Real Life</h2>
          <p className="mb-10 text-white/90 text-center">
            Ara works across your digital life, so you can stop switching tabs and start moving forward.
          </p>

          <div className="space-y-6">
            <div className="flex items-start">
              <div className="bg-blue-500/20 p-2 rounded mr-4 flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Skills & Workflows</h3>
                <p className="text-white/80">Give Ara simple natural-language playbooks</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-500/20 p-2 rounded mr-4 flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Long-Term Memory</h3>
                <p className="text-white/80">Ara remembers files, names, and preferences</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-500/20 p-2 rounded mr-4 flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Integrations</h3>
                <p className="text-white/80">Connect email, calendar, Slack, and more</p>
              </div>
            </div>

            <div className="flex items-start">
              <div className="bg-blue-500/20 p-2 rounded mr-4 flex-shrink-0 mt-1">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-blue-300" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              </div>
              <div>
                <h3 className="text-xl font-semibold text-white mb-2">Inbox for AI</h3>
                <p className="text-white/80">Others can message your Ara. Let it handle the back-and-forth.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Section 3 - Why It's Different */}
        <section id="why" className="prose prose-lg prose-invert mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 md:p-12 max-w-4xl mb-24">
          <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">Most AI tools answer. Ara asks.</h2>
          <p className="mb-6 text-white/90 text-center">
            Ara is goal-aware, emotionally intelligent, and curious about you. It adapts—whether you want a serious assistant,
            a cozy companion, or something in between.
          </p>

          <div className="bg-gradient-to-r from-blue-500/20 to-purple-500/20 p-8 rounded-xl border border-white/10 my-10">
            <p className="text-white text-center text-2xl font-light italic">
              "Every Ara is unique. Because every person is."
            </p>
          </div>
        </section>

        {/* Section 4 - For Early Explorers */}
        <section id="beta" className="prose prose-lg prose-invert mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 md:p-12 max-w-4xl mb-24">
          <h2 className="text-3xl font-bold text-blue-300 mb-6 text-center">This is just the beginning.</h2>
          <p className="mb-6 text-white/90 text-center">
            We're building a new category: AI that grows with you, protects your time, and feels less like a tool—and more like a partner.
          </p>
          <p className="mb-10 text-white/90 text-center">
            Early adopters shape Ara's future. Want in?
          </p>

          <div className="flex gap-6 justify-center flex-col sm:flex-row">
            <a href="#beta-signup" className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-8 py-3 rounded-full font-medium flex items-center justify-center">
              Join the Private Beta
            </a>
            <a href="#demo" className="border border-white/30 hover:bg-white/10 transition-colors text-white px-8 py-3 rounded-full font-medium flex items-center justify-center">
              See What Ara Can Do
            </a>
          </div>
        </section>

        {/* Footer */}
        <footer id="contact" className="mt-24 text-center text-white/60 border-t border-white/10 pt-8">
          <p className="text-xl mb-6 max-w-2xl mx-auto">
            You're not just getting an app. You're meeting a presence.
            <span className="block mt-2 text-white/80">Personal, proactive, and a little bit magical.</span>
          </p>

          <p className="text-2xl font-bold mb-3 text-blue-300">Ara. {config.tagline}</p>
          <p className="mb-10">Let's build something unforgettable.</p>

          <div className="flex justify-center gap-8 mb-6">
            <a
              href="#"
              className="text-blue-300 hover:text-white transition-colors"
            >
              About Us
            </a>
            <a
              href="#"
              className="text-blue-300 hover:text-white transition-colors"
            >
              Privacy
            </a>
            <a
              href="#"
              className="text-blue-300 hover:text-white transition-colors"
            >
              Contact
            </a>
          </div>
          <div className="flex justify-center gap-2 mb-4">
            <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
              </svg>
            </button>
            <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M23 3a10.9 10.9 0 0 1-3.14 1.53 4.48 4.48 0 0 0-7.86 3v1A10.66 10.66 0 0 1 3 4s-4 9 5 13a11.64 11.64 0 0 1-7 2c9 5 20 0 20-11.5a4.5 4.5 0 0 0-.08-.83A7.72 7.72 0 0 0 23 3z"></path>
              </svg>
            </button>
            <button className="bg-white/10 hover:bg-white/20 transition-colors rounded-full p-2">
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path>
                <rect x="2" y="9" width="4" height="12"></rect>
                <circle cx="4" cy="4" r="2"></circle>
              </svg>
            </button>
          </div>
          <p>© {new Date().getFullYear()} Ara AI. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
