import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Alert, Platform } from "react-native";
import { Accelerometer } from "expo-sensors";
import { captureScreen } from "react-native-view-shot";

import ShakeReportModal from "./components/ShakeReportModal";
import {
  DEFAULT_COOLDOWN_MS,
  DEFAULT_SAMPLE_INTERVAL_MS,
  DEFAULT_SOURCE,
  DEFAULT_THRESHOLD,
  REPORT_ENDPOINT,
} from "./constants";
import {
  buildScreenshotDataUrl,
  buildShakePayload,
  extractBase64FromDataUrl,
  postShakeReport,
  shouldTriggerShake,
} from "./utils/shakeReporter";

const ShakeReportContext = createContext({
  openReporter: () => {},
  isReporterOpen: false,
  isSendingReport: false,
});

export const ShakeReportProvider = ({ children, projectID, defaultEmail = "" }) => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [description, setDescription] = useState("");
  const [email, setEmail] = useState(defaultEmail || "");
  const [screenshotBase64, setScreenshotBase64] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [isCapturing, setIsCapturing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const screenshotDataUrl = useMemo(
    () => buildScreenshotDataUrl(screenshotBase64),
    [screenshotBase64]
  );

  const lastShakeAtRef = useRef(0);

  const setScreenshotFromBase64 = useCallback((base64 = "") => {
    const extracted = extractBase64FromDataUrl(base64) || "";
    const normalized = extracted.replace(/\s+/g, "");
    setScreenshotBase64(normalized);
  }, []);

  useEffect(() => {
    if (defaultEmail && !email) {
      setEmail(defaultEmail);
    }
  }, [defaultEmail, email]);

  const closeModal = useCallback(() => {
    setModalVisible(false);
    setDescription("");
    setErrorMessage("");
    setScreenshotBase64("");
    setIsSubmitting(false);
  }, []);

  const captureScreenshot = useCallback(async () => {
    if (Platform.OS === "web") {
      setScreenshotFromBase64("");
      return "";
    }

    setIsCapturing(true);

    try {
      const base64 = await captureScreen({
        format: "png",
        quality: 0.85,
        result: "base64",
      });

      setScreenshotFromBase64(base64);
      return base64 || "";
    } catch (error) {
      setScreenshotFromBase64("");
      console.log("Shake reporter capture failed", error);
      Alert.alert(
        "Capture impossible",
        "Impossible de récupérer la capture d'écran pour le signalement."
      );
      return "";
    } finally {
      setIsCapturing(false);
    }
  }, [setScreenshotFromBase64]);

  const openReporter = useCallback(async () => {
    if (isCapturing || isModalVisible) {
      return;
    }

    setErrorMessage("");
    await captureScreenshot();
    setDescription("");
    setModalVisible(true);
  }, [captureScreenshot, isCapturing, isModalVisible]);

  const submitReport = useCallback(async () => {
    setErrorMessage("");

    if (!projectID) {
      setErrorMessage("ProjectID manquant pour le signalement.");
      return;
    }

    if (!screenshotBase64) {
      setErrorMessage("Aucune capture d'écran disponible pour le signalement.");
      return;
    }

    if (!description?.trim()?.length) {
      setErrorMessage("Ajoutez une description avant d'envoyer.");
      return;
    }

    try {
      setIsSubmitting(true);
      const payload = buildShakePayload({
        projectID,
        email,
        description,
        screenshotDataUrl: extractBase64FromDataUrl(screenshotBase64),
        source: DEFAULT_SOURCE,
      });
      await postShakeReport({
        endpoint: REPORT_ENDPOINT,
        payload,
      });
      Alert.alert("Signalement envoyé", "Merci pour votre retour.");
      closeModal();
    } catch (error) {
      setErrorMessage(
        typeof error?.message === "string"
          ? error.message
          : "Impossible d'envoyer le signalement pour le moment."
      );
    } finally {
      setIsSubmitting(false);
    }
  }, [
    closeModal,
    description,
    email,
    projectID,
    screenshotBase64,
  ]);

  useEffect(() => {
    if (Platform.OS === "web") {
      return undefined;
    }

    Accelerometer.setUpdateInterval(DEFAULT_SAMPLE_INTERVAL_MS);

    const subscription = Accelerometer.addListener((acceleration) => {
      if (
        shouldTriggerShake({
          acceleration,
          threshold: DEFAULT_THRESHOLD,
          lastTriggerAt: lastShakeAtRef.current,
          cooldownMs: DEFAULT_COOLDOWN_MS,
        })
      ) {
        lastShakeAtRef.current = Date.now();

        if (!isModalVisible && !isCapturing && !isSubmitting) {
          openReporter();
        }
      }
    });

    return () => {
      subscription?.remove();
    };
  }, [isCapturing, isModalVisible, isSubmitting, openReporter]);

  const contextValue = useMemo(
    () => ({
      openReporter,
      isReporterOpen: isModalVisible,
      isSendingReport: isSubmitting,
    }),
    [isModalVisible, isSubmitting, openReporter]
  );

  return (
    <ShakeReportContext.Provider value={contextValue}>
      {children}
      <ShakeReportModal
        visible={isModalVisible}
        onRequestClose={closeModal}
        onClose={closeModal}
        onSubmit={submitReport}
        isCapturing={isCapturing}
        isSubmitting={isSubmitting}
        screenshotDataUrl={screenshotDataUrl}
        description={description}
        onChangeDescription={setDescription}
        email={email}
        onChangeEmail={setEmail}
        errorMessage={errorMessage}
      />
    </ShakeReportContext.Provider>
  );
};

export const useShakeReport = () => useContext(ShakeReportContext);

export default ShakeReportProvider;
