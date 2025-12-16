import React from "react";
import {
  ActivityIndicator,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  useWindowDimensions,
} from "react-native";
import { BlurView } from "expo-blur";

const COLORS = {
  primary: "#FB68A8",
  background: "#0E0E12",
  surface: "#15161D",
  textPrimary: "#F5F5FA",
  textSecondary: "#C3C6D8",
  border: "#242535",
  danger: "#FF6B6B",
};

const ShakeReportModal = ({
  visible,
  onRequestClose,
  onClose,
  onSubmit,
  isCapturing,
  isSubmitting,
  screenshotDataUrl,
  description,
  onChangeDescription,
  email,
  onChangeEmail,
  errorMessage = "",
}) => {
  const { width, height } = useWindowDimensions();
  const isDesktop = Math.min(width, height) >= 600;
  const maxCardHeight = Math.max(360, height * (isDesktop ? 0.82 : 0.7));
  const cardHeight = Math.min(isDesktop ? 720 : 600, maxCardHeight);
  if (!visible) {
    return null;
  }

  const renderScreenshot = () => (
    <View style={{ width: "100%" }}>
      <View style={[styles.screenshotContainer, isDesktop ? styles.screenshotDesktop : null]}>
        {isCapturing ? (
          <View style={styles.screenshotPlaceholder}>
            <ActivityIndicator color={COLORS.primary} />
            <Text style={styles.screenshotText}>Prise de capture en cours...</Text>
          </View>
        ) : screenshotDataUrl ? (
          <Image source={{ uri: screenshotDataUrl }} resizeMode="cover" style={StyleSheet.absoluteFill} />
        ) : (
          <View style={styles.screenshotPlaceholder}>
            <Text style={styles.screenshotText}>
              Aucune capture disponible. Secouez à nouveau pour enregistrer l'écran.
            </Text>
          </View>
        )}
      </View>
    </View>
  );

  const content = (
      <View style={styles.cardWrapper}>
      <View
        style={[
          styles.card,
          { height: cardHeight, maxHeight: maxCardHeight, minHeight: 360 },
          isDesktop ? styles.cardDesktop : styles.cardMobile,
        ]}
      >
        <Pressable
          style={[styles.closeButton, isDesktop ? styles.closeButtonDesktop : styles.closeButtonMobile]}
          hitSlop={12}
          onPress={onClose}
        >
          <Text style={styles.closeIcon}>×</Text>
        </Pressable>

        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[
            styles.content,
            isDesktop ? styles.contentDesktop : styles.contentMobile,
          ]}
          bounces={false}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={[styles.title, isDesktop ? styles.titleDesktop : null]}>Signaler un problème</Text>
          <Text style={[styles.subtitle, isDesktop ? styles.subtitleDesktop : null]}>
            Secouez votre appareil pour capturer l'écran et décrire ce qui ne fonctionne pas.
          </Text>

          {renderScreenshot()}

          <View style={styles.field}>
            <Text style={styles.label}>Email (optionnel)</Text>
            <TextInput
              style={[styles.input, isDesktop ? styles.inputDesktop : null]}
              placeholder="email@exemple.com"
              placeholderTextColor={COLORS.textSecondary}
              value={email}
              onChangeText={onChangeEmail}
              autoCapitalize="none"
              keyboardType="email-address"
            />
          </View>

          <View style={styles.field}>
            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.textarea, isDesktop ? styles.textareaDesktop : null]}
              placeholder="Décrivez ce que vous faisiez et ce qui s'est passé..."
              placeholderTextColor={COLORS.textSecondary}
              value={description}
              onChangeText={onChangeDescription}
              multiline
              textAlignVertical="top"
            />
          </View>

          {Boolean(errorMessage) ? (
            <Text style={styles.errorText}>{errorMessage}</Text>
          ) : null}

          <View style={[styles.actions, isDesktop ? styles.actionsDesktop : null]}>
            <Pressable
              onPress={onClose}
              style={[styles.secondaryButton, isDesktop ? styles.secondaryButtonDesktop : null]}
            >
              <Text style={[styles.secondaryText, isDesktop ? styles.secondaryTextDesktop : null]}>
                Annuler
              </Text>
            </Pressable>
            <Pressable
              onPress={isSubmitting ? () => {} : onSubmit}
              style={[
                styles.primaryButton,
                isDesktop ? styles.primaryButtonDesktop : null,
                isSubmitting ? styles.primaryButtonDisabled : null,
              ]}
            >
              <Text style={[styles.primaryText, isDesktop ? styles.primaryTextDesktop : null]}>
                {isSubmitting ? "Envoi en cours..." : "Envoyer le signalement"}
              </Text>
            </Pressable>
          </View>
        </ScrollView>
      </View>
    </View>
  );

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}
      presentationStyle="overFullScreen"
      supportedOrientations={[
        "portrait",
        "portrait-upside-down",
        "landscape",
        "landscape-left",
        "landscape-right",
      ]}
    >
      <BlurView tint="dark" intensity={20} style={styles.backdrop}>
        <KeyboardAvoidingView
          style={styles.keyboardContainer}
          behavior={Platform.OS === "ios" ? "padding" : undefined}
        >
          <SafeAreaView style={styles.safeArea}>
            {content}
          </SafeAreaView>
        </KeyboardAvoidingView>
      </BlurView>
    </Modal>
  );
};

