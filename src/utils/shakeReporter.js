import { Platform } from "react-native";

export const PLATFORM_LABELS = {
  ios: "IOS",
  android: "ANDROID",
  web: "WEB",
};

export const resolvePlatformLabel = () =>
  PLATFORM_LABELS[Platform.OS] || "WEB";

export const computeAccelerationMagnitude = ({ x = 0, y = 0, z = 0 } = {}) => {
  return Math.sqrt(x * x + y * y + z * z);
};

export const shouldTriggerShake = ({
  acceleration = {},
  threshold = 1.65,
  lastTriggerAt = 0,
  cooldownMs = 4000,
} = {}) => {
  const magnitude = computeAccelerationMagnitude(acceleration);

  if (!Number.isFinite(magnitude) || magnitude < threshold) {
    return false;
  }

  const now = Date.now();

  if (lastTriggerAt && now - lastTriggerAt < cooldownMs) {
    return false;
  }

  return true;
};

export const buildScreenshotDataUrl = (base64 = "") => {
  if (typeof base64 !== "string" || !base64.length) {
    return "";
  }

  const trimmed = base64.trim();

  if (trimmed.startsWith("data:image")) {
    return trimmed;
  }

  return `data:image/png;base64,${trimmed}`;
};

export const extractBase64FromDataUrl = (dataUrl = "") => {
  if (typeof dataUrl !== "string" || !dataUrl.length) {
    return "";
  }

  const trimmed = dataUrl.trim();
  if (!trimmed.length) {
    return "";
  }

  const match = trimmed.match(/^data:(image\/[a-zA-Z0-9.+-]+);base64,([\s\S]+)$/);

  if (match?.[2]?.length) {
    return match[2];
  }

  if (trimmed.startsWith("data:image")) {
    const commaIndex = trimmed.indexOf(",");
    if (commaIndex !== -1) {
      return trimmed.slice(commaIndex + 1);
    }
  }

  return trimmed;
};

export const buildShakePayload = ({
  projectID = null,
  email = "",
  description = "",
  screenshotDataUrl = "",
  source = "APP_SHAKE",
} = {}) => ({
  platform: resolvePlatformLabel(),
  projectID: projectID || null,
  email: email || "",
  description: description?.trim() || "",
  screenshotDataUrl: screenshotDataUrl || "",
  source: source || "APP_SHAKE",
});

export const postShakeReport = async ({
  endpoint = null,
  payload = {},
  timeoutMs = null,
} = {}) => {
  if (!endpoint) {
    throw new Error("Aucun endpoint de réception configuré pour le signalement.");
  }

  const controller = timeoutMs ? new AbortController() : null;
  const timeoutId = timeoutMs
    ? setTimeout(() => controller?.abort(), timeoutMs)
    : null;

  try {
    const headers = {
      Accept: "application/json",
      "Content-Type": "application/json",
    };

    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ data: payload }),
      signal: controller?.signal,
    });

    const body = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error = new Error(
        body?.message || body?.error || `Requête échouée (${response.status})`
      );
      error.status = response.status;
      error.body = body;
      throw error;
    }

    return body;
  } catch (error) {
    if (timeoutMs && error?.name === "AbortError") {
      const timeoutError = new Error(
        "Le signalement met trop de temps à être envoyé. Réessayez avec du réseau."
      );
      timeoutError.code = "ABORTED";
      throw timeoutError;
    }
    throw error;
  } finally {
    if (timeoutId) clearTimeout(timeoutId);
  }
};
