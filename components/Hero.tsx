import Image from "next/image";
import Link from "next/link";
import React from "react";

const Hero = () => {
  return (
    <section className="wrapper mb-10">
      <div className="library-hero-card">
        <div className="library-hero-content">
        {/* Left Side */}
        <div className="library-hero-text">
          <h1 className="library-hero-title">Your Library</h1>
          <p className="library-hero-description">
            Convert your books into interactive AI conversations. <br className="hidden sm:block" />
            Listen, learn, and discuss your favorite reads.
          </p>
          <Link href="/books/new" className="library-cta-primary mt-2">
            <span>+ Add new book</span>
          </Link>
        </div>

        {/* Center (Desktop) */}
        <div className="library-hero-illustration-desktop">
          <Image
            src="/assets/hero-illustration.png"
            alt="Vintage books and a globe"
            width={400}
            height={300}
            className="object-contain"
            priority
          />
        </div>
        
        {/* Center (Mobile) */}
        <div className="library-hero-illustration">
          <Image
            src="/assets/hero-illustration.png"
            alt="Vintage books and a globe"
            width={250}
            height={200}
            className="object-contain"
            priority
          />
        </div>

        {/* Right Side */}
        <ul className="library-steps-card flex flex-col gap-6 py-8 px-6 lg:px-8 w-full lg:w-fit shrink-0 shadow-sm">
          {[
            { title: "Upload PDF", description: "Add your book file" },
            { title: "AI Processing", description: "We analyze the content" },
            { title: "Voice Chat", description: "Discuss with AI" },
          ].map((step, index) => (
            <li key={index} className="library-step-item items-center">
              <div className="library-step-number">{index + 1}</div>
              <div className="flex flex-col">
                <span className="library-step-title">{step.title}</span>
                <span className="library-step-description text-gray-500">{step.description}</span>
              </div>
            </li>
          ))}
        </ul>
      </div>
      </div>

     
    </section>
  );
};

export default Hero;
