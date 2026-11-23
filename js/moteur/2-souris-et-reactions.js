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
