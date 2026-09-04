'use client';

import Image from 'next/image'
import { useRouter } from 'next/navigation'

export default function Home() {
  const router = useRouter();

  return (
    <div className="min-h-screen pt-16 relative overflow-hidden">
      {/* Soft radial glow behind the hero, subtle, on-brand with the accent green */}
      <div
        className="pointer-events-none absolute -top-40 left-1/4 h-[600px] w-[600px] rounded-full opacity-20 blur-[120px]"
        style={{ backgroundColor: '#99FF00' }}
      />

      <div className="relative flex min-h-[calc(100vh-4rem)] flex-col-reverse lg:flex-row items-center gap-10 lg:gap-4">
        {/* Left Side - Text Content */}
        <div className="w-full lg:w-1/2 flex flex-col justify-center px-6 sm:px-12 lg:px-24 py-12">
          <div className="space-y-6 max-w-xl">
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight tracking-tight">
              Transform your thoughts into knowledge.
            </h1>

            <p className="text-lg text-gray-400">
              Paste in a paragraph and AutoReason extracts the entities and
              relationships automatically, merging them into a graph you can
              keep growing over time.
            </p>

            <div className="space-y-3 pt-2">
              <div className="flex items-start space-x-3">
                <span className="mt-0.5 text-[#99FF00]">✓</span>
                <p className="text-gray-400">Automatically extract key concepts and relationships from your text</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="mt-0.5 text-[#99FF00]">✓</span>
                <p className="text-gray-400">Explore an interactive, visual map of how your ideas connect</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="mt-0.5 text-[#99FF00]">✓</span>
                <p className="text-gray-400">Start anonymously, or sign up to keep your graphs saved to an account</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 pt-6">
              <button
                onClick={() => router.push('/dashboard')}
                className="bg-[#99FF00] hover:brightness-110 text-black font-medium px-8 py-3 rounded-lg transition-all"
              >
                Start Mapping
              </button>
            </div>
          </div>
        </div>

        <div className="w-full lg:w-1/2 flex items-center justify-center px-6 sm:px-12 lg:px-0">
          <div className="relative w-full max-w-xl aspect-[4/3] rounded-2xl overflow-hidden border border-white/10 shadow-2xl">
            <Image
              src="/homepage_graph.jpg"
              alt="Interactive knowledge graph visualization"
              fill
              className="object-cover"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}