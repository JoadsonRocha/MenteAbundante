import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Rise Mindr Logo"
    >
      <rect width="100" height="100" rx="20" fill="#EA580C" />
      <path d="M28 70V32L50 54L72 32V70" stroke="white" strokeWidth="9" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="50" cy="18" r="6" fill="white" />
    </svg>
  );
};

export default Logo;