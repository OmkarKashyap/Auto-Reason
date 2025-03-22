import Image from 'next/image'

export default function Home() {
  return (
    <div className="min-h-screen pt-16"> 
      <div className="flex min-h-screen">
        {/* Left Side - Text Content */}
        <div className="w-1/2 flex flex-col justify-center px-12 lg:px-24">
          <div className="space-y-6"> 
            <h1 className="text-5xl font-bold leading-tight"> 
              Transform<br />
              Thoughts into<br />
              Knowledge.
            </h1>
            
            <p className="text-xl text-gray-400 max-w-xl">
              {/* Turn your ideas into interactive knowledge graphs using AI. Personal Thought Graph helps you visualize connections between concepts, making complex information easy to understand. */}
            </p>
            
            <div className="space-y-3"> {/* Reduced spacing */}
              <div className="flex items-start space-x-3">
                <span className="text-documenso-green">✓</span>
                <p className="text-gray-400">Automatically extract key concepts and relationships from your text</p>
              </div>
              {/* <div className="flex items-start space-x-3">
                <span className="text-documenso-green">✓</span>
                <p className="text-gray-400">Build dynamic, interactive knowledge maps</p>
              </div>
              <div className="flex items-start space-x-3">
                <span className="text-documenso-green">✓</span>
                <p className="text-gray-400">Perfect for research, study, and document analysis</p>
              </div> */}
            </div>
            
            <div className="flex space-x-4 pt-6">
              <button className="bg-[#99FF00] hover:brightness-110 text-black font-medium px-8 py-3 rounded-lg transition-all">
                Start Mapping
              </button>
              <button className="bg-[#99FF00] hover:brightness-110 text-black font-medium px-8 py-3 rounded-lg transition-all">
                View Examples
              </button>
            </div>
          </div>
        </div>

        <div className="w-1/2 relative flex items-center justify-center">
          <div className="w-[90%] h-[90%] relative"> 
            <Image
              src="/homepage_graph.jpg"
              alt="Interactive knowledge graph visualization"
              fill
              className="object-contain"
              priority
            />
          </div>
        </div>
      </div>
    </div>
  )
}