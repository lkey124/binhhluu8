import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'google';
  isLoading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  isLoading, 
  className = '', 
  disabled,
  ...props 
}) => {
  const baseStyles = "w-full py-3 px-6 rounded-xl font-bold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-md";
  
  const variants = {
    // Tet Theme: Gold/Yellow primary
    primary: "bg-yellow-500 hover:bg-yellow-400 text-red-950 shadow-yellow-900/50 border border-yellow-400",
    // Secondary: Dark Red/Brown
    secondary: "bg-red-900/60 hover:bg-red-800 text-yellow-100 border border-yellow-700/50",
    danger: "bg-red-600 hover:bg-red-500 text-white shadow-red-900/50",
    ghost: "bg-transparent hover:bg-red-900/30 text-yellow-200/70 hover:text-yellow-200",
    google: "bg-white hover:bg-gray-100 text-gray-800 border border-gray-300",
  };

  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${className}`}
      disabled={disabled || isLoading}
      {...props}
    >
      {isLoading && (
        <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
      )}
      {children}
    </button>
  );
};
