import React from 'react';

interface LogoProps {
  className?: string;
  size?: number;
}

const Logo: React.FC<LogoProps> = ({ className = "", size = 48 }) => {
  return (
    <img 
      src="/logo.svg" 
      alt="Rise Mindr Logo" 
      className={`object-contain ${className}`}
      style={{ width: size, height: size }} 
    />
  );
};

export default Logo;