import { motion } from 'motion/react';

const animations = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -15 }
};

export default function AnimatedPage({ children }) {
  return (
    <motion.div
      variants={animations}
      initial="initial"
      animate="animate"
      exit="exit"
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="w-full"
    >
      {children}
    </motion.div>
  );
}
