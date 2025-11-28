import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <div className={`relative flex items-center justify-center ${className}`} style={{ width: size, height: size }}>
       <svg 
         viewBox="0 0 100 100" 
         fill="none" 
         xmlns="http://www.w3.org/2000/svg"
         className="w-full h-full drop-shadow-md"
       >
         {/* Fundo Laranja #EA580C */}
         <rect width="100" height="100" rx="20" fill="#EA580C" />
         
         {/* M Branco */}
         <path 
           d="M28 70V32L50 54L72 32V70" 
           stroke="white" 
           strokeWidth="9" 
           strokeLinecap="round" 
           strokeLinejoin="round" 
         />
         
         {/* Ponto Branco */}
         <circle cx="50" cy="18" r="6" fill="white" />
       </svg>
    </div>
  );
};

export default Logo;