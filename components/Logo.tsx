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
         <rect width="100" height="100" rx="24" fill="url(#logo-grad)" />
         {/* M estilizado */}
         <path d="M30 70V35L50 55L70 35V70" stroke="white" strokeWidth="8" strokeLinecap="round" strokeLinejoin="round" />
         {/* Ponto de conexão neural/célula acima */}
         <circle cx="50" cy="25" r="5" fill="white" />
         
         <defs>
           <linearGradient id="logo-grad" x1="0" y1="0" x2="100" y2="100" gradientUnits="userSpaceOnUse">
             <stop stopColor="#F87A14" />
             <stop offset="1" stopColor="#ea580c" />
           </linearGradient>
         </defs>
       </svg>
    </div>
  );
};

export default Logo;