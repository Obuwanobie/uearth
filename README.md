# 🌍 U-Earth

**Visualisation interactive du système Terre-Soleil**

U-Earth affiche simultanément plusieurs vues synchronisées de la Terre pour explorer la géométrie terrestre et le cycle jour/nuit.

## ✨ Fonctionnalités

### 🗺️ Cinq Vues Synchronisées
- **Globe 3D** : Vue réaliste de la Terre avec rotation interactive et shader jour/nuit
- **Projection Mercator** : La carte rectangulaire standard (zoom & pan)
- **Projection Azimutale Équidistante** : Le modèle "Terre Plate" centré au Pôle Nord (zoom & pan)
- **Système Solaire** : Vue orbitale montrant la Terre autour du Soleil avec orbite elliptique, axe incliné (23.5°), Lune, et distance Terre-Soleil en temps réel
- **Rayons du Soleil** : Visualisation pédagogique des rayons solaires parallèles, de l'axe terrestre et du terminateur

### ☀️ Simulation Solaire Avancée
- Contrôle temporel (heure et jour de l'année)
- Préréglages rapides pour les solstices et équinoxes
- Rendu du cycle jour/nuit sur toutes les vues
- L'éclairage reste fixe par rapport au Soleil (ne bouge pas avec la rotation de la vue)
- **Point clé pédagogique** : Sur la carte "Terre Plate", la zone éclairée forme une forme de "haricot" déformée en hiver

### ✏️ Outils de Tracé Avancés
- **Mode Main** : Navigation (pan/zoom) sur les cartes
- **Mode Tracé** : Dessiner des lignes entre deux points
- Tracez une ligne **droite** sur n'importe quelle vue
- La ligne est projetée sur toutes les autres vues avec la **distance** affichée
- Chaque ligne affiche sa **distance géodésique en kilomètres**
- Liste des lignes dans le panneau latéral avec suppression individuelle
- Une ligne droite sur Mercator devient courbe sur le globe et sur l'azimutale
- Une ligne droite sur l'azimutale révèle une trajectoire aberrante sur le globe réel

### 🌐 Système Solaire Interactif
- Orbite elliptique réaliste avec aphélie et périhélie
- Affichage de la distance Terre-Soleil en millions de km
- Animation de l'orbite avec contrôle de vitesse
- Choix du centre de rotation : Soleil ou Terre
- Marqueurs des solstices et équinoxes sur l'orbite
- Inclinaison axiale visible de 23.5°

### 🔆 Vue Rayons du Soleil
- Visualisation des rayons solaires parallèles
- Indicateur du point subsolaire (où le soleil est au zénith)
- Affichage dynamique de la déclinaison solaire selon la saison
- Annotations pédagogiques (équateur, tropiques, cercles polaires)

### 🎮 Contrôles Interactifs
- **Zoom** : Molette de souris ou pincement sur mobile
- **Pan** : Clic-glisser sur les cartes 2D (mode Main)
- **Rotation** : Clic-glisser sur le globe 3D et la vue système solaire
- **Tracé** : Clic pour placer les points (mode Tracé)

### 📱 Interface Responsive
- Adapté aux téléphones, tablettes et desktop
- Menu latéral rétractable sur mobile
- Choix des vues à afficher/masquer (jusqu'à 5 vues)
- Layout adaptatif selon le nombre de vues actives

## 🛠️ Stack Technique

- **Framework** : React 19 + TypeScript + Vite
- **3D** : React Three Fiber + Drei
- **Projections** : D3-geo
- **State Management** : Zustand
- **Style** : Tailwind CSS + Lucide React

## 🚀 Installation

```bash
# Cloner le projet
git clone <repo-url>
cd u-earth

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

## 📦 Scripts Disponibles

| Script | Description |
|--------|-------------|
| `npm run dev` | Lance le serveur de développement |
| `npm run build` | Compile l'application pour la production |
| `npm run preview` | Prévisualise la version de production |
| `npm run lint` | Vérifie le code avec ESLint |

## 🎓 Objectif Pédagogique

Cette application permet de démontrer visuellement plusieurs preuves de la sphéricité terrestre :

1. **Le Terminateur** : La ligne jour/nuit forme toujours un cercle sur une sphère, mais apparaît déformée ("haricot") sur la projection azimutale.

2. **Les Lignes Droites** : Une ligne droite sur une carte plate correspond à une courbe complexe dans la réalité.

3. **Le Système Solaire** : L'inclinaison de l'axe terrestre explique les saisons et les variations de durée du jour.

4. **La Distorsion des Projections** : Aucune carte plate ne peut représenter fidèlement une sphère sans distorsion.

## 📁 Structure du Projet

```
src/
├── components/
│   ├── Globe3D.tsx        # Vue 3D interactive avec shader jour/nuit
│   ├── MapProjection.tsx  # Projections 2D (Mercator/Azimutale)
│   ├── SolarSystem.tsx    # Vue système solaire avec orbite elliptique
│   ├── SunRaysView.tsx    # Visualisation des rayons du soleil
│   └── ControlPanel.tsx   # Panneau de contrôle latéral
├── store/
│   └── geoStore.ts        # État global (Zustand) avec calcul des distances
├── hooks/
│   └── useWorldData.ts    # Chargement des données géographiques
├── utils/
│   └── solarCalculations.ts # Calculs astronomiques (haversine, terminateur, etc.)
└── data/
    └── worldData.ts       # URLs des données GeoJSON
```

## 📝 License

MIT

MIT
