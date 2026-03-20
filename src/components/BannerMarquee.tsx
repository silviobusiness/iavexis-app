import React, { useRef, useEffect, useState } from 'react';
import { motion, useAnimationControls } from 'framer-motion';
import { useDashboard } from '../contexts/DashboardContext';

export function BannerMarquee() {
  const { bannerArts, bannerSettings } = useDashboard();
  const [containerWidth, setContainerWidth] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const controls = useAnimationControls();

  useEffect(() => {
    if (containerRef.current) {
      setContainerWidth(containerRef.current.offsetWidth);
    }
    const handleResize = () => {
      if (containerRef.current) {
        setContainerWidth(containerRef.current.offsetWidth);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [bannerArts.length]);

  const speedMap = {
    slow: 30,
    medium: 15,
    fast: 8
  };

  // Determine how many images to show at once
  const imagesPerView = 4; // Increased to make them more "coladas" and portrait-like
  const imageWidth = containerWidth / imagesPerView;
  const totalOriginalWidth = Math.max(1, bannerArts.length) * imageWidth;

  // Duplicate images to ensure seamless loop
  const minItemsNeeded = imagesPerView * 2;
  const repeatCount = Math.max(2, Math.ceil(minItemsNeeded / Math.max(1, bannerArts.length)));
  
  const displayArts = Array(repeatCount).fill(bannerArts).flat();

  if (bannerArts.length === 0) {
    return (
      <div className="w-full h-full bg-zinc-900 flex items-center justify-center">
        <p className="text-zinc-500 font-bold uppercase tracking-widest text-xs">Nenhuma arte adicionada</p>
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      className="relative w-full h-full overflow-hidden bg-zinc-950"
    >
      {/* Side Blur Effects - Reduced to avoid hiding the "coladas" arts */}
      <div className="absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-zinc-950/80 to-transparent z-10 pointer-events-none" />
      <div className="absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-zinc-950/80 to-transparent z-10 pointer-events-none" />
      
      {/* Gradient Overlay for legibility */}
      <div className="absolute inset-0 bg-gradient-to-t from-zinc-950/40 via-zinc-950/10 to-transparent z-10 pointer-events-none" />

      <motion.div
        key={`${bannerArts.map(a => a.id).join('-')}-${containerWidth}-${bannerSettings.speed}-${bannerSettings.direction}-${bannerSettings.autoPlay}`}
        className="flex h-full gap-0"
        animate={bannerSettings.autoPlay ? {
          x: bannerSettings.direction === 'left' ? [0, -totalOriginalWidth] : [-totalOriginalWidth, 0]
        } : {}}
        transition={{
          duration: speedMap[bannerSettings.speed] * (bannerArts.length / imagesPerView),
          ease: "linear",
          repeat: Infinity,
        }}
        style={{ width: 'fit-content' }}
        whileHover={bannerSettings.pauseOnHover ? { animationPlayState: 'paused' } : {}}
      >
        {displayArts.map((art, idx) => (
          <div 
            key={`${art.id}-${idx}`}
            className="h-full flex-shrink-0 relative overflow-hidden px-0 border-r border-white/5 last:border-r-0"
            style={{ width: `${imageWidth}px` }}
          >
            <img
              src={art.url}
              alt={art.title || 'Banner Art'}
              className="w-full h-full object-cover transition-opacity duration-700"
              referrerPolicy="no-referrer"
            />
          </div>
        ))}
      </motion.div>
    </div>
  );
}
