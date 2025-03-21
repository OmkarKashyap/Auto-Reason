import { useState } from 'react';

const LandingPage: React.FC = () => {
  return (
    <div className="bg-gray-900 text-white min-h-screen flex flex-col">
      <header className="bg-gray-800 text-center flex items-center justify-center min-h-screen">
        <div className="container mx-auto">
          <h1 className="text-4xl font-bold mb-4">
            Visualize Your Thoughts, Effortlessly.
          </h1>
          <p className="text-lg text-gray-400">
            Transform your text into dynamic knowledge graphs.
          </p>
          <button className="mt-8 bg-green-500 hover:bg-green-700 text-white font-bold py-3 px-6 rounded-full focus:outline-none focus:shadow-outline">
            Get Started (Login Above)
          </button>
        </div>
      </header>

      <section className="py-16 bg-gray-700 flex-grow flex items-center justify-center">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8">
            Key Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="p-6 rounded-lg shadow-md bg-gray-800">
              <h3 className="text-xl font-semibold mb-2">
                Knowledge Management
              </h3>
              <p className="text-gray-400">
                Capture and visually organize your ideas, notes, and documents.
              </p>
            </div>
            <div className="p-6 rounded-lg shadow-md bg-gray-800">
              <h3 className="text-xl font-semibold mb-2">
                Educational & Research
              </h3>
              <p className="text-gray-400">
                Generate concept maps from study materials and research papers.
              </p>
            </div>
            <div className="p-6 rounded-lg shadow-md bg-gray-800">
              <h3 className="text-xl font-semibold mb-2">
                Document Summaries
              </h3>
              <p className="text-gray-400">
                Simplify complex legal and business documents.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-16 bg-gray-600 flex-grow flex items-center justify-center">
        <div className="container mx-auto text-center">
          <h2 className="text-3xl font-semibold mb-8">How It Works</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="p-6 rounded-lg shadow-md bg-gray-800">
              <h4 className="text-lg font-semibold mb-2">1. Enter Your Text</h4>
              <p className="text-gray-400">Simply paste or type your text into the input field.</p>
            </div>
            <div className="p-6 rounded-lg shadow-md bg-gray-800">
              <h4 className="text-lg font-semibold mb-2">2. Process with AI</h4>
              <p className="text-gray-400">Our intelligent system extracts key entities and relationships.</p>
            </div>
            <div className="p-6 rounded-lg shadow-md bg-gray-800">
              <h4 className="text-lg font-semibold mb-2">3. Visualize Your Graph</h4>
              <p className="text-gray-400">Explore your network of ideas in an interactive graph.</p>
            </div>
            <div className="p-6 rounded-lg shadow-md bg-gray-800">
              <h4 className="text-lg font-semibold mb-2">4. Evolve Your Knowledge</h4>
              <p className="text-gray-400">Add more text to expand and connect your thought graph.</p>
            </div>
          </div>
        </div>
      </section>

      <footer className="py-8 bg-gray-800 text-center flex-shrink-0">
        <p className="text-gray-400">&copy; 2025 Personal Thought Graph. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default LandingPage;