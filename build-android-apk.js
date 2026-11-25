const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const zlib = require('zlib');

console.log('🚀 Démarrage du pipeline de compilation Android pour Afrinex Boutique...');

// Configuration des outils
const JDK_DIR = 'C:\\Users\\PC\\.gemini\\antigravity\\scratch\\jdk17\\zulu17.54.21-ca-jdk17.0.13-win_x64';
const JAVA = path.join(JDK_DIR, 'bin', 'java.exe');
const JAVAC = path.join(JDK_DIR, 'bin', 'javac.exe');
const JAR = path.join(JDK_DIR, 'bin', 'jar.exe');
const KEYTOOL = path.join(JDK_DIR, 'bin', 'keytool.exe');

const SDK_DIR = 'C:\\Users\\PC\\AppData\\Local\\Android\\Sdk';
const BUILD_TOOLS_DIR = path.join(SDK_DIR, 'build-tools', '35.0.0');
const AAPT2 = path.join(BUILD_TOOLS_DIR, 'aapt2.exe');
const D8_JAR = path.join(BUILD_TOOLS_DIR, 'lib', 'd8.jar');
const ZIPALIGN = path.join(BUILD_TOOLS_DIR, 'zipalign.exe');
const APKSIGNER_JAR = path.join(BUILD_TOOLS_DIR, 'lib', 'apksigner.jar');
const ANDROID_JAR = path.join(SDK_DIR, 'platforms', 'android-36', 'android.jar');

const PROJECT_DIR = __dirname;
const ANDROID_DIR = path.join(PROJECT_DIR, 'android-app');
const BUILD_DIR = path.join(ANDROID_DIR, 'build');
const SRC_DIR = path.join(ANDROID_DIR, 'src', 'com', 'afrinex', 'boutique');
const RES_DIR = path.join(ANDROID_DIR, 'res');
const ASSETS_DIR = path.join(ANDROID_DIR, 'assets');

// Création des répertoires
[
  BUILD_DIR,
  SRC_DIR,
  path.join(RES_DIR, 'values'),
  path.join(RES_DIR, 'mipmap-hdpi'),
  path.join(RES_DIR, 'mipmap-xhdpi'),
  path.join(RES_DIR, 'mipmap-xxhdpi'),
  ASSETS_DIR,
  path.join(BUILD_DIR, 'compiled-res'),
  path.join(BUILD_DIR, 'gen'),
  path.join(BUILD_DIR, 'classes')
].forEach(dir => fs.mkdirSync(dir, { recursive: true }));

console.log('📁 Répertoires préparés.');

// 1. Copie des fichiers Web dans assets/
console.log('📦 Synchronisation des fichiers HTML et images de produits...');
fs.copyFileSync(path.join(PROJECT_DIR, 'index.html'), path.join(ASSETS_DIR, 'index.html'));

const destProductsDir = path.join(ASSETS_DIR, 'assets', 'products');
fs.mkdirSync(destProductsDir, { recursive: true });
const srcProductsDir = path.join(PROJECT_DIR, 'assets', 'products');
if (fs.existsSync(srcProductsDir)) {
  fs.readdirSync(srcProductsDir).forEach(file => {
    fs.copyFileSync(path.join(srcProductsDir, file), path.join(destProductsDir, file));
  });
}
console.log('✅ Assets synchronisés dans APK.');

