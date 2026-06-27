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
  TouchableWithoutFeedback,
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
      case 'danger':
        return activeColors.emergency;
      case 'warning':
        return '#D48C45';
      case 'success':
        return activeColors.success;
      default:
        return activeColors.primary;
    }
  };

  const getIcon = () => {
    if (!config) return null;
    switch (config.type) {
      case 'danger':
        return <Ionicons name="warning" size={24} color={getAccentColor()} />;
      case 'warning':
        return (
          <Ionicons name="alert-circle" size={24} color={getAccentColor()} />
        );
      case 'success':
        return (
          <Ionicons
            name="checkmark-circle"
            size={24}
            color={getAccentColor()}
          />
        );
      default:
        return (
          <Ionicons
            name="information-circle"
            size={24}
            color={getAccentColor()}
          />
        );
    }
  };

  const AlertModal = () => {
    if (!config) return null;
    const buttonsList = config.buttons ?? [{ text: 'OK' }];
    const shouldStackVertically =
      buttonsList.length > 2 || buttonsList.some((btn) => btn.text.length > 18);

    return (
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        statusBarTranslucent
        onRequestClose={dismiss}
      >
        <View style={styles.overlay}>
          {/* Tap outside to dismiss */}
          <TouchableOpacity
            style={StyleSheet.absoluteFillObject}
            activeOpacity={1}
            onPress={dismiss}
          />

          <View
            style={[
              styles.card,
              {
                backgroundColor: activeColors.surface,
                borderColor: getAccentColor() + '25',
              },
            ]}
          >
            {/* Close Button top-right */}
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={dismiss}
              activeOpacity={0.7}
            >
              <Ionicons name="close" size={22} color={activeColors.textMuted} />
            </TouchableOpacity>

            {/* Header: Icon + Title */}
            <View style={styles.cardHeader}>
              <View
                style={[
                  styles.iconCircle,
                  { backgroundColor: getAccentColor() + '12' },
                ]}
              >
                {getIcon()}
              </View>
              <View style={styles.headerText}>
                <Text style={[styles.title, { color: activeColors.text }]}>
                  {config.title}
                </Text>
              </View>
            </View>

            {/* Message Body */}
            <Text style={[styles.message, { color: activeColors.textMuted }]}>
              {config.message}
            </Text>

            {/* Buttons Layout */}
            <View
              style={
                shouldStackVertically ? styles.buttonsColumn : styles.buttonsRow
              }
            >
              {buttonsList.map((btn, idx) => {
                const isCancel = btn.style === 'cancel';
                const isDestructive = btn.style === 'destructive';

                // Styling based on button type
                let btnBg = 'transparent';
                let btnTextColor = getAccentColor();
                let borderWidth = 0;
                let borderColor = 'transparent';

                if (isDestructive) {
                  btnBg = activeColors.emergency;
                  btnTextColor = '#FFFFFF';
                } else if (isCancel) {
                  btnBg = activeColors.surface2;
                  btnTextColor = activeColors.textMuted;
                  borderWidth = 1;
                  borderColor = activeColors.border;
                } else {
                  // Primary action
                  btnBg = getAccentColor();
                  btnTextColor = '#FFFFFF';
                }

                return (
                  <TouchableOpacity
                    key={idx}
                    onPress={() => {
                      dismiss();
                      btn.onPress?.();
                    }}
                    style={[
                      shouldStackVertically ? styles.btnVertical : styles.btn,
                      {
                        backgroundColor: btnBg,
                        borderWidth,
                        borderColor,
                      },
                    ]}
                    activeOpacity={0.85}
                  >
                    <Text
                      style={[
                        styles.btnText,
                        {
                          color: btnTextColor,
                          fontWeight: isCancel ? '500' : '700',
                          textAlign: 'center',
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
  };

  return { showAlert, AlertModal, dismissAlert: dismiss };
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    borderRadius: 24,
    borderWidth: 1.5,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 16,
    elevation: 8,
    position: 'relative',
  },
  closeBtn: {
    position: 'absolute',
    top: 18,
    right: 18,
    padding: 4,
    zIndex: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    lineHeight: 24,
  },
  message: {
    fontSize: 14,
    lineHeight: 22,
    marginBottom: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 10,
    width: '100%',
  },
  buttonsColumn: {
    flexDirection: 'column',
    gap: 10,
    width: '100%',
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 100,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
  },
  btnVertical: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: {
    fontSize: 14,
    letterSpacing: 0.1,
  },
});
