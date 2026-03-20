import React, { useEffect, useState } from 'react';
import { motion, useSpring, useMotionValue, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';

export function CustomCursor() {
  const mouseX = useMotionValue(-100);
  const mouseY = useMotionValue(-100);
  
  // Remove spring for real-time response (no delay)
  const cursorX = mouseX;
  const cursorY = mouseY;

  const [cursorType, setCursorType] = useState<'default' | 'pointer' | 'interactive'>('default');
  const [isVisible, setIsVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile('ontouchstart' in window || navigator.maxTouchPoints > 0);
    };
    checkMobile();

    const moveCursor = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
      if (!isVisible) setIsVisible(true);

      const target = e.target as HTMLElement;
      if (!target) return;

      // Check for pointer elements
      const isPointer = 
        target.closest('button') || 
        target.closest('a') || 
        target.closest('.cursor-pointer') ||
        window.getComputedStyle(target).cursor === 'pointer';

      // Check for interactive cards/images
      const isInteractive = 
        target.closest('.premium-glass') || 
        target.closest('.card') ||
        target.closest('img') ||
        target.closest('.interactive-item') ||
        target.closest('.sidebar-item-premium');

      if (isPointer) {
        setCursorType('pointer');
      } else if (isInteractive) {
        setCursorType('interactive');
      } else {
        setCursorType('default');
      }
    };

    const handleMouseLeave = () => setIsVisible(false);
    const handleMouseEnter = () => setIsVisible(true);

    window.addEventListener('mousemove', moveCursor);
    window.addEventListener('mouseleave', handleMouseLeave);
    window.addEventListener('mouseenter', handleMouseEnter);

    return () => {
      window.removeEventListener('mousemove', moveCursor);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.removeEventListener('mouseenter', handleMouseEnter);
    };
  }, [mouseX, mouseY, isVisible]);

  if (isMobile) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className="fixed top-0 left-0 z-[9999] pointer-events-none"
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.5 }}
          style={{
            x: cursorX,
            y: cursorY,
            translateX: '-2px', // Precise tip alignment
            translateY: '-2px',
          }}
        >
          <motion.div
            animate={{
              scale: cursorType === 'pointer' ? 1.2 : cursorType === 'interactive' ? 1.1 : 1,
              color: cursorType === 'pointer' ? '#34d399' : '#ffffff',
              rotate: cursorType === 'pointer' ? -10 : 0,
            }}
            transition={{ type: 'spring', damping: 25, stiffness: 400 }}
            className="relative"
          >
            {/* Glow Effect */}
            <motion.div
              animate={{
                opacity: cursorType === 'pointer' ? 0.5 : cursorType === 'interactive' ? 0.3 : 0.15,
                scale: cursorType === 'pointer' ? 1.6 : 1.2,
              }}
              className={clsx(
                "absolute inset-0 blur-2xl rounded-full -z-10",
                cursorType === 'pointer' ? "bg-emerald-500/30" : "bg-white/5"
              )}
            />

            {/* Pen Nib Icon (Identical to print) */}
            <svg 
              width="32" 
              height="32" 
              viewBox="0 0 24 24" 
              fill="none" 
              stroke="currentColor" 
              strokeWidth="1.5" 
              strokeLinecap="round" 
              strokeLinejoin="round"
              className="drop-shadow-[0_2px_4px_rgba(0,0,0,0.5)]"
            >
              <path d="m12 19 7-7 3 3-7 7-3-3z" />
              <path d="m18 13-1.5-7.5L2 2l3.5 14.5L13 18l5-5z" />
              <path d="m2 2 7.586 7.586" />
              <circle cx="11" cy="11" r="2" />
            </svg>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
