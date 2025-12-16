# expo-minuit-shake-report

Provider Expo/React Native pour déclencher un formulaire de bug report en secouant l’app. La lib capture l’écran, préremplit l’email si fourni et envoie le payload vers l’endpoint Minuit.

## Fonctionnalités
- Détection de secousses (accéléromètre) avec seuil configurable et anti-spam (cooldown).
- Capture automatique de l’écran (PNG base64) avant l’ouverture de la modale.
- UI prête à l’emploi (iPhone/iPad/tablettes) : modale floutée, email optionnel, description obligatoire, aperçu de la capture.
- Hook `useShakeReport` pour ouvrir manuellement le reporter et connaître l’état d’envoi.
- Envoi JSON vers l’endpoint Cloud Functions Minuit (`tasks-publishTask`) avec le payload complet.

## Prérequis
- Expo `>=53.0.0`, React `>=18.0.0`, React Native `>=0.79.0`.
- Dépendances déjà embarquées : `expo-sensors`, `react-native-view-shot`, `expo-blur` (aucune install supplémentaire).
- Cible principale : iOS/Android. Sur web, la capture d’écran est désactivée, donc aucun envoi n’est possible sans implémenter votre propre capture.

## iPad / tablettes
- La modale s’adapte aux grands écrans (iPad) et aux modes Split View (hauteur dynamique).
- Pour que votre app Expo s’installe bien sur iPad, vérifiez que `ios.supportsTablet` est activé dans votre `app.json`/`app.config.js` (et, si vous voulez autoriser Split View, que `UIRequiresFullScreen` n’est pas forcé à `true`).

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
