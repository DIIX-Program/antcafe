import React from 'react';
import { View, StyleSheet } from 'react-native';
import { COLORS, RADIUS } from '../../theme/theme';

export default function SkeletonLoader({ type = 'card', count = 2 }) {
  const items = Array.from({ length: count });

  if (type === 'card') {
    return (
      <View style={styles.grid}>
        {items.map((_, i) => (
          <View key={i} style={styles.cardSkeleton}>
            <View style={styles.imagePlaceholder} />
            <View style={styles.contentWrap}>
              <View style={styles.lineShort} />
              <View style={styles.lineMedium} />
              <View style={styles.lineLong} />
            </View>
          </View>
        ))}
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {items.map((_, i) => (
        <View key={i} style={styles.rowSkeleton}>
          <View style={styles.circlePlaceholder} />
          <View style={{ flex: 1, gap: 6 }}>
            <View style={styles.lineMedium} />
            <View style={styles.lineShort} />
          </View>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    padding: 16,
  },
  cardSkeleton: {
    width: '48%',
    backgroundColor: COLORS.surface,
    borderRadius: RADIUS.md,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePlaceholder: {
    width: '100%',
    height: 120,
    backgroundColor: COLORS.surfaceSoft,
  },
  contentWrap: {
    padding: 10,
    gap: 8,
  },
  lineShort: {
    width: '40%',
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.borderLight,
  },
  lineMedium: {
    width: '70%',
    height: 12,
    borderRadius: 6,
    backgroundColor: COLORS.surfaceSoft,
  },
  lineLong: {
    width: '90%',
    height: 10,
    borderRadius: 5,
    backgroundColor: COLORS.borderLight,
  },
  list: {
    padding: 16,
    gap: 12,
  },
  rowSkeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: COLORS.surface,
    padding: 12,
    borderRadius: RADIUS.md,
  },
  circlePlaceholder: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: COLORS.surfaceSoft,
  },
});
