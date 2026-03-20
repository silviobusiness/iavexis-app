import React from 'react';
import { motion } from 'motion/react';
import clsx from 'clsx';

interface LogoProps {
  className?: string;
  showText?: boolean;
  size?: 'sm' | 'md' | 'lg';
  isAnimated?: boolean;
}

export const Logo: React.FC<LogoProps> = ({ className, showText = true, size = 'md', isAnimated = false }) => {
  const sizes = {
    sm: { icon: 'w-5 h-5', text: 'text-lg' },
    md: { icon: 'w-8 h-8', text: 'text-2xl' },
    lg: { icon: 'w-12 h-12', text: 'text-4xl' }
  };

  return (
    <div className={clsx("flex items-center gap-3 group select-none", className)}>
      <motion.div
        className={clsx(
          "relative flex items-center justify-center rounded-xl bg-zinc-900 border border-zinc-800 shadow-lg group-hover:shadow-emerald-500/20 transition-all duration-500",
          sizes[size].icon
        )}
        whileHover={{ scale: 1.05 }}
      >
        {/* Ball Icon with "Embaixadinha" animation */}
        <motion.div
          animate={isAnimated ? {
            y: [0, -8, 0],
            rotate: [0, 360],
          } : {}}
          transition={{
            y: {
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            },
            rotate: {
              duration: 3,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          className="text-xl"
        >
          ⚽
        </motion.div>
        
        {/* Glow effect on hover */}
        <div className="absolute inset-0 rounded-xl bg-emerald-500/0 group-hover:bg-emerald-500/5 blur-xl transition-all duration-500" />
      </motion.div>

      {showText && (
        <div className="relative">
          {/* Subtle pulsing glow */}
          {isAnimated && (
            <motion.div
              animate={{
                opacity: [0.3, 0.6, 0.3],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "easeInOut"
              }}
              className="absolute inset-0 bg-emerald-500/10 blur-lg -z-10"
            />
          )}
          
          {/* Shimmer effect */}
          {isAnimated && (
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <motion.div
                animate={{
                  left: ['-100%', '200%'],
                }}
                transition={{
                  duration: 3,
                  repeat: Infinity,
                  ease: "linear",
                  repeatDelay: 2
                }}
                className="absolute top-0 bottom-0 w-1/2 bg-gradient-to-r from-transparent via-white/5 to-transparent skew-x-12"
              />
            </div>
          )}
        </div>
      )}
    </div>
  );
};
