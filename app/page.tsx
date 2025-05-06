import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-r from-[#0A0B2E] via-[#1D1F59] to-[#0A0B2E] relative overflow-hidden text-white font-sans">
      {/* Radial gradient decorations */}
      <div className="absolute top-1/4 left-1/4 w-[600px] h-[600px] bg-blue-500/10 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 right-1/3 w-[800px] h-[800px] bg-indigo-500/10 rounded-full blur-3xl -z-10"></div>

      {/* Navigation */}
      <nav className="flex justify-between items-center p-6">
        <div className="text-2xl font-bold">ARA</div>
        <div className="flex gap-8">
          <a href="#" className="uppercase text-sm tracking-wider hover:text-blue-300 transition-colors">About</a>
          <a href="#" className="uppercase text-sm tracking-wider hover:text-blue-300 transition-colors">Features</a>
          <a href="#" className="uppercase text-sm tracking-wider hover:text-blue-300 transition-colors">Technology</a>
          <a href="#" className="uppercase text-sm tracking-wider hover:text-blue-300 transition-colors">Contact</a>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto px-6 py-24">
        {/* Hero Header */}
        <header className="flex flex-col items-center mb-24 pt-20">
          {/* <Image
            className="mb-8"
            src="/next.svg"
            alt="Logo"
            width={180}
            height={38}
            priority
          /> */}
          <h1 className="text-5xl md:text-7xl font-bold text-center leading-tight mb-8">
            <span className="inline-block">ARA</span>
            <span className="inline-block text-blue-300 mx-4">—</span>
            <span className="inline-block">the</span>
            <span className="inline-block italic text-blue-300 ml-4">future</span>
            <br />
            <span className="inline-block">of technology</span>
            <span className="inline-block text-blue-300 italic ml-4">integration</span>
            <span className="inline-block ml-2">is here</span>
          </h1>

          {/* Search Bar Style Element */}
          <div className="w-full max-w-2xl bg-white/10 backdrop-blur-md rounded-full p-2 pl-6 flex items-center mt-10 border border-white/20">
            <input
              type="text"
              placeholder="Learn more about ARA..."
              className="bg-transparent flex-grow outline-none text-white placeholder-white/60"
            />
            <button className="bg-blue-500 hover:bg-blue-600 transition-colors text-white px-6 py-3 rounded-full">
              Explore
            </button>
          </div>
        </header>

        {/* Essay Content */}
        <main className="prose prose-lg prose-invert mx-auto bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 shadow-xl p-8 md:p-12 max-w-4xl">
          <section className="mb-12">
            <h2 className="text-3xl font-bold text-blue-300 mb-6">Our Vision</h2>
            <p className="mb-4 text-white/90">
              ARA envisions a world where technology seamlessly integrates with human creativity,
              enhancing our capabilities while preserving our autonomy and agency. We believe in
              building tools that amplify human potential rather than replace it.
            </p>
            <p className="text-white/90">
              In a rapidly evolving digital landscape, we stand for thoughtful innovation that
              considers the broader implications of technology on society, culture, and individual
              well-being.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-blue-300 mb-6">Our Mission</h2>
            <p className="mb-4 text-white/90">
              At ARA, we're dedicated to developing accessible, responsible, and adaptable technologies
              that empower people from all walks of life. Our mission is to bridge the gap between
              cutting-edge innovation and practical, everyday utility.
            </p>
            <p className="text-white/90">
              We commit to creating solutions that respect privacy, promote transparency, and
              facilitate meaningful human connection in a world increasingly mediated by digital
              interfaces.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-3xl font-bold text-blue-300 mb-6">Our Approach</h2>
            <p className="mb-4 text-white/90">
              We believe in iterative development guided by real-world feedback. Our approach
              combines rigorous research with practical application, ensuring that our products
              not only push technological boundaries but also address genuine human needs.
            </p>
            <p className="text-white/90">
              By fostering collaboration between diverse disciplines and perspectives, we create
              holistic solutions that consider the full spectrum of human experience.
            </p>
          </section>

          <section>
            <h2 className="text-3xl font-bold text-blue-300 mb-6">Join Our Journey</h2>
            <p className="mb-4 text-white/90">
              ARA is more than just a technology initiative—it's a community of forward-thinking
              individuals committed to shaping a more thoughtful, inclusive digital future. Whether
              you're a developer, designer, researcher, or simply someone passionate about the
              potential of technology to improve lives, there's a place for you in our story.
            </p>
            <p className="text-white/90">
              Together, we can build technologies that honor human values while expanding the
              horizons of what's possible.
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-24 text-center text-white/60 border-t border-white/10 pt-8">
          <div className="flex justify-center gap-8 mb-6">
            <a
              href="#"
              className="text-blue-300 hover:text-white transition-colors"
            >
              Learn More
            </a>
            <a
              href="#"
              className="text-blue-300 hover:text-white transition-colors"
            >
              Contact Us
            </a>
            <a
              href="#"
              className="text-blue-300 hover:text-white transition-colors"
            >
              Join ARA
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
          <p>© {new Date().getFullYear()} ARA. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
