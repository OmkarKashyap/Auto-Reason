import React, { useState } from 'react';

interface TextInputProps {
  onSubmit: (text: string) => void;
  disabled?: boolean; // Add the disabled prop
}

const TextInput: React.FC<TextInputProps> = ({ onSubmit, disabled = false }) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!disabled && text.trim()) {
      onSubmit(text);
      setText(''); // Clear the input after submission
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center space-x-2">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Type your graph input here..."
        disabled={disabled} // Pass the disabled prop to the textarea
        className={`text-black flex-1 p-2 border rounded ${
          disabled ? 'bg-gray-200 cursor-not-allowed' : 'bg-white'
        }`}
      />
      <button
        type="submit"
        disabled={disabled} // Disable the button if the input is disabled
        className={`p-2 text-white rounded ${
          disabled ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'
        }`}
      >
        Submit
      </button>
    </form>
  );
};

export default TextInput;