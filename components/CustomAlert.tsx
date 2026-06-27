/**
 * CustomAlert — a beautiful premium modal that replaces the ugly native Alert.alert().
 * Works on both Android and iOS identically.
 *
 * Usage:
 *   import { useCustomAlert } from '@/components/CustomAlert';
 *   const { showAlert, AlertModal } = useCustomAlert();
 *   showAlert({ title, message, buttons });
 *   // In JSX: <AlertModal />
 */
import React, { useState, useCallback } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useThemeContext } from '@/hooks/useThemeContext';
import { Colors } from '@/constants/Colors';

interface AlertButton {
  text: string;
  onPress?: () => void;
  style?: 'default' | 'cancel' | 'destructive';
}

interface AlertConfig {
  title: string;
  message: string;
  type?: 'danger' | 'warning' | 'success' | 'info';
  buttons?: AlertButton[];
}

export function useCustomAlert() {
  const { colorScheme } = useThemeContext();
  const activeColors = Colors[colorScheme];
  const [config, setConfig] = useState<AlertConfig | null>(null);
  const [visible, setVisible] = useState(false);

  const showAlert = useCallback((cfg: AlertConfig) => {
    setConfig(cfg);
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    setVisible(false);
    setTimeout(() => setConfig(null), 300);
  }, []);

  const getAccentColor = () => {
    if (!config) return activeColors.primary;
    switch (config.type) {
      case 'danger': return activeColors.emergency;
      case 'warning': return '#D48C45';
      case 'success': return activeColors.success;
      default: return activeColors.primary;
    }
  };

  const getIcon = () => {
    if (!config) return null;
    switch (config.type) {
      case 'danger': return <Ionicons name="warning" size={32} color={getAccentColor()} />;
      case 'warning': return <Ionicons name="alert-circle" size={32} color={getAccentColor()} />;
      case 'success': return <Ionicons name="checkmark-circle" size={32} color={getAccentColor()} />;
      default: return <Ionicons name="information-circle" size={32} color={getAccentColor()} />;
    }
  };

  const AlertModal = () => (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={dismiss}
    >
      <View style={styles.overlay}>
        <View
          style={[
            styles.card,
            {
              backgroundColor: activeColors.surface,
              borderColor: getAccentColor() + '40',
            },
          ]}
        >
          {/* Icon */}
          <View style={[styles.iconCircle, { backgroundColor: getAccentColor() + '18' }]}>
            {getIcon()}
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: activeColors.text }]}>
            {config?.title}
          </Text>

          {/* Message */}
          <Text style={[styles.message, { color: activeColors.textMuted }]}>
            {config?.message}
          </Text>

          {/* Divider */}
          <View style={[styles.divider, { backgroundColor: activeColors.border }]} />

          {/* Buttons */}
          <View style={styles.buttonsRow}>
            {(config?.buttons ?? [{ text: 'OK' }]).map((btn, idx) => {
              const isCancel = btn.style === 'cancel';
              const isDestructive = btn.style === 'destructive';
              const btnColor = isDestructive
                ? activeColors.emergency
                : isCancel
                ? activeColors.textMuted
                : getAccentColor();

              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => {
                    dismiss();
                    btn.onPress?.();
                  }}
                  style={[
                    styles.btn,
                    idx > 0 && { borderLeftColor: activeColors.border, borderLeftWidth: 1 },
                  ]}
                  activeOpacity={0.7}
                >
                  <Text
                    style={[
                      styles.btnText,
                      {
                        color: btnColor,
                        fontWeight: isCancel ? '500' : 'bold',
                      },
                    ]}
                  >
                    {btn.text}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      </View>
    </Modal>
  );

  return { showAlert, AlertModal, dismissAlert: dismiss };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    alignItems: 'center',
    overflow: 'hidden',
    paddingTop: 28,
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    textAlign: 'center',
    paddingHorizontal: 20,
    marginBottom: 10,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  divider: { width: '100%', height: 1 },
  buttonsRow: {
    flexDirection: 'row',
    width: '100%',
  },
  btn: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 15,
    letterSpacing: 0.2,
  },
});
