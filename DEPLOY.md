# 🚀 Guide de déploiement — Tontine Structurelle

## Étape 1 — Installer les dépendances
```bash
npm install
```

## Étape 2 — Tester en local
```bash
npm run dev
```
Ouvre http://localhost:5173

## Étape 3 — Règles Firestore
1. Va sur console.firebase.google.com
2. Ton projet → Firestore Database → Règles
3. Copie-colle tout le contenu de `firestore.rules`
4. Clique "Publier"

## Étape 4 — GitHub
```bash
git init
git add .
git commit -m "Tontine Structurelle v1.0"
git branch -M main
git remote add origin https://github.com/TON_USERNAME/tontine-structurelle.git
git push -u origin main
```

## Étape 5 — Vercel
1. Va sur vercel.com → New Project
2. Importe ton repo GitHub
3. Framework : Vite (détecté automatiquement)
4. Clique Deploy
5. Ton app est en ligne !

## Notes importantes
- firestore.rules → copie dans la console Firebase
- Les notifications push fonctionnent sur Android + Safari iOS 16.4+
- Images stockées en Base64 dans Firestore (gratuit)
