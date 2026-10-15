import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { COLORS, SHADOWS, RADIUS } from '../theme/theme';
import { ADDRESSES } from '../data/mockData';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function AddressModal({
  visible,
  currentAddress,
  onClose,
  onSelectAddress,
}) {
  const [addressList, setAddressList] = useState(ADDRESSES);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newLabel, setNewLabel] = useState('Khác');
  const [newName, setNewName] = useState('');
  const [newPhone, setNewPhone] = useState('');
  const [newDetail, setNewDetail] = useState('');

  const handleAddNewAddress = () => {
    if (!newDetail.trim()) return;
    const item = {
      id: Date.now(),
      label: newLabel,
      recipient_name: newName || 'Khách hàng',
      phone: newPhone || '0901 234 567',
      address_detail: newDetail.trim(),
      is_default: false,
    };
    const updated = [item, ...addressList];
    setAddressList(updated);
    onSelectAddress(item);
    setShowAddForm(false);
    setNewDetail('');
    setNewName('');
    setNewPhone('');
  };

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleWrap}>
              <Ionicons name="location-outline" size={22} color={COLORS.primary} />
              <Text style={styles.headerTitle}>Địa chỉ giao hàng</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} activeOpacity={0.7}>
              <Ionicons name="close" size={22} color={COLORS.textSecondary} />
            </TouchableOpacity>
          </View>

          <ScrollView
            style={styles.scrollArea}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Saved Addresses List */}
            <Text style={styles.sectionTitle}>Địa chỉ đã lưu</Text>
            {addressList.map((addr) => {
              const isSelected = currentAddress?.id === addr.id;
              return (
                <TouchableOpacity
                  key={addr.id}
                  style={[
                    styles.addressItem,
                    isSelected && styles.addressItemSelected,
                  ]}
                  onPress={() => {
                    onSelectAddress(addr);
                    onClose();
                  }}
                  activeOpacity={0.8}
                >
                  <View style={styles.addressLeft}>
                    <View
                      style={[
                        styles.badgeLabel,
                        {
                          backgroundColor:
                            addr.label === 'Công ty'
                              ? '#E0F2FE'
                              : addr.label === 'Nhà riêng'
                              ? '#FEF3C7'
                              : COLORS.surfaceSoft,
                        },
                      ]}
                    >
                      <Text
                        style={[
                          styles.badgeLabelText,
                          {
                            color:
                              addr.label === 'Công ty'
                                ? '#0284C7'
                                : addr.label === 'Nhà riêng'
                                ? '#D97706'
                                : COLORS.textPrimary,
                          },
                        ]}
                      >
                        {addr.label}
                      </Text>
                    </View>
                    <Text style={styles.addressDetailText}>{addr.address_detail}</Text>
                    <Text style={styles.recipientText}>
                      {addr.recipient_name} • {addr.phone}
                    </Text>
                  </View>

                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={22}
                    color={isSelected ? COLORS.primary : COLORS.textMuted}
                  />
                </TouchableOpacity>
              );
            })}

            {/* Toggle Add New Address */}
            {!showAddForm ? (
              <TouchableOpacity
                style={styles.addBtn}
                onPress={() => setShowAddForm(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="add-circle-outline" size={20} color={COLORS.primary} />
                <Text style={styles.addBtnText}>Thêm địa chỉ giao hàng mới</Text>
              </TouchableOpacity>
            ) : (
              <View style={styles.formContainer}>
                <View style={styles.formHeaderRow}>
                  <Text style={styles.formTitle}>Thêm địa chỉ mới</Text>
                  <TouchableOpacity onPress={() => setShowAddForm(false)}>
                    <Text style={styles.cancelFormText}>Hủy</Text>
                  </TouchableOpacity>
                </View>

                {/* Label chips */}
                <View style={styles.labelsRow}>
                  {['Nhà riêng', 'Công ty', 'Khác'].map((lbl) => (
                    <TouchableOpacity
                      key={lbl}
                      style={[
                        styles.labelChip,
                        newLabel === lbl && styles.labelChipActive,
                      ]}
                      onPress={() => setNewLabel(lbl)}
                    >
                      <Text
                        style={[
                          styles.labelChipText,
                          newLabel === lbl && styles.labelChipTextActive,
                        ]}
                      >
                        {lbl}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <TextInput
                  style={styles.input}
                  placeholder="Địa chỉ cụ thể (Số nhà, tên đường, toà nhà, Q/Huyện...)"
                  placeholderTextColor={COLORS.textMuted}
                  value={newDetail}
                  onChangeText={setNewDetail}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tên người nhận (VD: Anh Minh)"
                  placeholderTextColor={COLORS.textMuted}
                  value={newName}
                  onChangeText={setNewName}
                />
                <TextInput
                  style={styles.input}
                  placeholder="Số điện thoại người nhận"
                  placeholderTextColor={COLORS.textMuted}
                  keyboardType="phone-pad"
                  value={newPhone}
                  onChangeText={setNewPhone}
                />

                <TouchableOpacity
                  style={[
                    styles.saveBtn,
                    !newDetail.trim() && styles.saveBtnDisabled,
                  ]}
                  disabled={!newDetail.trim()}
                  onPress={handleAddNewAddress}
                  activeOpacity={0.85}
                >
                  <Text style={styles.saveBtnText}>Lưu & Chọn địa chỉ này</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: COLORS.background,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    maxHeight: SCREEN_HEIGHT * 0.85,
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: COLORS.surface,
    borderTopLeftRadius: RADIUS.xl,
    borderTopRightRadius: RADIUS.xl,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  headerTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: COLORS.surfaceSoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 12,
    paddingBottom: 30,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textSecondary,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  addressItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: COLORS.surface,
    padding: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1.5,
    borderColor: COLORS.borderLight,
    ...SHADOWS.sm,
  },
  addressItemSelected: {
    borderColor: COLORS.primary,
    backgroundColor: '#FFFDF9',
  },
  addressLeft: {
    flex: 1,
    paddingRight: 12,
  },
  badgeLabel: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: RADIUS.xs,
    marginBottom: 4,
  },
  badgeLabelText: {
    fontSize: 11,
    fontWeight: '700',
  },
  addressDetailText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.textPrimary,
    lineHeight: 18,
    marginBottom: 4,
  },
  recipientText: {
    fontSize: 12,
    color: COLORS.textSecondary,
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: COLORS.surface,
    paddingVertical: 14,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderColor: COLORS.primary,
    marginTop: 8,
  },
  addBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primary,
  },
  formContainer: {
    backgroundColor: COLORS.surface,
    padding: 16,
    borderRadius: RADIUS.md,
    borderWidth: 1,
    borderColor: COLORS.borderLight,
    gap: 10,
    marginTop: 8,
    ...SHADOWS.sm,
  },
  formHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  formTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: COLORS.primaryDark,
  },
  cancelFormText: {
    fontSize: 13,
    color: COLORS.textMuted,
  },
  labelsRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 4,
  },
  labelChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: RADIUS.full,
    backgroundColor: COLORS.surfaceSoft,
  },
  labelChipActive: {
    backgroundColor: COLORS.primary,
  },
  labelChipText: {
    fontSize: 12,
    fontWeight: '600',
    color: COLORS.textSecondary,
  },
  labelChipTextActive: {
    color: '#FFF',
  },
  input: {
    backgroundColor: COLORS.surfaceSoft,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS.sm,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13,
    color: COLORS.textPrimary,
  },
  saveBtn: {
    backgroundColor: COLORS.primary,
    paddingVertical: 12,
    borderRadius: RADIUS.md,
    alignItems: 'center',
    marginTop: 6,
    ...SHADOWS.sm,
  },
  saveBtnDisabled: {
    opacity: 0.5,
  },
  saveBtnText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '700',
  },
});
