import { Platform } from 'react-native';

/**
 * Ant Coffee & Tea - Design System Tokens
 * Engineered with mobile-app-ui-design (60/30/10 Rule, 8-pt Grid, Soft Tinted Shadows)
 * & ui-ux-pro-max (Coffee Delivery Cafe Design System: Warm Espresso, Caramel Honey, Warm Cream)
 */

export const COLORS = {
  // Brand Primary: Artisan Roasted Coffee Amber (Matches Ant Coffee Logo)
  primary: '#92400E',
  primaryDark: '#78350F',
  primaryLight: '#FEF3C7',
  primarySurface: '#FFFDF7',
  primaryBorder: '#FDE68A',
  primaryPurple: '#7E22CE', // Backwards-compatible alias

  // Conversion Accent: Vibrant Fresh Brew Tangerine (Peak Energy CTA)
  accentOrange: '#EA580C',
  orangeDark: '#C2410C',
  orangeLight: '#FFF7ED',
  orangeBorder: '#FED7AA',

  // Secondary Warmth: Golden Honey & Caramel
  accentAmber: '#D97706',
  amberDark: '#B45309',
  amberLight: '#FEF3C7',
  amberBorder: '#FDE68A',

  // Organic Freshness: Matcha & Tea Leaf Green
  accentGreen: '#10B981',
  greenDark: '#047857',
  greenLight: '#DCFCE7',
  greenBorder: '#A7F3D0',

  // Alert & Cancellation
  accentRed: '#EF4444',
  redDark: '#B91C1C',
  redLight: '#FEE2E2',
  redBorder: '#FECACA',

  // Info & Cloud Sync
  accentBlue: '#2563EB',
  blueDark: '#1D4ED8',
  blueLight: '#DBEAFE',
  blueBorder: '#BFDBFE',

  // Standard Semantic Shortcuts
  success: '#10B981',
  warning: '#F59E0B',
  error: '#EF4444',
  info: '#2563EB',

  // Neutral Foundation (60% Neutral Base: Warm Artisan Cream & Paper)
  background: '#FAF8F5',
  surface: '#FFFFFF',
  surfaceSoft: '#F5EFEB',
  surfaceMuted: '#EFE9E2',
  surfaceHighlight: '#F5EFEB',
  surfaceElevated: '#FFFFFF',
  border: '#EAE4DC',
  borderLight: '#F4EFEA',
  borderStrong: '#D6CEBE',
  surfaceBorder: '#EAE4DC',

  // Typography Hierarchy (30% Stone Charcoal Contrast)
  text: '#1C1917',
  textPrimary: '#1C1917',
  textSecondary: '#57534E',
  textMuted: '#A8A29E',
  textInverse: '#FFFFFF',
  textBrand: '#92400E',

  // Order Lifecycle Status Badges
  statusPending: '#D97706',
  statusPendingBg: '#FEF3C7',
  statusPendingText: '#92400E',
  statusConfirmed: '#B45309',
  statusConfirmedBg: '#FEF3C7',
  statusConfirmedText: '#78350F',
  statusReady: '#EA580C',
  statusReadyBg: '#FFF7ED',
  statusReadyText: '#C2410C',
  statusCompleted: '#059669',
  statusCompletedBg: '#D1FAE5',
  statusCompletedText: '#047857',
  statusCancelled: '#EF4444',
  statusCancelledBg: '#FEE2E2',
  statusCancelledText: '#B91C1C',
};

export const GLASS = {
  bgLight: 'rgba(255, 255, 255, 0.88)',
  bgMedium: 'rgba(255, 255, 255, 0.76)',
  bgSubtle: 'rgba(255, 255, 255, 0.58)',
  bgDark: 'rgba(28, 25, 23, 0.82)',
  bgAmber: 'rgba(217, 119, 6, 0.08)',
  bgOrange: 'rgba(234, 88, 12, 0.08)',
  bgPurple: 'rgba(146, 64, 14, 0.08)', // Tinted to brand amber
  borderLight: 'rgba(255, 255, 255, 0.85)',
  borderSubtle: 'rgba(255, 255, 255, 0.45)',
  borderNeutral: 'rgba(234, 228, 220, 0.75)',
  borderAmber: 'rgba(253, 230, 138, 0.65)',
  borderPurple: 'rgba(253, 230, 138, 0.65)',
  navBg: 'rgba(255, 255, 255, 0.92)',
  navBorder: 'rgba(234, 228, 220, 0.85)',
  highlight: 'rgba(255, 255, 255, 0.35)',
  blurSm: 8,
  blurMd: 16,
  blurLg: 24,
  blurXl: 40,
};

