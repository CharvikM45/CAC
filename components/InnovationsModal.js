import React from 'react';
import { Modal, View, Text, TouchableOpacity, StyleSheet, ScrollView, Linking } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../constants/colors';

const InfoRow = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
};

const InnovationsModal = ({ visible, onClose, innovation }) => {
  if (!innovation) return null;

  const handleOpenLink = async (url) => {
    try {
      if (url && (await Linking.canOpenURL(url))) {
        Linking.openURL(url);
      }
    } catch (_) {}
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <View style={styles.headerLeft}>
              <Ionicons name="leaf" size={22} color={Colors.primary} />
              <Text style={styles.title}>Daily Innovation</Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color={Colors.text} />
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
            <Text style={styles.innovationTitle}>{innovation.title}</Text>
            <Text style={styles.byline}>By {innovation.inventor}{innovation.affiliation ? ` • ${innovation.affiliation}` : ''}</Text>

            {innovation.description ? (
              <Text style={styles.description}>{innovation.description}</Text>
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Key Biodegradable Materials</Text>
              {Array.isArray(innovation.materials) && innovation.materials.length > 0 ? (
                <View style={styles.chips}>
                  {innovation.materials.map((m, idx) => (
                    <View key={`${m}-${idx}`} style={styles.chip}>
                      <Text style={styles.chipText}>{m}</Text>
                    </View>
                  ))}
                </View>
              ) : (
                <Text style={styles.muted}>No materials listed</Text>
              )}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Highlights</Text>
              <InfoRow label="Year" value={innovation.year} />
              <InfoRow label="Category" value={innovation.category} />
              <InfoRow label="Impact" value={innovation.impact} />
              <InfoRow label="Location" value={innovation.location} />
            </View>

            {innovation.notes ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Notes</Text>
                <Text style={styles.notes}>{innovation.notes}</Text>
              </View>
            ) : null}

            {innovation.links && innovation.links.length > 0 ? (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Learn More</Text>
                {innovation.links.map((link, idx) => (
                  <TouchableOpacity key={idx} onPress={() => handleOpenLink(link.url)} style={styles.linkRow}>
                    <Ionicons name="link" size={16} color={Colors.primary} />
                    <Text style={styles.linkText}>{link.label || link.url}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : null}
          </ScrollView>

          <View style={styles.footer}>
            <TouchableOpacity onPress={onClose} style={styles.primaryBtn}>
              <Text style={styles.primaryBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'flex-end',
  },
  container: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    maxHeight: '88%',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  title: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '700',
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
  },
  content: {
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  innovationTitle: {
    color: Colors.text,
    fontSize: 20,
    fontWeight: '800',
    marginBottom: 6,
  },
  byline: {
    color: Colors.textSecondary,
    marginBottom: 14,
  },
  description: {
    color: Colors.text,
    lineHeight: 20,
    marginBottom: 16,
  },
  section: {
    marginTop: 10,
    marginBottom: 6,
  },
  sectionTitle: {
    color: Colors.primary,
    fontWeight: '700',
    marginBottom: 8,
  },
  chips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: Colors.card,
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  chipText: {
    color: Colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  infoLabel: {
    color: Colors.textSecondary,
  },
  infoValue: {
    color: Colors.text,
    fontWeight: '600',
  },
  notes: {
    color: Colors.text,
    lineHeight: 20,
    backgroundColor: Colors.card,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 12,
  },
  muted: {
    color: Colors.textSecondary,
  },
  linkRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  linkText: {
    color: Colors.primary,
    textDecorationLine: 'underline',
  },
  footer: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  primaryBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: Colors.secondary,
    fontWeight: '700',
    fontSize: 16,
  },
});

export default InnovationsModal;


