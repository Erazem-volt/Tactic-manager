// =====================================================================
//  DÉPLACER LES JOUEURS À LA SOURIS (ou au doigt)
// =====================================================================
function arreterSurEtape() {
  annulerAuto();
  enLecture = false;
  p = Math.round(p);
  document.getElementById("btn-jouer").textContent = p >= nbSegments() ? "↺ Rejouer" : "▶ Jouer";
}

// Convertit la position de la souris en coordonnées du terrain
function pointTerrain(ev) {
  const pt = svg.createSVGPoint();
  pt.x = ev.clientX; pt.y = ev.clientY;
  const r = pt.matrixTransform(svg.getScreenCTM().inverse());
  return [Math.max(0, Math.min(100, r.x)), Math.max(0, Math.min(64, r.y))];
}

function commencerGlisser(ev, type, id) {
  ev.preventDefault();
  arreterSurEtape();
  segAffiche = -1;
  dessiner();
  glisser = { type, id, depart: pointTerrain(ev), bouge: false };
}

function deplacerGlisser(ev) {
  if (!glisser) return;
  const [x, y] = pointTerrain(ev);
  if (Math.hypot(x - glisser.depart[0], y - glisser.depart[1]) > 0.8) glisser.bouge = true;
  if (!glisser.bouge) return;
  const etape = etapes()[p];
  if (glisser.type === "nous") etape.n[glisser.id] = [x, y];
  else {
    // Adversaire déplacé à la main : seul LUI bouge (il respecte quand même la zone protégée / le rond)
    const copie = JSON.parse(JSON.stringify(etape));
    copie.e[glisser.id] = [x, y];
    appliquerRegles(copie);
    etape.e[glisser.id] = copie.e[glisser.id];
  }
  segAffiche = -1;   // pour recalculer les flèches
  dessiner();
  // Les adversaires réagissent en direct (sauf celui que je tiens dans la main)
  // Les adversaires réagissent seulement quand je déplace un de MES joueurs.
  // Si je déplace un adversaire, les autres ne bougent pas : on travaille le placement.
  if (glisser.type === "nous") reagirRouges(null);
  else arreterReaction();
}

// =====================================================================
//  RÉACTION DES ADVERSAIRES PENDANT QUE JE DÉPLACE UN JOUEUR
//  On calcule où chaque adversaire devrait aller, puis on les fait glisser
//  doucement vers cette place (15 % du chemin à chaque image).
// =====================================================================
let ciblesRouges = null;
let animRouges = null;

function reagirRouges(sauf) {
  if (!document.getElementById("chk-reaction").checked) return;
  const etape = etapes()[p];
  if (!etape || !etape.b || etape.b === "*" || etape.vue || !Number.isInteger(p)) return;
  const copie = JSON.parse(JSON.stringify(etape));
  replacer(copie);                                   // seuls les rouges bougent dans replacer
  ciblesRouges = copie.e.map((pos, i) => ("e" + i === sauf ? null : pos));
  if (!animRouges) animRouges = requestAnimationFrame(glisserRouges);
}

function glisserRouges() {
  animRouges = null;
  const etape = etapes()[p];
  if (!ciblesRouges || !etape || enLecture || !Number.isInteger(p)) return;
  let encore = false;
  ciblesRouges.forEach((c, i) => {
    if (!c) return;
    const actuel = etape.e[i];
    const dx = c[0] - actuel[0], dy = c[1] - actuel[1];
    if (Math.hypot(dx, dy) > 0.1) {
      const g = pressing().glisse;
      etape.e[i] = [actuel[0] + dx * g, actuel[1] + dy * g];
      encore = true;
    }
  });
  segAffiche = -1;
  dessiner();
  if (encore) animRouges = requestAnimationFrame(glisserRouges);
}

function arreterReaction() {
  if (animRouges) cancelAnimationFrame(animRouges);
  animRouges = null;
  ciblesRouges = null;
}

// Double-clic (ou double-tape au doigt) sur un joueur = action
let dernierClic = null;
function finirGlisser() {
  if (!glisser) return;
  if (!glisser.bouge) {
    const cle = glisser.type === "nous" ? glisser.id : "e" + glisser.id;
    const maintenant = performance.now();
    if (dernierClic && dernierClic.cle === cle && maintenant - dernierClic.t < 450) {
      dernierClic = null;
      glisser = null;
      try { window.getSelection().removeAllRanges(); } catch (e) {}
      action(cle);
      return;
    }
    dernierClic = { cle, t: maintenant };
  }
  glisser = null;
}

// =====================================================================
//  ZOOM SUR LE TERRAIN (deux doigts, molette de la souris, boutons + / −)
//  On ne zoome pas toute la page : on change le « viewBox » du SVG.
//  Le viewBox, c'est le rectangle du terrain qu'on regarde : plus il est
//  petit, plus on voit le terrain en gros. Terrain entier = zoom x1.
//  (pointTerrain() tient déjà compte du viewBox : on peut toujours
//  déplacer les joueurs quand le terrain est zoomé.)
// =====================================================================
const VUE_ENTIERE = { x: -4, y: -4, l: 108, h: 72 };   // = viewBox="-4 -4 108 72" dans index.html
const ZOOM_MAX = 3;
let vue = { ...VUE_ENTIERE };   // rectangle du terrain affiché en ce moment (l = largeur, h = hauteur)
const doigts = new Map();       // doigts posés sur le terrain : numéro du doigt -> [x, y] à l'écran
let pincement = null;           // infos du geste à deux doigts en cours (null = pas de geste)

function zoomActuel() { return VUE_ENTIERE.l / vue.l; }