// 2. Génération de l'icône de l'application (PNG pur sans dépendance)
function createSquarePng(size, r, g, b) {
  function crc32(buf) {
    let table = new Uint32Array(256);
    for (let i = 0; i < 256; i++) {
      let c = i;
      for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
      table[i] = c;
    }
    let crc = -1;
    for (let i = 0; i < buf.length; i++) crc = table[(crc ^ buf[i]) & 0xFF] ^ (crc >>> 8);
    return (crc ^ -1) >>> 0;
  }
  function makeChunk(type, data) {
    const len = Buffer.alloc(4); len.writeUInt32BE(data.length, 0);
    const typeBuf = Buffer.from(type, 'ascii');
    const crcBuf = Buffer.alloc(4);
    const crcVal = crc32(Buffer.concat([typeBuf, data]));
    crcBuf.writeUInt32BE(crcVal, 0);
    return Buffer.concat([len, typeBuf, data, crcBuf]);
  }
  const sig = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(size, 0);
  ihdrData.writeUInt32BE(size, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2; // RGB
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;
  const ihdr = makeChunk('IHDR', ihdrData);

  const raw = Buffer.alloc((size * 3 + 1) * size);
  let pos = 0;
  for (let y = 0; y < size; y++) {
    raw[pos++] = 0; // filter none
    for (let x = 0; x < size; x++) {
      const cx = x - size / 2;
      const cy = y - size / 2;
      const dist = Math.sqrt(cx * cx + cy * cy);
      if (dist > size * 0.48) {
        raw[pos++] = 15; raw[pos++] = 23; raw[pos++] = 42; // Dark background
      } else if (dist > size * 0.44) {
        raw[pos++] = 37; raw[pos++] = 99; raw[pos++] = 235; // Blue border
      } else {
        raw[pos++] = r; raw[pos++] = g; raw[pos++] = b; // POS Emerald/Navy
      }
    }
  }
  const idatData = zlib.deflateSync(raw);
  const idat = makeChunk('IDAT', idatData);
  const iend = makeChunk('IEND', Buffer.alloc(0));
  return Buffer.concat([sig, ihdr, idat, iend]);
}

const iconHdpi = createSquarePng(72, 16, 185, 129);
const iconXhdpi = createSquarePng(96, 16, 185, 129);
const iconXxhdpi = createSquarePng(144, 16, 185, 129);

fs.writeFileSync(path.join(RES_DIR, 'mipmap-hdpi', 'ic_launcher.png'), iconHdpi);
fs.writeFileSync(path.join(RES_DIR, 'mipmap-xhdpi', 'ic_launcher.png'), iconXhdpi);
fs.writeFileSync(path.join(RES_DIR, 'mipmap-xxhdpi', 'ic_launcher.png'), iconXxhdpi);
console.log('🎨 Icônes HD générées.');

// 3. strings.xml
fs.writeFileSync(
  path.join(RES_DIR, 'values', 'strings.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">Afrinex Boutique</string>
</resources>`
);

// 4. AndroidManifest.xml
fs.writeFileSync(
  path.join(ANDROID_DIR, 'AndroidManifest.xml'),
  `<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    package="com.afrinex.boutique"
    android:versionCode="1"
    android:versionName="1.0.0">

    <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="35" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.CAMERA" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:allowBackup="true"
        android:supportsRtl="true"
        android:hardwareAccelerated="true"
        android:theme="@android:style/Theme.NoTitleBar.Fullscreen">
        
        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden|smallestScreenSize|screenLayout">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>`
);

// 5. MainActivity.java
fs.writeFileSync(
  path.join(SRC_DIR, 'MainActivity.java'),
  `package com.afrinex.boutique;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.view.Window;
import android.view.WindowManager;

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        requestWindowFeature(Window.FEATURE_NO_TITLE);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_FULLSCREEN, WindowManager.LayoutParams.FLAG_FULLSCREEN);
        
        webView = new WebView(this);
        setContentView(webView);

        WebSettings ws = webView.getSettings();
        ws.setJavaScriptEnabled(true);
        ws.setDomStorageEnabled(true);
        ws.setDatabaseEnabled(true);
        ws.setAllowFileAccess(true);
        ws.setAllowContentAccess(true);
        ws.setAllowFileAccessFromFileURLs(true);
        ws.setAllowUniversalAccessFromFileURLs(true);
        ws.setLoadWithOverviewMode(true);
        ws.setUseWideViewPort(true);

        webView.setWebViewClient(new WebViewClient());
        webView.setWebChromeClient(new WebChromeClient());

        webView.loadUrl("file:///android_asset/index.html");
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}`
);

console.log('📄 Code Java et Manifest générés.');

function run(cmd, desc) {
  console.log(`\n⏳ ${desc}...`);
  console.log(`   > ${cmd}`);
  const out = execSync(cmd, { stdio: 'pipe' });
  if (out && out.length > 0) {
    console.log(`   ${out.toString().trim()}`);
  }
}

// 6. AAPT2 Compile
const compiledResZip = path.join(BUILD_DIR, 'compiled-res', 'resources.zip');
run(`"${AAPT2}" compile --dir "${RES_DIR}" -o "${compiledResZip}"`, 'Compilation des ressources (aapt2 compile)');

// 7. AAPT2 Link
const unalignedApk = path.join(BUILD_DIR, 'unaligned.apk');
run(`"${AAPT2}" link -I "${ANDROID_JAR}" --manifest "${path.join(ANDROID_DIR, 'AndroidManifest.xml')}" -o "${unalignedApk}" -A "${ASSETS_DIR}" --java "${path.join(BUILD_DIR, 'gen')}" "${compiledResZip}" --auto-add-overlay`, 'Liaison des ressources et génération R.java (aapt2 link)');

// 8. Compilation Java avec javac
const genRJava = path.join(BUILD_DIR, 'gen', 'com', 'afrinex', 'boutique', 'R.java');
const mainActivityJava = path.join(SRC_DIR, 'MainActivity.java');
const classesDir = path.join(BUILD_DIR, 'classes');
run(`"${JAVAC}" -cp "${ANDROID_JAR}" -d "${classesDir}" "${genRJava}" "${mainActivityJava}"`, 'Compilation Java en bytecode (javac)');

// 9. Dexing avec d8 (Appel direct via java -cp d8.jar)
const classFilesDir = path.join(classesDir, 'com', 'afrinex', 'boutique');
const classFiles = fs.readdirSync(classFilesDir)
  .filter(f => f.endsWith('.class'))
  .map(f => `"${path.join(classFilesDir, f)}"`)
  .join(' ');

run(`"${JAVA}" -cp "${D8_JAR}" com.android.tools.r8.D8 --output "${BUILD_DIR}" --lib "${ANDROID_JAR}" ${classFiles}`, 'Conversion en bytecode Dalvik/ART (d8)');

// 10. Insertion de classes.dex dans l'APK
// Utilisation de jar.exe avec chemin relatif
run(`"${JAR}" uf "${unalignedApk}" -C "${BUILD_DIR}" classes.dex`, "Insertion de classes.dex dans l'APK");

// 11. Zipalign (alignement 4 octets)
const alignedApk = path.join(BUILD_DIR, 'aligned.apk');
if (fs.existsSync(alignedApk)) fs.unlinkSync(alignedApk);
run(`"${ZIPALIGN}" -f -p 4 "${unalignedApk}" "${alignedApk}"`, 'Alignement de mémoire (zipalign 4 octets)');

// 12. Keystore de signature
const keystorePath = path.join(ANDROID_DIR, 'release.keystore');
if (!fs.existsSync(keystorePath)) {
  run(`"${KEYTOOL}" -genkeypair -v -keystore "${keystorePath}" -alias afrinex -keyalg RSA -keysize 2048 -validity 10000 -storepass afrinex123 -keypass afrinex123 -dname "CN=Afrinex, OU=POS, O=Afrinex, C=GN"`, 'Création du trousseau de signature d’entreprise (keytool)');
}

// 13. Signature avec apksigner (Appel direct via java -jar apksigner.jar)
const finalApk = path.join(PROJECT_DIR, 'Afrinex-Boutique.apk');
if (fs.existsSync(finalApk)) fs.unlinkSync(finalApk);
run(`"${JAVA}" -jar "${APKSIGNER_JAR}" sign --ks "${keystorePath}" --ks-pass pass:afrinex123 --out "${finalApk}" "${alignedApk}"`, 'Signature cryptographique v2/v3 (apksigner)');

// 14. Vérification de la signature
run(`"${JAVA}" -jar "${APKSIGNER_JAR}" verify -v "${finalApk}"`, 'Vérification de conformité de l’APK');

// 15. Copie vers le Bureau pour téléchargement immédiat
const desktopApk = 'C:\\Users\\PC\\Desktop\\Afrinex-Boutique.apk';
fs.copyFileSync(finalApk, desktopApk);

const stats = fs.statSync(finalApk);
console.log('\n🎉 ========================================================');
console.log(`✅ SUCCÈS TOTAL : Application Android générée avec succès !`);
console.log(`📦 Fichier APK : ${finalApk}`);
console.log(`🖥️ Copie Bureau : ${desktopApk}`);
console.log(`⚖️ Taille APK  : ${(stats.size / (1024 * 1024)).toFixed(2)} Mo`);
console.log('🎉 ========================================================\n');