export const SHADOWS = {
  none: { shadowColor: 'transparent', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 0, shadowRadius: 0, elevation: 0 },
  xs: { shadowColor: '#2E1805', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.03, shadowRadius: 2, elevation: 1 },
  sm: { shadowColor: '#2E1805', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4, elevation: 2 },
  md: { shadowColor: '#2E1805', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.06, shadowRadius: 10, elevation: 4 },
  lg: { shadowColor: '#92400E', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.12, shadowRadius: 18, elevation: 8 },
  card: { shadowColor: '#2E1805', shadowOffset: { width: 0, height: 3 }, shadowOpacity: 0.05, shadowRadius: 8, elevation: 3 },
  glass: { shadowColor: '#2E1805', shadowOffset: { width: 0, height: 8 }, shadowOpacity: 0.08, shadowRadius: 24, elevation: 8 },
  glassStrong: { shadowColor: '#2E1805', shadowOffset: { width: 0, height: 12 }, shadowOpacity: 0.14, shadowRadius: 32, elevation: 14 },
  glowOrange: { shadowColor: '#EA580C', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.32, shadowRadius: 14, elevation: 6 },
  glowAmber: { shadowColor: '#D97706', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6 },
  glowPurple: { shadowColor: '#92400E', shadowOffset: { width: 0, height: 5 }, shadowOpacity: 0.28, shadowRadius: 12, elevation: 6 },
  floatingNav: { shadowColor: '#2E1805', shadowOffset: { width: 0, height: 10 }, shadowOpacity: 0.12, shadowRadius: 28, elevation: 14 },
};

export const RADIUS = { xs: 6, sm: 10, md: 14, lg: 18, xl: 24, xxl: 32, full: 9999 };
export const SPACING = { xs: 4, sm: 8, md: 12, lg: 16, xl: 20, xxl: 24, xxxl: 32, huge: 48 };
export const TOUCH_TARGET = { minHeight: 44, minWidth: 44 };

export const TYPOGRAPHY = {
  fontFamily: Platform.select({
    ios: 'Plus Jakarta Sans',
    android: 'Plus Jakarta Sans',
    default: "'Plus Jakarta Sans', 'Be Vietnam Pro', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  }),
  fontFamilyHeading: Platform.select({
    ios: 'Plus Jakarta Sans',
    android: 'Plus Jakarta Sans',
    default: "'Plus Jakarta Sans', 'Be Vietnam Pro', sans-serif",
  }),
  fontFamilyMonospace: Platform.select({
    ios: 'Menlo',
    android: 'monospace',
    default: "'JetBrains Mono', 'SFMono-Regular', Consolas, 'Liberation Mono', Menlo, Courier, monospace",
  }),
  display: { fontSize: 28, fontWeight: '900', letterSpacing: -0.6, lineHeight: 34, color: '#1C1917' },
  titleLarge: { fontSize: 22, fontWeight: '800', letterSpacing: -0.4, lineHeight: 28, color: '#1C1917' },
  titleMedium: { fontSize: 17, fontWeight: '700', lineHeight: 23, color: '#1C1917' },
  titleSmall: { fontSize: 15, fontWeight: '700', lineHeight: 20, color: '#1C1917' },
  bodyLarge: { fontSize: 15, fontWeight: '600', lineHeight: 21, color: '#1C1917' },
  body: { fontSize: 13, fontWeight: '400', lineHeight: 18, color: '#57534E' },
  bodySmall: { fontSize: 12, fontWeight: '400', lineHeight: 17, color: '#57534E' },
  caption: { fontSize: 11, fontWeight: '500', lineHeight: 15, color: '#A8A29E' },
  label: { fontSize: 10, fontWeight: '700', letterSpacing: 0.6, color: '#A8A29E' },
  price: { fontSize: 16, fontWeight: '800', color: '#EA580C', fontVariant: ['tabular-nums'] },
  priceLarge: { fontSize: 20, fontWeight: '900', color: '#EA580C', fontVariant: ['tabular-nums'] },
  priceOriginal: { fontSize: 12, fontWeight: '500', color: '#A8A29E', textDecorationLine: 'line-through', fontVariant: ['tabular-nums'] },
  ticketSeq: { fontSize: 26, fontWeight: '900', letterSpacing: 0.5, color: '#78350F', fontVariant: ['tabular-nums'] },
};

export default {
  COLORS,
  GLASS,
  SHADOWS,
  RADIUS,
  SPACING,
  TYPOGRAPHY,
  TOUCH_TARGET,
};

