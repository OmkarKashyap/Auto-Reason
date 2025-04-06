import { ButtonHTMLAttributes } from "react";

export function Button({ className = "", ...props }: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`px-4 py-2 rounded-lg shadow-md bg-gray-700 text-white hover:bg-gray-600 disabled:opacity-50 ${className}`}
      {...props}
    />
  );
}