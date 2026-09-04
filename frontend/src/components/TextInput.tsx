import React, { useState } from 'react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean;
}

export default function TextInput({ onSubmit, disabled }: TextInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSubmit(text);
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste a paragraph and press Enter to build the graph..."
        disabled={disabled}
        className="flex-1 p-2.5 text-sm text-white placeholder-gray-500 bg-[#232323] border border-white/10 rounded-md focus:outline-none focus:border-[#99FF00] transition-colors disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={disabled || !text.trim()}
        className="px-4 py-2.5 text-sm font-medium text-black bg-[#99FF00] rounded-md hover:brightness-110 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
      >
        Submit
      </button>
    </form>
  );
}
