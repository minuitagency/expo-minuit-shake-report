import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Alert,
  Image,
  Modal,
  PanResponder,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import ViewShot from "react-native-view-shot";
import * as FileSystem from "expo-file-system";

import { extractBase64FromDataUrl } from "../utils/shakeReporter";

const COLORS = {
  primary: "#FB68A8",
  background: "#0E0E12",
  surface: "#15161D",
  textPrimary: "#F5F5FA",
  textSecondary: "#C3C6D8",
  border: "#242535",
};

const buildPathD = (points = []) => {
  if (!points.length) return "";
  const [first, ...rest] = points;
  return `M ${first.x} ${first.y} ${rest.map((p) => `L ${p.x} ${p.y}`).join(" ")}`;
};

const ScreenshotAnnotatorModal = ({
  visible,
  screenshotDataUrl,
  onClose,
  onApply,
}) => {
  const viewShotRef = useRef(null);
  const [paths, setPaths] = useState([]);
  const [currentPath, setCurrentPath] = useState([]);
  const [isSaving, setIsSaving] = useState(false);
  const [canvasSize, setCanvasSize] = useState({ width: 0, height: 0 });
  const [isImageReady, setIsImageReady] = useState(false);
  const [localImageUri, setLocalImageUri] = useState("");

  useEffect(() => {
    let isMounted = true;
    let currentUri = "";

    const persistToFile = async () => {
      try {
        setIsImageReady(false);
        if (!screenshotDataUrl) {
          setLocalImageUri("");
          setIsImageReady(true);
          return;
        }

        const base64 = extractBase64FromDataUrl(screenshotDataUrl);
        if (!base64) {
          setLocalImageUri("");
          setIsImageReady(true);
          return;
        }

        const fileName = `shake-annotate-${Date.now()}.png`;
        const fileUri = `${FileSystem.cacheDirectory}${fileName}`;
        await FileSystem.writeAsStringAsync(fileUri, base64, {
          encoding: FileSystem.EncodingType.Base64,
        });

        currentUri = fileUri;
        if (isMounted) {
          setLocalImageUri(fileUri);
        }
      } catch (error) {
        console.log("Annotator file write failed", error);
        if (isMounted) {
          setLocalImageUri("");
          setIsImageReady(true);
        }
      }
    };

    persistToFile();

    return () => {
      isMounted = false;
      if (currentUri?.length) {
        FileSystem.deleteAsync(currentUri, { idempotent: true }).catch(() => {});
      }
    };
  }, [screenshotDataUrl]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: () => true,
        onPanResponderGrant: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentPath([{ x: locationX, y: locationY }]);
        },
        onPanResponderMove: (evt) => {
          const { locationX, locationY } = evt.nativeEvent;
          setCurrentPath((prev) => [...prev, { x: locationX, y: locationY }]);
        },
        onPanResponderRelease: () => {
          setPaths((prev) => (currentPath.length ? [...prev, currentPath] : prev));
          setCurrentPath([]);
        },
        onPanResponderTerminate: () => {
          setPaths((prev) => (currentPath.length ? [...prev, currentPath] : prev));
          setCurrentPath([]);
        },
      }),
    [currentPath]
  );

  const handleClear = () => {
    setPaths([]);
    setCurrentPath([]);
  };

  const handleApply = async () => {
    if (!viewShotRef.current || !canvasSize.width || !canvasSize.height || !isImageReady) {
      Alert.alert(
        "Capture indisponible",
        "La capture n'est pas prête. Patientez une seconde puis réessayez."
      );
      return;
    }
    try {
      setIsSaving(true);
      await new Promise((resolve) => requestAnimationFrame(() => resolve()));
      const dataUri = await viewShotRef.current.capture?.({
        format: "png",
        quality: 1,
        result: "data-uri",
      });
      if (dataUri?.length) {
        onApply?.(dataUri);
      } else {
        throw new Error("Capture annotée vide");
      }
    } catch (error) {
      console.log("Annotator capture failed", error);
      Alert.alert(
        "Enregistrement impossible",
        "Impossible de sauvegarder l'annotation. Réessayez."
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      supportedOrientations={[
        "portrait",
        "portrait-upside-down",
        "landscape",
        "landscape-left",
        "landscape-right",
      ]}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Pressable onPress={onClose} style={[styles.pillButton, styles.secondary]}>
              <Text style={[styles.buttonText, styles.secondaryText]}>Fermer</Text>
            </Pressable>
            <View style={styles.headerActions}>
              <Pressable onPress={handleClear} style={[styles.pillButton, styles.secondary]}>
                <Text style={[styles.buttonText, styles.secondaryText]}>Effacer</Text>
              </Pressable>
              <Pressable
                onPress={isSaving ? () => {} : handleApply}
                style={[
                  styles.pillButton,
                  styles.primary,
                  isSaving ? styles.disabled : null,
                ]}
              >
                <Text style={styles.buttonText}>
                  {isSaving ? "Sauvegarde..." : "Appliquer"}
                </Text>
              </Pressable>
            </View>
          </View>

          <View style={styles.canvasWrapper}>
            <ViewShot
              ref={viewShotRef}
              style={styles.captureArea}
              options={{ format: "png", quality: 1, result: "data-uri" }}
              collapsable={false}
              renderToHardwareTextureAndroid
            >
              <View
                style={styles.imageWrapper}
                onLayout={(evt) => {
                  const { width, height } = evt.nativeEvent.layout;
                  setCanvasSize({ width, height });
                }}
                collapsable={false}
              >
                {localImageUri ? (
                  <Image
                    source={{ uri: localImageUri }}
                    resizeMode="contain"
                    style={StyleSheet.absoluteFill}
                    onLoad={() => setIsImageReady(true)}
                    onLoadEnd={() => setIsImageReady(true)}
                    onError={() => setIsImageReady(true)}
                  />
                ) : (
                  <View style={styles.screenshotFallback} />
                )}
                {Boolean(canvasSize.width && canvasSize.height) ? (
                  <Svg
                    width={canvasSize.width}
                    height={canvasSize.height}
                    style={StyleSheet.absoluteFill}
                    pointerEvents="none"
                  >
                    {paths.map((points, idx) => (
                      <Path
                        key={`path-${idx}`}
                        d={buildPathD(points)}
                        fill="none"
                        stroke={COLORS.primary}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ))}
                    {currentPath.length ? (
                      <Path
                        d={buildPathD(currentPath)}
                        fill="none"
                        stroke={COLORS.primary}
                        strokeWidth={4}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    ) : null}
                  </Svg>
                ) : null}
                <View
                  style={StyleSheet.absoluteFill}
                  {...panResponder.panHandlers}
                  pointerEvents="box-only"
                />
              </View>
            </ViewShot>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ScreenshotAnnotatorModal;

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(14, 14, 18, 0.82)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 900,
    height: "90%",
    backgroundColor: COLORS.surface,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    gap: 12,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  headerActions: {
    flexDirection: "row",
    gap: 10,
  },
  pillButton: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  primary: {
    backgroundColor: COLORS.primary,
    borderColor: COLORS.primary,
  },
  secondary: {
    backgroundColor: COLORS.surface,
  },
  buttonText: {
    color: COLORS.textPrimary,
    fontWeight: "700",
    fontSize: 14,
  },
  secondaryText: {
    color: COLORS.textPrimary,
  },
  disabled: {
    opacity: 0.7,
  },
  canvasWrapper: {
    flex: 1,
    borderRadius: 16,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
    backgroundColor: COLORS.background,
  },
  captureArea: {
    flex: 1,
    backgroundColor: COLORS.background,
    overflow: "hidden",
  },
  imageWrapper: {
    flex: 1,
    backgroundColor: COLORS.background,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
  },
  screenshotFallback: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: COLORS.background,
  },
});
