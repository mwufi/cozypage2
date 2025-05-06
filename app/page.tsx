import Image from "next/image";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 relative overflow-hidden">
      {/* Radial gradient decorations */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-pink-100/50 rounded-full blur-3xl -z-10"></div>
      <div className="absolute bottom-1/3 right-1/3 w-[600px] h-[600px] bg-blue-100/50 rounded-full blur-3xl -z-10"></div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Header */}
        <header className="flex flex-col items-center mb-16">
          {/* <Image
            className="mb-8"
            src="/next.svg"
            alt="Logo"
            width={180}
            height={38}
            priority
          /> */}
          <h1 className="text-4xl md:text-6xl font-bold text-center bg-clip-text text-transparent bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 mb-6">
            About ARA
          </h1>
          <p className="text-lg text-gray-600 text-center max-w-2xl">
            Exploring the vision, mission, and future of ARA
          </p>
        </header>

        {/* Essay Content */}
        <main className="prose prose-lg mx-auto bg-white/80 backdrop-blur-sm rounded-2xl shadow-xl p-8 md:p-12">
          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Vision</h2>
            <p className="mb-4">
              ARA envisions a world where technology seamlessly integrates with human creativity,
              enhancing our capabilities while preserving our autonomy and agency. We believe in
              building tools that amplify human potential rather than replace it.
            </p>
            <p>
              In a rapidly evolving digital landscape, we stand for thoughtful innovation that
              considers the broader implications of technology on society, culture, and individual
              well-being.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Mission</h2>
            <p className="mb-4">
              At ARA, we're dedicated to developing accessible, responsible, and adaptable technologies
              that empower people from all walks of life. Our mission is to bridge the gap between
              cutting-edge innovation and practical, everyday utility.
            </p>
            <p>
              We commit to creating solutions that respect privacy, promote transparency, and
              facilitate meaningful human connection in a world increasingly mediated by digital
              interfaces.
            </p>
          </section>

          <section className="mb-12">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Our Approach</h2>
            <p className="mb-4">
              We believe in iterative development guided by real-world feedback. Our approach
              combines rigorous research with practical application, ensuring that our products
              not only push technological boundaries but also address genuine human needs.
            </p>
            <p>
              By fostering collaboration between diverse disciplines and perspectives, we create
              holistic solutions that consider the full spectrum of human experience.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">Join Our Journey</h2>
            <p className="mb-4">
              ARA is more than just a technology initiative—it's a community of forward-thinking
              individuals committed to shaping a more thoughtful, inclusive digital future. Whether
              you're a developer, designer, researcher, or simply someone passionate about the
              potential of technology to improve lives, there's a place for you in our story.
            </p>
            <p>
              Together, we can build technologies that honor human values while expanding the
              horizons of what's possible.
            </p>
          </section>
        </main>

        {/* Footer */}
        <footer className="mt-16 text-center text-gray-600">
          <div className="flex justify-center gap-8 mb-6">
            <a
              href="#"
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Learn More
            </a>
            <a
              href="#"
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Contact Us
            </a>
            <a
              href="#"
              className="text-indigo-500 hover:text-indigo-700 transition-colors"
            >
              Join ARA
            </a>
          </div>
          <p>© {new Date().getFullYear()} ARA. All rights reserved.</p>
        </footer>
      </div>
    </div>
  );
}
