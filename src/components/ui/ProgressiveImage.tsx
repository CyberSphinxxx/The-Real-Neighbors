import React, { useState } from 'react';

interface ProgressiveImageProps extends React.ImgHTMLAttributes<HTMLImageElement> {
  placeholderColor?: string;
  containerClassName?: string;
}

export const ProgressiveImage: React.FC<ProgressiveImageProps> = ({ 
  src, 
  alt, 
  className = '', 
  containerClassName = '',
  style, 
  placeholderColor = 'var(--color-bg-base)',
  ...props 
}) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [error, setError] = useState(false);

  return (
    <div 
      className={`relative overflow-hidden ${containerClassName}`} 
      style={{ ...style, background: placeholderColor }}
    >
      {!isLoaded && !error && (
        <div className="absolute inset-0 animate-pulse bg-black/5 dark:bg-white/5" />
      )}
      
      {src && !error ? (
        <img
          src={src}
          alt={alt}
          onLoad={(e) => {
            setIsLoaded(true);
            props.onLoad?.(e);
          }}
          onError={(e) => {
            setError(true);
            props.onError?.(e);
          }}
          className={`${className} transition-opacity duration-500 ease-in-out ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          loading="lazy"
          decoding="async"
          {...props}
        />
      ) : null}
    </div>
  );
};
