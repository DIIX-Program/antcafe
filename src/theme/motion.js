/**
 * Ant Coffee & Tea Motion System
 * Standards based on UI/UX Pro Max motion guidelines
 */

export const MOTION = {
  // Duration scales (ms)
  durations: {
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
    activeTab: 1.05,
    elevated: 1.08,
  },

  // Opacity states
  opacity: {
    pressed: 0.75,
    disabled: 0.45,
    dimmed: 0.25,
  },
};
