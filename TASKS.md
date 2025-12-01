# Liste des Tâches - U-Earth

## 1. Système Solaire
- [x] **1.1** Mettre la carte de la Terre sur la sphère → Ajouté équateur pour l'orientation (les continents seraient trop petits à voir)
- [x] **1.2** Vérifier que le mouvement de l'axe est cohérent → L'axe pointe TOUJOURS vers Polaris (c'est correct physiquement). Ajouté explication dans le panel. ici entre été et hiver l'axe n'a pas changer d'orientations
- [x] **1.3** Annotation "Orbite elliptique (exagérée)" → Ajoutée dans la légende en bas à droite

## 2. Vue 3D (Globe)
- [x] **2.1** Corriger le globe inversé → ✅ Longitude inversée dans latLonToCartesian (-lon)
- [x] **2.2** Remplir la mer en bleu foncé → ✅ Shader océan avec jour/nuit
- [ ] **2.3** Remplir les continents en vert → ⚠️ Complexe en 3D (triangulation sphérique), gardé les bordures épaisses pour l'instant
- [x] **2.4** il faut enlever le petit soleil qui se balade autour de la sphère 3D

## 3. Bug Temporel
- [x] **3.1** Corriger le bug du 25-26 octobre → ✅ Utilisation de UTC

## 4. Vue Terre Plate (Azimuthal) et Mercator
- [x] **4.1** Zoom sur la vue Azimuthal → ✅ Molette souris
- [x] **4.2** Déplacement (pan) sur la vue Azimuthal → ✅ Clic-glisser
- [x] **4.3** Zoom sur la vue Mercator → ✅ Molette souris
- [x] **4.4** Déplacement (pan) sur la vue Mercator → ✅ Clic-glisser

## 5. Outil de Trait
- [x] **5.1** Attribuer automatiquement une nouvelle couleur à chaque nouveau trait → ✅ Palette de 10 couleurs

## 6. Vue Rayons du Soleil
- [x] **6.1** Corriger le globe inversé → ✅ Longitude inversée dans la conversion de coordonnées

## 7. Animation
- [x] **7.1** Curseur de vitesse exponentiel → ✅ De 1h/s à 10 ans/s (échelle logarithmique)
- [x] **7.2** Animation sur Globe3D → ✅ Ajout AnimationController dans le Canvas
- [x] **7.3** Globe3D réagit aux curseurs manuels → ✅ Invalidate sur changement de dateTime/showSun

## 8. Page Terre Plate
- [x] **8.1** Navigation entre les deux modèles → ✅ React Router avec boutons dans le header
- [x] **8.2** Modèle 3D Terre Plate → ✅ Disque plat avec projection azimutale
- [x] **8.3** Firmament (dôme) → ✅ Dôme en wireframe avec étoiles
- [x] **8.4** Soleil qui tourne au-dessus → ✅ Orbite circulaire variable selon saisons
- [x] **8.5** Lune → ✅ Orbite opposée au soleil
- [x] **8.6** Mur de glace (Antarctique) → ✅ Torus autour du disque
- [x] **8.7** Distances annotées → ✅ ~5000 km altitude, ~40000 km diamètre
- [x] **8.8** Contrôles temps/animation → ✅ Panneau avec sliders heure/jour

---

## Corrections effectuées dans cette session

### solarCalculations.ts
- `latLonToCartesian`: longitude inversée (`-lon`) pour orientation correcte du globe
- `cartesianToLatLon`: longitude inversée pour cohérence

### Globe3D.tsx
- Suppression de LandMasses (triangulation sphérique trop complexe)
- CountryBorders avec lignes plus épaisses
- OceanSurface avec shader jour/nuit bleu
- Ajout AnimationController pour l'animation du temps

### SunRaysView.tsx
- Longitude inversée dans la conversion de coordonnées des continents

### SolarSystem.tsx
- Ajout d'explication sur l'axe terrestre dans le panel info
- Déplacement de l'annotation "orbite elliptique" dans la légende

### ControlPanel.tsx
- Curseur de vitesse exponentiel (0.1x à 10000x) avec échelle logarithmique

### geoStore.ts
- Formule advanceTime corrigée pour supporter les grandes vitesses

---

## Note sur le remplissage des continents (2.3)
Le remplissage des polygones sur une sphère 3D est techniquement complexe car :
1. Les polygones GeoJSON sont en 2D (lat/lon)
2. La triangulation sur une sphère n'est pas triviale
3. Les grands polygones (comme la Russie) traversent les discontinuités

Solutions possibles pour le futur :
- Utiliser une texture de la Terre (image)
- Utiliser une bibliothèque spécialisée (d3-geo-polygon)
- Pré-générer les triangles côté serveur
