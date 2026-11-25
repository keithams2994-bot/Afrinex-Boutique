---
name: android-apk-diagnostic
description: Diagnostic, compilation et vérification de conformité des applications mobiles Android (APK, SDK, Gradle, Capacitor/Ionic). À utiliser lors de la génération, signature ou débogage des builds mobiles d'entreprise.
---

# Diagnostic et Déploiement Mobile Android

Ce guide détaille les étapes techniques pour diagnostiquer, compiler et valider des APK d'entreprise pour les terminaux terrain (Nimba, HopiGestion, caisses mobiles).

---

## 1. Environnement Java & Gradle

- **Sélection du JDK** :
  - Pour les projets récents (Gradle 8+) : privilégier **JDK 17** ou **JDK 21** (déjà présents dans l'environnement local : `scratch/jdk17` et `scratch/jdk21`).
  - S'assurer que `JAVA_HOME` pointe vers un JDK 64 bits valide.

```powershell
# Définir temporairement le JAVA_HOME pour un build
$env:JAVA_HOME = "C:\Users\PC\.gemini\antigravity\scratch\jdk17\zulu17.54.21-ca-jdk17.0.13-win_x64"
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
java -version
```

---

## 2. Compilation et Audit de l'APK

1. **Compilation Release** :
   ```bash
   ./gradlew clean assembleRelease
   ```
2. **Alignement et Optimisation (`zipalign`)** :
   ```bash
   zipalign -v -p 4 app-release-unsigned.apk app-release-aligned.apk
   ```
3. **Signature cryptographique (`apksigner`)** :
   ```bash
   apksigner sign --ks keystore.jks --ks-key-alias alias_name --out app-release-signed.apk app-release-aligned.apk
   apksigner verify -v app-release-signed.apk
   ```

---

## 3. Checklist de Sécurité & Robustesse Terrain

- [ ] `android:usesCleartextTraffic="false"` (sauf environnement de test local explicitement déclaré).
- [ ] Permissions minimales dans `AndroidManifest.xml` (caméra pour code-barres, stockage local, réseau).
- [ ] Support des tablettes et orientation d'écran adéquate (paysage pour POS, portrait pour mobilité).
- [ ] Comportement WebView : stockage des tokens dans le Secure Storage (Keystore Android) et non en clair dans `localStorage`.
