"use client";

import { useState, useEffect } from 'react';
import Image from 'next/image';

interface RotatingPicturesProps {
  className?: string;
}

const pictures = [
  {
    src: "https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/nnpl_cover_2.jpg",
    alt: "Pokémon TCG gameplay",
  },
  {
    src: "https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/nnpl_cover_4.jpg", 
    alt: "Tournament play",
  },
  {
    src: "https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/nnpl_cover_5.png",
    alt: "Community event",
  },
  {
    src: "https://riqqtffbmifrtuwtvqil.supabase.co/storage/v1/object/public/content/nnpl_cover_6.png",
    alt: "Local store play",
  }
];

export default function RotatingPictures({ className = "" }: RotatingPicturesProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % pictures.length);
    }, 4000); // Rotate every 4 seconds

    return () => clearInterval(interval);
  }, []);

  return (
    <div className={`relative w-full h-full min-h-80 overflow-hidden ${className}`}>
      {pictures.map((picture, index) => (
        <div
          key={index}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            index === currentIndex ? 'opacity-100' : 'opacity-0'
          }`}
        >
          <Image
            src={picture.src}
            alt={picture.alt}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            priority={index === 0}
          />
        </div>
      ))}
      
      {/* Dots indicator - only show when not used as background */}
      {!className.includes('h-full') && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 flex space-x-2">
          {pictures.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-colors duration-200 ${
                index === currentIndex ? 'bg-white' : 'bg-white/50'
              }`}
              aria-label={`View image ${index + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}