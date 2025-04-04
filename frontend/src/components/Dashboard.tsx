'use client';
import { useState } from "react";
import Head from "next/head";

// Dummy hook to get Firebase user; replace with your actual auth hook
const useAuth = () => {
  return { uid: "firebase_user_uid" }; // Replace with real UID
};

export default function Dashboard() {
  const { uid } = useAuth();
  const [showModal, setShowModal] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [responseMsg, setResponseMsg] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!textInput.trim()) return;
    try {
      const res = await fetch("/api/add_graph", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ uid, text: textInput }),
      });
      const data = await res.json();
      setResponseMsg("Graph updated successfully!");
      console.log("Graph data:", data.topics);
      setShowModal(false);
      setTextInput("");
    } catch (error) {
      console.error("Error updating graph:", error);
      setResponseMsg("Error updating graph.");
    }
  };

  return (
    <>
      <Head>
        <title>Thought Graph Dashboard</title>
      </Head>
      <div className="min-h-screen p-6 text-white bg-gray-900">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Thought Graph Dashboard</h1>
          <button
            className="px-4 py-2 bg-teal-500 rounded hover:bg-teal-400"
            onClick={() => setShowModal(true)}
          >
            Add to Existing Graph
          </button>
        </header>

        {responseMsg && (
          <div className="mb-4 text-sm text-center text-green-300">
            {responseMsg}
          </div>
        )}

        {/* (Optional) Render your graph visualization here using a library like vis-network or react-force-graph */}

        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="p-6 bg-gray-800 rounded-lg w-96">
              <h2 className="mb-4 text-xl font-semibold">Enter your paragraph</h2>
              <form onSubmit={handleSubmit}>
                <textarea
                  className="w-full h-24 p-2 text-white bg-gray-700 rounded"
                  placeholder="Type your text here..."
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                />
                <div className="flex justify-end gap-2 mt-4">
                  <button
                    type="button"
                    className="px-3 py-1 bg-gray-600 rounded hover:bg-gray-500"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-3 py-1 bg-teal-500 rounded hover:bg-teal-400"
                  >
                    Submit
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
