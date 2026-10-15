import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { GLASS, SHADOWS } from '../../theme/theme';

/**
 * GlassView — Cross-Platform Liquid Glass Surface Component
 *
 * On Web (react-native-web): Uses CSS backdrop-filter for true frosted glass blur.
 * On iOS/Android native: Uses translucent rgba backgrounds with subtle borders.
 *
 * Apply GlassView SELECTIVELY to:
 * - Floating navigation pill
 * - Search bar overlays
 * - Filter chip rows
 * - Toast/notification cards
 * - Modal headers
 * - Floating action trackers
 *
 * Do NOT apply to product cards, operational POS buttons, or text-heavy content.
 */
export default function GlassView({
  children,
  style,
  variant = 'light',    // 'light' | 'medium' | 'subtle' | 'dark' | 'purple' | 'orange'
  blur = 'md',          // 'sm' | 'md' | 'lg' | 'xl'
  borderStyle = 'neutral', // 'light' | 'neutral' | 'purple' | 'none'
  shadow = 'glass',     // 'none' | 'sm' | 'glass' | 'glassStrong'
  ...props
}) {
  const bgColor = {
    light: GLASS.bgLight,
    medium: GLASS.bgMedium,
    subtle: GLASS.bgSubtle,
    dark: GLASS.bgDark,
    purple: GLASS.bgPurple,
    orange: GLASS.bgOrange,
  }[variant] || GLASS.bgLight;

  const blurAmount = {
    sm: GLASS.blurSm,
    md: GLASS.blurMd,
    lg: GLASS.blurLg,
    xl: GLASS.blurXl,
  }[blur] || GLASS.blurMd;

  const borderColor = {
    light: GLASS.borderLight,
    neutral: GLASS.borderNeutral,
    purple: GLASS.borderPurple,
    none: 'transparent',
  }[borderStyle] || GLASS.borderNeutral;

  const shadowStyle = shadow === 'none'
    ? SHADOWS.none
    : shadow === 'sm'
    ? SHADOWS.sm
    : shadow === 'glassStrong'
    ? SHADOWS.glassStrong
    : SHADOWS.glass;

  // Web: apply CSS backdrop-filter blur via inline style
  const webBlurStyle = Platform.OS === 'web'
    ? { backdropFilter: `blur(${blurAmount}px)`, WebkitBackdropFilter: `blur(${blurAmount}px)` }
    : {};

  // Top specular highlight overlay (simulates refraction)
  const showHighlight = variant === 'light' || variant === 'medium';

  return (
    <View
      style={[
        styles.base,
        {
          backgroundColor: bgColor,
          borderColor,
          ...shadowStyle,
        },
        webBlurStyle,
        style,
      ]}
      {...props}
    >
      {showHighlight && (
        <View style={styles.highlightBar} pointerEvents="none" />
      )}
      {children}
    </View>
  );
}

const styles = StyleSheet.create({
  base: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: 16,
    overflow: 'hidden',
  },
  highlightBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: GLASS.borderLight,
    zIndex: 1,
    pointerEvents: 'none',
  },
});
