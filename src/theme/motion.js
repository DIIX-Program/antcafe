/**
 * Ant Coffee & Tea Motion System
 * Standards based on UI/UX Pro Max & mobile-app-ui-design motion guidelines
 */

export const MOTION = {
  // Duration scales (ms)
  durations: {
    instant: 100,
    press: 140, // Button & chip tap feedback
    fast: 180, // Quick micro-interactions
    normal: 250, // Screen transitions & tab switches
    modal: 280, // Modal entrance & exit
    sheet: 320, // Bottom sheet slide up/down
    success: 450, // Order success reveal sequence
    shimmer: 1400, // Skeleton shimmer loop
  },

  // Interactive scales
  scales: {
    pressed: 0.96,
    subtle: 0.98,
    activeTab: 1.04,
    elevated: 1.08,
  },

  // Spring physics curves
  spring: {
    gentle: { tension: 120, friction: 14 },
    bouncy: { tension: 180, friction: 12 },
    snappy: { tension: 230, friction: 18 },
  },

  // Opacity states
  opacity: {
    pressed: 0.78,
    disabled: 0.45,
    dimmed: 0.25,
  },

  // Web transition shortcuts
  webTransition: {
    fast: 'all 0.18s cubic-bezier(0.16, 1, 0.3, 1)',
    normal: 'all 0.25s cubic-bezier(0.16, 1, 0.3, 1)',
    spring: 'all 0.35s cubic-bezier(0.34, 1.56, 0.64, 1)',
  },
};

export default MOTION;

