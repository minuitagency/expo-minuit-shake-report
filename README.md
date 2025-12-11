# expo-minuit-shake-report

Provider Expo/React Native pour déclencher un formulaire de bug report en secouant l’app. La lib capture l’écran, préremplit l’email si fourni et envoie le payload vers l’endpoint Minuit.

## Fonctionnalités
- Détection de secousses (accéléromètre) avec seuil configurable et anti-spam (cooldown).
- Capture automatique de l’écran (PNG base64) avant l’ouverture de la modale.
- UI prête à l’emploi : modale floutée, email optionnel, description obligatoire, aperçu de la capture.
- Hook `useShakeReport` pour ouvrir manuellement le reporter et connaître l’état d’envoi.
- Envoi JSON vers l’endpoint Cloud Functions Minuit (`tasks-publishTask`) avec le payload complet.

## Prérequis
- Expo `>=53.0.0`, React `>=18.0.0`, React Native `>=0.79.0`.
- Dépendances déjà embarquées : `expo-sensors`, `react-native-view-shot`, `expo-blur` (aucune install supplémentaire).
- Cible principale : iOS/Android. Sur web, la capture d’écran est désactivée, donc aucun envoi n’est possible sans implémenter votre propre capture.

## Installation

```bash
yarn add expo-minuit-shake-report
```

## Mise en place rapide

```jsx
import { ShakeReportProvider } from "expo-minuit-shake-report";

export default function App() {
  return (
    <ShakeReportProvider projectID="your-project-id" defaultEmail="user@email.com">
      <YourApp />
    </ShakeReportProvider>
  );
}
```

`projectID` est obligatoire. `defaultEmail` permet de préremplir le champ email si vous le connaissez déjà.

## Ouvrir le reporter manuellement

```jsx
import { useShakeReport } from "expo-minuit-shake-report";

const HelpButton = () => {
  const { openReporter, isReporterOpen, isSendingReport } = useShakeReport();

  return (
    <Pressable onPress={openReporter} disabled={isSendingReport || isReporterOpen}>
      <Text>Signaler un problème</Text>
    </Pressable>
  );
};
```

## Comportement et API
- Détection : échantillonnage accéléromètre à 200 ms, seuil 1.65 g, cooldown 4.5 s avant un nouveau déclenchement.
- Capture : `captureScreen` (PNG, 0.85) avant l’ouverture de la modale. Sur échec, la capture est vidée et un message d’erreur s’affiche.
- Validation : `projectID` requis, description non vide, capture obligatoire avant envoi.
- Envoi : POST `https://europe-west1-minuitcloud.cloudfunctions.net/tasks-publishTask` avec le body `{ data: payload }`.
  - `payload` : `{ projectID, email, description, screenshotDataUrl, platform, source: "APP_SHAKE" }`.
- Retour UX : alerte de succès en cas d’envoi, message d’erreur si l’appel échoue ou si le réseau est absent.

## Personnalisation
- Pour cibler un autre backend, modifiez `REPORT_ENDPOINT` dans `src/constants.js`.
- Les paramètres de détection (`DEFAULT_THRESHOLD`, `DEFAULT_COOLDOWN_MS`, `DEFAULT_SAMPLE_INTERVAL_MS`) sont dans `src/constants.js` si vous devez les ajuster.

## Conseils de tests
- Testez sur un device ou un émulateur avec accéléromètre (secouez pour ouvrir la modale et vérifier l’aperçu).
- Coupez le réseau pour vérifier le message d’erreur, puis réactivez-le pour valider l’envoi réel.
