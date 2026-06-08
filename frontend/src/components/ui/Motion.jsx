import { motion } from 'framer-motion'

// Fade up on scroll
export const FadeUp = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    whileInView={{ opacity: 1, y: 0 }}
    viewport={{ once: true, margin: '-60px' }}
    transition={{ duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

// Fade in
export const FadeIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0 }}
    whileInView={{ opacity: 1 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
)

// Stagger container
export const StaggerContainer = ({ children, className = '', stagger = 0.1 }) => (
  <motion.div
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, margin: '-60px' }}
    variants={{ visible: { transition: { staggerChildren: stagger } } }}
    className={className}
  >
    {children}
  </motion.div>
)

// Stagger item
export const StaggerItem = ({ children, className = '' }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
    }}
    className={className}
  >
    {children}
  </motion.div>
)

// Scale on hover card
export const HoverCard = ({ children, className = '' }) => (
  <motion.div
    whileHover={{ y: -4, scale: 1.01 }}
    transition={{ duration: 0.25, ease: 'easeOut' }}
    className={className}
  >
    {children}
  </motion.div>
)

// Slide in from left
export const SlideIn = ({ children, delay = 0, className = '' }) => (
  <motion.div
    initial={{ opacity: 0, x: -24 }}
    whileInView={{ opacity: 1, x: 0 }}
    viewport={{ once: true }}
    transition={{ duration: 0.5, delay, ease: [0.22, 1, 0.36, 1] }}
    className={className}
  >
    {children}
  </motion.div>
)

// Page transition wrapper
export const PageTransition = ({ children }) => (
  <motion.div
    initial={{ opacity: 0, y: 12 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -8 }}
    transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
  >
    {children}
  </motion.div>
)
