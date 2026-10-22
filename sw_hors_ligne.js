// Service worker de la version publiée : garde l'application en mémoire pour qu'elle marche
// sans connexion. tools/publier_web.py remplace VERSION et FICHIERS à chaque publication.
'use strict';

const VERSION = "d4b9b66c8dc7";
const FICHIERS = [
  "./",
  "assets/AssetManifest.bin",
  "assets/AssetManifest.bin.json",
  "assets/FontManifest.json",
  "assets/NOTICES",
  "assets/assets/fonts/Nunito-Variable.ttf",
  "assets/assets/packs/6e-2026-2027/pack.json",
  "assets/assets/packs/index.json",
  "assets/fonts/MaterialIcons-Regular.otf",
  "assets/fonts/fallback/Roboto-Regular.ttf",
  "assets/packages/cupertino_icons/assets/CupertinoIcons.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_AMS-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Caligraphic-Bold.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Caligraphic-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Fraktur-Bold.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Fraktur-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Main-Bold.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Main-BoldItalic.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Main-Italic.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Main-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Math-BoldItalic.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Math-Italic.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_SansSerif-Bold.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_SansSerif-Italic.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_SansSerif-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Script-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Size1-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Size2-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Size3-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Size4-Regular.ttf",
  "assets/packages/flutter_math_fork/lib/katex_fonts/fonts/KaTeX_Typewriter-Regular.ttf",
  "assets/packages/material_ui/shaders/ink_sparkle.frag",
  "assets/shaders/ink_sparkle.frag",
  "assets/shaders/stretch_effect.frag",
  "canvaskit/canvaskit.js",
  "canvaskit/canvaskit.wasm",
  "canvaskit/chromium/canvaskit.js",
  "canvaskit/chromium/canvaskit.wasm",
  "drift_worker.js",
  "favicon.png",
  "flutter.js",
  "flutter_bootstrap.js",
  "icons/Icon-192.png",
  "icons/Icon-512.png",
  "icons/Icon-maskable-192.png",
  "icons/Icon-maskable-512.png",
  "icons/apple-touch-icon.png",
  "index.html",
  "main.dart.js",
  "manifest.json",
  "sqlite3.wasm",
  "version.json"
];
const CACHE = 'aide-6e-' + VERSION;
const PREFIXE = 'aide-6e-';

const adresse = (chemin) => new URL(chemin, self.registration.scope).href;

// Installation : on télécharge toute l'appli d'un coup, sans passer par le cache HTTP.
self.addEventListener('install', (evenement) => {
  evenement.waitUntil(
    caches
      .open(CACHE)
      .then((cache) =>
        cache.addAll(FICHIERS.map((f) => new Request(adresse(f), { cache: 'reload' }))),
      )
      .then(() => self.skipWaiting()),
  );
});

// Activation : on efface les versions précédentes.
self.addEventListener('activate', (evenement) => {
  evenement.waitUntil(
    caches
      .keys()
      .then((cles) =>
        Promise.all(
          cles
            .filter((cle) => cle.startsWith(PREFIXE) && cle !== CACHE)
            .map((cle) => caches.delete(cle)),
        ),
      )
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (evenement) => {
  const requete = evenement.request;
  if (requete.method !== 'GET') return;
  if (new URL(requete.url).origin !== self.location.origin) return;

  // Ouverture de l'appli : le réseau d'abord (pour les mises à jour), sinon la copie gardée.
  if (requete.mode === 'navigate') {
    evenement.respondWith(
      fetch(requete).catch(() => caches.match(adresse('index.html'))),
    );
    return;
  }

  // Le reste : la copie gardée d'abord, sinon le réseau, et on garde ce qui arrive.
  evenement.respondWith(
    caches.match(requete, { ignoreSearch: true }).then(
      (copie) =>
        copie ||
        fetch(requete).then((reponse) => {
          if (reponse.ok) {
            const double = reponse.clone();
            caches.open(CACHE).then((cache) => cache.put(requete, double));
          }
          return reponse;
        }),
    ),
  );
});