export default ShakeReportModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(14, 14, 18, 0.72)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  keyboardContainer: { flex: 1, width: "100%" },
  safeArea: { flex: 1 },
  cardWrapper: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
  },
  card: {
    width: "100%",
    height: 600,
    maxWidth: 780,
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 18,
    elevation: 6,
    position: "relative",
    alignSelf: "center",
    overflow: "hidden",
  },
  cardDesktop: {
    borderRadius: 22,
  },
  cardMobile: {
    borderRadius: 18,
  },
  closeButton: {
    position: "absolute",
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.background,
    borderWidth: 1,
    borderColor: COLORS.border,
    zIndex: 2,
  },
  closeButtonDesktop: {
    top: 30,
    right: 28,
  },
  closeButtonMobile: {
    top: 13,
    right: 15,
  },
  closeIcon: {
    fontSize: 22,
    color: COLORS.textPrimary,
    lineHeight: 22,
    textAlign: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.textPrimary,
    textAlign: "center",
    paddingTop: 8,
  },
  titleDesktop: {
    fontSize: 26,
  },
  subtitle: {
    fontSize: 15,
    color: COLORS.textSecondary,
    textAlign: "center",
    lineHeight: 22,
    paddingHorizontal: 8,
  },
  subtitleDesktop: {
    fontSize: 16,
  },
  screenshotContainer: {
    height: 220,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },
  screenshotDesktop: {
    height: 260,
  },
  screenshotPlaceholder: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 18,
    gap: 10,
  },
  screenshotText: {
    color: COLORS.textSecondary,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 20,
  },
  field: { gap: 6 },
  label: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: 14,
  },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  inputDesktop: {
    fontSize: 16,
  },
  textarea: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 15,
    minHeight: 130,
    color: COLORS.textPrimary,
    backgroundColor: COLORS.background,
  },
  textareaDesktop: {
    fontSize: 16,
    minHeight: 150,
  },
  errorText: {
    color: COLORS.danger,
    fontSize: 14,
    marginTop: -4,
  },
  actions: {
    flexDirection: "column-reverse",
    gap: 10,
  },
  actionsDesktop: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  contentScroll: {
    width: "100%",
  },
  content: {
    gap: 14,
  },
  contentDesktop: {
    paddingTop: 66,
    paddingLeft: 80,
    paddingRight: 76,
    paddingBottom: 70,
    gap: 16,
  },
  contentMobile: {
    paddingTop: 30,
    paddingLeft: 20,
    paddingRight: 20,
    paddingBottom: 56,
    gap: 14,
  },
  secondaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.surface,
    alignItems: "center",
    justifyContent: "center",
  },
  secondaryButtonDesktop: {
    minWidth: 160,
  },
  secondaryText: {
    color: COLORS.textPrimary,
    fontWeight: "600",
    fontSize: 15,
  },
  secondaryTextDesktop: {
    fontSize: 16,
  },
  primaryButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: COLORS.primary,
  },
  primaryButtonDesktop: {
    minWidth: 200,
  },
  primaryButtonDisabled: {
    opacity: 0.8,
  },
  primaryText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 15,
  },
  primaryTextDesktop: {
    fontSize: 16,
  },
});
