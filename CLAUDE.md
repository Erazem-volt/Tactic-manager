# CLAUDE.md – Tactic Manager

## But du projet
**Tactic Manager** est un simulateur tactique de **football à 8**. Il sert à apprendre aux joueurs **U11** où se placer et comment se déplacer **sans ballon**, selon les phases de jeu (relance, dédoublement, changement de côté, perte de balle, couverture, contre-attaque, engagement, dégagement…).

## Pour qui j'écris
L'utilisateur est **débutant en JavaScript et en CSS**.
- Explique simplement, en français, ce que tu modifies et pourquoi (quel fichier, quelle fonction, quel effet à l'écran).
- **Commente le code en français**, avec des phrases courtes et concrètes (dans le style des commentaires déjà présents).
- Évite le jargon ; si un terme technique est nécessaire, explique-le en une phrase.
- Préfère des modifications petites et lisibles plutôt qu'une grosse réécriture.

## Technique
- **HTML, CSS et JavaScript simples** : pas de framework, pas de npm, pas de build, pas de modules (`import`/`export`).
- On lance l'appli en ouvrant `index.html` (ou avec Live Server dans VS Code).
- Les scripts sont chargés **dans cet ordre** en bas de `index.html`, et **partagent leurs variables globales** (chaque fichier utilise ce qui est défini dans les précédents). **Respecte cet ordre** et place chaque nouvelle fonction dans le bon fichier :
  1. `js/donnees/situations.js` – les situations de jeu (`SITUATIONS`), étape par étape
  2. `js/donnees/systemes.js` – les systèmes de jeu (`SYSTEMES`, `ABBR`), génération des situations 7 à 11
  3. `js/moteur/1-terrain-et-animation.js` – dessin du terrain (SVG), animation, textes ; constantes `POSTES`, `LIGNE_RELANCE`, `RAYON_ROND`, état global (`sit`, `monPoste`, `p`, `courant`…)
  4. `js/moteur/2-souris-et-reactions.js` – glisser les joueurs, réaction des rouges
  5. `js/moteur/3-analyse-des-passes.js` – calcul de la meilleure passe ; outils (`distance`, `borner`, `metres`, `ROLE_ADV`…)
  6. `js/moteur/4-placement-et-regles.js` – placement automatique, objet `PRESSING`, règles (`appliquerRegles`, `horsDuRond`…)
  7. `js/moteur/5-actions-tir-adversaire.js` – passes, tir au but, adversaire automatique
  8. `js/main.js` – démarrage : crée les boutons et branche les événements (`demarrer()`)
- Attention : comme tout est global, une fonction d'un fichier peut être appelée depuis un fichier **plus haut** dans la liste seulement si l'appel a lieu **après** le chargement complet (par exemple dans une fonction appelée par `demarrer()`). Ne pas créer deux variables globales avec le même nom.

## Repère du terrain
- `x` : de **0 (notre but)** à **100 (but adverse)**.
- `y` : de **0 (notre gauche)** à **64 (notre droite)**.
- **1 unité ≈ 0,65 m** (fonction `metres()`).
- Nos joueurs (bleus) : objet `n = { GB: [x, y], DG: …, DD, MD, MC, AG, AD, AT }`.
- Adversaires (rouges) : tableau `e = [[x, y], …]` de 8 joueurs, le premier (`e0`) est leur gardien. Leur rôle est donné par `ROLE_ADV`.
- Les 8 clés internes (GB, DG, DD, MD, MC, AG, AD, AT) restent les mêmes quel que soit le système ; seuls le nom et l'abréviation affichés changent.

## Règles de jeu déjà en place (à ne pas casser)
- **Jeu libre : les joueurs bleus ne bougent jamais tout seuls.** Seuls les rouges réagissent (après une passe ou quand on déplace un bleu). Les bleus ne bougent que si l'utilisateur les glisse.
- **Zone protégée au dégagement du gardien** : les adversaires restent derrière la ligne des 13 m (`LIGNE_RELANCE = 20`) tant que le gardien n'a pas joué.
- **Engagement** : adversaires à **6 m** (hors du rond central, `RAYON_ROND`), chaque équipe dans sa moitié.
- **Pressing adverse réglable de 1 à 3** (objet `PRESSING` dans `4-placement-et-regles.js`, menu « Force du pressing » dans les paramètres).

## Situations
- Les **situations 1 à 6** sont écrites à la main pour **« Notre système » (2-1-1-3)** (marquées `ecrite = true`). Elles sont désactivées quand un autre système est choisi.
- Les **situations 7 à 11** (terrain libre, dégagement, engagements, placement officiel) **se recalculent selon le système choisi**, dans `genererSituationsLibres()` (`systemes.js`).

## Style visuel
- Police **Inter**, en **gras** (poids 600 et plus).
- Couleur d'accent **turquoise** : variable `--accent` en haut de `css/style.css` (avec `--accent-fonce` et `--encre`). Utilise ces variables plutôt que des couleurs écrites en dur.
- **Pas de jaune.**
- **Pas d'émoji ballon** (⚽).

## Avant de terminer une modification
- Vérifie qu'il n'y a **aucune erreur dans la console du navigateur** (F12 → onglet Console) après avoir rechargé la page et testé la fonction modifiée.
- Vérifie que les situations 1 à 6 et 7 à 11 s'affichent toujours, et qu'un changement de système fonctionne.