// Position à l'écran -> fraction de la largeur / hauteur du terrain (0 = bord gauche/haut, 1 = bord droit/bas)
function fractionEcran(clientX, clientY) {
  const r = svg.getBoundingClientRect();
  return [(clientX - r.left) / r.width, (clientY - r.top) / r.height];
}

// Fraction de l'écran -> point du terrain (dans la vue actuelle)
function pointVue(f) { return [vue.x + f[0] * vue.l, vue.y + f[1] * vue.h]; }

// Zoome à la valeur z, en gardant le point du terrain « pt » sous la position « f » de l'écran.
// C'est ce qui fait que le zoom est centré sur les doigts ou sur la souris.
function regarder(z, pt, f) {
  z = Math.max(1, Math.min(ZOOM_MAX, z));          // zoom entre x1 et x3
  const l = VUE_ENTIERE.l / z, h = VUE_ENTIERE.h / z;
  let x = pt[0] - f[0] * l, y = pt[1] - f[1] * h;
  // On empêche la vue de sortir du terrain
  x = Math.max(VUE_ENTIERE.x, Math.min(VUE_ENTIERE.x + VUE_ENTIERE.l - l, x));
  y = Math.max(VUE_ENTIERE.y, Math.min(VUE_ENTIERE.y + VUE_ENTIERE.h - h, y));
  vue = { x, y, l, h };
  afficherVue();
}

// Écrit la vue dans le SVG et grise les boutons qui ne servent à rien (+ au max, − au minimum)
function afficherVue() {
  svg.setAttribute("viewBox", `${vue.x} ${vue.y} ${vue.l} ${vue.h}`);
  const z = zoomActuel();
  document.getElementById("btn-zoom-plus").disabled = z >= ZOOM_MAX - 0.001;
  document.getElementById("btn-zoom-moins").disabled = z <= 1.001;
  document.getElementById("btn-zoom-tout").disabled = z <= 1.001;
}

// Retour au terrain entier (au changement de situation, de système, ou bouton « recentrer »)
function remettreZoom() {
  vue = { ...VUE_ENTIERE };
  pincement = null;
  afficherVue();
}

// Boutons + et − : on zoome sur le milieu de ce qu'on voit
function zoomBouton(facteur) {
  const milieu = [0.5, 0.5];
  regarder(zoomActuel() * facteur, pointVue(milieu), milieu);
}

// ---------- Deux doigts ----------
// Les deux premiers doigts posés : écart entre eux et position de leur milieu
function deuxDoigts() {
  const [a, b] = [...doigts.values()];
  return { ecart: Math.hypot(a[0] - b[0], a[1] - b[1]) || 1,
           milieu: fractionEcran((a[0] + b[0]) / 2, (a[1] + b[1]) / 2) };
}

function commencerPincement() {
  // Un 2e doigt se pose : on lâche le joueur qu'on déplaçait, on passe en mode zoom
  glisser = null;
  dernierClic = null;   // pas de double-tape (passe) par erreur
  const d = deuxDoigts();
  // On retient le point du terrain qui est entre les deux doigts au départ
  pincement = { ecart: d.ecart, zoom: zoomActuel(), point: pointVue(d.milieu) };
}

function doigtPose(ev) {
  if (ev.pointerType !== "touch") return;   // seulement les doigts (pas la souris)
  doigts.set(ev.pointerId, [ev.clientX, ev.clientY]);
  if (doigts.size >= 2) commencerPincement();
}

function doigtBouge(ev) {
  if (!doigts.has(ev.pointerId)) return;
  doigts.set(ev.pointerId, [ev.clientX, ev.clientY]);
  if (!pincement || doigts.size < 2) return;
  const d = deuxDoigts();
  // Écarter les doigts = zoomer, pincer = dézoomer.
  // Le point de départ reste sous les doigts : en glissant à deux doigts, on se déplace.
  regarder(pincement.zoom * d.ecart / pincement.ecart, pincement.point, d.milieu);
}

function doigtLeve(ev) {
  if (!doigts.delete(ev.pointerId)) return;
  if (doigts.size >= 2) commencerPincement();   // il reste encore 2 doigts : on repart d'eux
  else pincement = null;                          // le doigt qui reste ne déplace pas de joueur
}

// ---------- Molette de la souris (ordinateur) ----------
function zoomMolette(ev) {
  const avant = zoomActuel();
  const z = Math.max(1, Math.min(ZOOM_MAX, avant * (ev.deltaY < 0 ? 1.15 : 1 / 1.15)));
  if (Math.abs(z - avant) < 0.001) return;   // déjà au bout : on laisse la page défiler normalement
  ev.preventDefault();                        // sinon la page défile en même temps
  const f = fractionEcran(ev.clientX, ev.clientY);
  regarder(z, pointVue(f), f);                // zoom centré sur la souris
}

// Branche tous les événements du zoom (appelée par demarrer() dans main.js)
function brancherZoom() {
  svg.addEventListener("pointerdown", doigtPose);
  window.addEventListener("pointermove", doigtBouge);
  window.addEventListener("pointerup", doigtLeve);
  window.addEventListener("pointercancel", doigtLeve);
  svg.addEventListener("wheel", zoomMolette, { passive: false });   // passive:false = on a le droit d'empêcher le défilement
  // Safari (iPhone) : empêche le zoom de toute la page quand on pince sur le terrain
  svg.addEventListener("gesturestart", (e) => e.preventDefault());
  document.getElementById("btn-zoom-plus").addEventListener("click", () => zoomBouton(1.5));
  document.getElementById("btn-zoom-moins").addEventListener("click", () => zoomBouton(1 / 1.5));
  document.getElementById("btn-zoom-tout").addEventListener("click", remettreZoom);
}
