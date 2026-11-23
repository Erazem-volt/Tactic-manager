// =====================================================================
//  TACTIC MANAGER – terrain, dessin et animation
//  Système : 1 gardien, 2 défenseurs latéraux, 1 milieu défensif
//  qui redescend, 1 milieu, 2 ailiers, 1 attaquant.
// =====================================================================

const POSTES = {
  GB: "Gardien", DG: "Défenseur gauche", DD: "Défenseur droit", MD: "Milieu défensif",
  MC: "Milieu", AG: "Ailier gauche", AD: "Ailier droit", AT: "Attaquant"
};

// ---------- Variables ----------
const SVG_NS = "http://www.w3.org/2000/svg";
const LIGNE_RELANCE = 20;   // ligne pointillée du dégagement = ligne des 13 m (bord de la surface)
const RAYON_ROND = 9.2;     // rond central : 6 m
const svg = document.getElementById("terrain");

let sit = 0;            // situation choisie
let monPoste = "MD";    // mon joueur
let p = 0;              // où on en est : 0 = étape 1, 1 = étape 2, ... (2.5 = entre étape 3 et 4)
let enLecture = false;
let debut = 0;
let el = {};
let segAffiche = -1, etapeAffichee = -1;
let courant = null;     // copie modifiable de la situation (on peut déplacer les joueurs)
let glisser = null;     // joueur en train d'être déplacé

const PART_MOUVEMENT = 0.7;   // 70 % du temps on bouge, 30 % on fait une pause sur l'étape

// ---------- Outils ----------
function creer(type, attributs, parent) {
  const e = document.createElementNS(SVG_NS, type);
  for (const nom in attributs) e.setAttribute(nom, attributs[nom]);
  parent.appendChild(e);
  return e;
}
function entre(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t]; }
function adoucir(t) { return t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2; }
function limiter(v) { return Math.max(0, Math.min(1, v)); }
function etapes() { return courant.etapes; }
function nbSegments() { return etapes().length - 1; }

// Position d'un joueur ("DD" ou "e4") à une étape donnée
function positionA(etape, qui) {
  if (qui === "*") return etape.bp || [50, 32];       // ballon sans porteur (au fond du filet)
  if (qui[0] === "e") return etape.e[Number(qui.slice(1))];
  return etape.n[qui];
}

// ---------- Terrain ----------
function dessinerTerrain() {
  for (let i = 0; i < 10; i += 2) creer("rect", { x: i * 10, y: 0, width: 10, height: 64, class: "bande" }, svg);
  creer("rect", { x: 0, y: 0, width: 100, height: 64, class: "ligne" }, svg);
  creer("line", { x1: 50, y1: 0, x2: 50, y2: 64, class: "ligne" }, svg);
  // Dimensions officielles du foot à 8 (1 unité ≈ 0,65 m, terrain de 65 m)
  creer("circle", { cx: 50, cy: 32, r: RAYON_ROND, class: "ligne" }, svg);          // adversaires à 6 m
  creer("rect", { x: 0, y: 12, width: 20, height: 40, class: "ligne" }, svg);        // surface 26 m × 13 m
  creer("rect", { x: 80, y: 12, width: 20, height: 40, class: "ligne" }, svg);
  creer("circle", { cx: 13.8, cy: 32, r: 0.45, class: "point-penalty" }, svg);       // penalty à 9 m
  creer("circle", { cx: 86.2, cy: 32, r: 0.45, class: "point-penalty" }, svg);
  creer("rect", { x: -2, y: 27.4, width: 2, height: 9.2, class: "ligne" }, svg);     // buts de 6 m
  creer("rect", { x: 100, y: 27.4, width: 2, height: 9.2, class: "ligne" }, svg);
  creer("text", { x: 50, y: 67.5, class: "sens" }, svg).textContent = "SENS DE NOTRE ATTAQUE  →";
  // Lignes de dégagement (zone protégée du gardien) : les adversaires restent derrière
  // tant que le gardien n'a pas joué le ballon
  el.zoneNous = creer("rect", { x: 0, y: 0, width: LIGNE_RELANCE, height: 64, class: "zone-protegee", style: "display:none" }, svg);
  el.zoneEux = creer("rect", { x: 100 - LIGNE_RELANCE, y: 0, width: LIGNE_RELANCE, height: 64, class: "zone-protegee", style: "display:none" }, svg);
  creer("line", { x1: LIGNE_RELANCE, y1: 0, x2: LIGNE_RELANCE, y2: 64, class: "ligne-relance" }, svg);
  creer("line", { x1: 100 - LIGNE_RELANCE, y1: 0, x2: 100 - LIGNE_RELANCE, y2: 64, class: "ligne-relance" }, svg);
}

// ---------- Construction de la situation ----------
function construire() {
  svg.innerHTML = "";
  dessinerTerrain();

  const defs = creer("defs", {}, svg);
  const m1 = creer("marker", { id: "pointe", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: "auto" }, defs);
  creer("path", { d: "M0,0 L10,5 L0,10 z", fill: "rgba(255,255,255,.7)" }, m1);
  const m2 = creer("marker", { id: "pointe-moi", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 3, markerHeight: 3, orient: "auto" }, defs);
  creer("path", { d: "M0,0 L10,5 L0,10 z", fill: "#2dd4bf" }, m2);
  const m3 = creer("marker", { id: "pointe-rouge", viewBox: "0 0 10 10", refX: 8, refY: 5, markerWidth: 4, markerHeight: 4, orient: "auto" }, defs);
  creer("path", { d: "M0,0 L10,5 L0,10 z", fill: "rgba(255,140,140,.8)" }, m3);

  const gFleches = creer("g", { id: "fleches" }, svg);
  const gCible = creer("g", {}, svg);
  el.analyse = creer("g", { id: "analyse-terrain" }, svg);
  const gEux = creer("g", { id: "adversaires" }, svg);
  const gNous = creer("g", {}, svg);
  const gAnalyse = el.analyse;
  el = { nous: {}, eux: [], fleches: {}, flechesEux: [], analyse: gAnalyse, zoneNous: el.zoneNous, zoneEux: el.zoneEux, gNousVue: gNous, gEuxVue: gEux };

  // Flèches (leurs coordonnées sont mises à jour à chaque étape)
  el.flecheBallon = creer("line", { class: "fleche-ballon" }, gFleches);
  for (let i = 0; i < 8; i++) {
    el.flechesEux.push(creer("line", { class: "fleche fleche-eux", "marker-end": "url(#pointe-rouge)" }, gEux));
  }
  for (const poste in POSTES) {
    const moi = poste === monPoste;
    el.fleches[poste] = creer("line", {
      class: moi ? "fleche moi" : "fleche", "marker-end": moi ? "url(#pointe-moi)" : "url(#pointe)"
    }, gFleches);
  }

  // Ta place
  el.cible = creer("circle", { r: 3.4, class: "cible" }, gCible);
  el.cibleTexte = creer("text", { class: "cible-texte" }, gCible);
  el.cibleTexte.textContent = "TA PLACE";

  // Adversaires
  for (let i = 0; i < 8; i++) {
    const g = creer("g", { class: "joueur eux" }, gEux);
    creer("circle", { r: 1.8 }, g);
    g.addEventListener("pointerdown", (ev) => commencerGlisser(ev, "eux", i));
    el.eux.push(g);
  }

  // Mon équipe (mon joueur en dernier pour être au-dessus)
  const ordre = Object.keys(POSTES).filter(x => x !== monPoste).concat(monPoste);
  for (const poste of ordre) {
    const g = creer("g", { class: "joueur nous" + (poste === monPoste ? " moi" : "") }, gNous);
    creer("circle", { r: poste === monPoste ? 2.7 : 2.3 }, g);
    creer("text", {}, g).textContent = ABBR[poste];
    g.addEventListener("pointerdown", (ev) => commencerGlisser(ev, "nous", poste));
    el.nous[poste] = g;
  }

  el.ballon = creer("circle", { r: 1, class: "ballon" }, svg);

  // Cases des étapes
  const zone = document.getElementById("etapes");
  zone.innerHTML = "";
  etapes().forEach((_, k) => {
    const b = document.createElement("button");
    b.textContent = k + 1;
    b.title = "Aller à l'étape " + (k + 1);
    b.addEventListener("click", () => allerEtape(k));
    zone.appendChild(b);
  });

  document.getElementById("phase-titre").textContent = courant.titre + (courant.etapes.some(e => e.but) ? `  —  Score ${score().nous} – ${score().eux}` : "");
  document.getElementById("phrase-cle").textContent = "💡 " + courant.cle;

  segAffiche = -1;
  etapeAffichee = -1;
  appliquerOptions();
  dessiner();
}

// ---------- Mise à jour des flèches pour un mouvement (étape s -> s+1) ----------
function mettreFleches(s) {
  const A = etapes()[s], B = etapes()[Math.min(s + 1, nbSegments())];
  for (const poste in POSTES) {
    const [x1, y1] = A.n[poste], [x2, y2] = B.n[poste];
    const f = el.fleches[poste];
    f.setAttribute("x1", x1); f.setAttribute("y1", y1);
    f.setAttribute("x2", x2); f.setAttribute("y2", y2);
    // pas de flèche si le joueur bouge très peu
    f.style.display = Math.hypot(x2 - x1, y2 - y1) < 2.5 ? "none" : "";
  }
  A.e.forEach((pa, i) => {
    const pb = B.e[i], f = el.flechesEux[i];
    f.setAttribute("x1", pa[0]); f.setAttribute("y1", pa[1]);
    f.setAttribute("x2", pb[0]); f.setAttribute("y2", pb[1]);
    f.style.display = Math.hypot(pb[0] - pa[0], pb[1] - pa[1]) < 4 ? "none" : "";
  });
  // Trajet du ballon
  const b1 = positionA(A, A.b), b2 = positionA(B, B.b);
  el.flecheBallon.setAttribute("x1", b1[0]); el.flecheBallon.setAttribute("y1", b1[1]);
  el.flecheBallon.setAttribute("x2", b2[0]); el.flecheBallon.setAttribute("y2", b2[1]);
  // Ta place = là où ton joueur doit arriver
  const [cx, cy] = B.n[monPoste];
  el.cible.setAttribute("cx", cx); el.cible.setAttribute("cy", cy);
  el.cibleTexte.setAttribute("x", cx); el.cibleTexte.setAttribute("y", cy - 4.2);
  const bouge = Math.hypot(cx - A.n[monPoste][0], cy - A.n[monPoste][1]) > 3;
  el.cible.style.display = el.cibleTexte.style.display = bouge ? "" : "none";
}

// ---------- Dessin de l'instant p ----------
function dessiner() {
  const N = nbSegments();
  p = Math.max(0, Math.min(N, p));
  const s = Math.max(0, Math.min(Math.floor(p), N - 1));   // mouvement en cours (étape s -> s+1)
  const u = N === 0 ? 0 : p - s;                            // avancement dans ce mouvement (0 à 1)
  const A = etapes()[s], B = etapes()[Math.min(s + 1, N)];

  if (s !== segAffiche) { mettreFleches(s); segAffiche = s; }

  const t = adoucir(limiter(u));
  for (const poste in POSTES) {
    const [x, y] = entre(A.n[poste], B.n[poste], t);
    el.nous[poste].setAttribute("transform", `translate(${x} ${y})`);
  }
  A.e.forEach((pa, i) => {
    const [x, y] = entre(pa, B.e[i], t);
    el.eux[i].setAttribute("transform", `translate(${x} ${y})`);
  });

  // Le ballon suit son porteur, puis part vers le receveur (un peu après le début du mouvement)
  const porteurAvant = entre(positionA(A, A.b), positionA(B, A.b), t);
  const porteurApres = entre(positionA(A, B.b), positionA(B, B.b), t);
  const tb = A.b === B.b ? 0 : adoucir(limiter((u - 0.25) / 0.6));
  const [bx, by] = entre(porteurAvant, porteurApres, tb);
  el.ballon.setAttribute("cx", bx + 1.2);
  el.ballon.setAttribute("cy", by + 1.6);

  // Étape affichée : celle vers laquelle on va
  const k = Math.ceil(p - 0.0001);
  if (k !== etapeAffichee) { etapeAffichee = k; afficherTextes(k); }

  mettreAJourBoutonTir();

  // Vues "placement officiel" : on montre une seule équipe (fondu entre les étapes)
  const vis = (et, eq) => !et.vue || et.vue === "les2" || et.vue === eq ? 1 : 0;
  el.gNousVue.style.opacity = vis(A, "nous") + (vis(B, "nous") - vis(A, "nous")) * t;
  el.gEuxVue.style.opacity = vis(A, "eux") + (vis(B, "eux") - vis(A, "eux")) * t;
  svg.classList.toggle("vue", !!(A.vue || B.vue));
  const br = document.getElementById("btn-rouge");
  if (br) br.disabled = !rougePeutJouer();

  // Zone protégée visible pendant un dégagement
  const regleZone = reglesActives(etapes()[Math.round(p)]) || {};
  el.zoneNous.style.display = regleZone.texte === "relance" ? "" : "none";
  el.zoneEux.style.display = regleZone.texte === "relance-eux" ? "" : "none";

  // Analyse des passes : seulement quand on est arrêté sur une étape
  const analyse = !enLecture && Number.isInteger(p);
  svg.classList.toggle("en-analyse", analyse);
  if (analyse) afficherAnalyse(etapes()[p]);
  else cacherAnalyse();
}

// ---------- Textes ----------
function consigne(etape, poste) {
  if (etape.libre) return consigneLibre(etape, poste);
  return (etape.f && etape.f[poste]) || SITUATIONS[sit].roles[poste];
}

function afficherTextes(k) {
  const etape = etapes()[k];
  const total = etapes().length;
  document.getElementById("badge-etape").textContent = `Étape ${k + 1}/${total}`;
  document.getElementById("recit").textContent = etape.txt;
  document.getElementById("info-etape").textContent = `Étape ${k + 1} sur ${total}`;

  document.getElementById("moi-titre").textContent = `Ton rôle – étape ${k + 1}`;
  document.getElementById("moi-poste").textContent = POSTES[monPoste];
  document.getElementById("moi-consigne").textContent = consigne(etape, monPoste);

  const liste = document.getElementById("liste-autres");
  liste.innerHTML = "";
  for (const poste in POSTES) {
    if (poste === monPoste) continue;
    const li = document.createElement("li");
    li.innerHTML = `<b>${POSTES[poste]}</b> : ${consigne(etape, poste)}`;
    li.addEventListener("click", () => choisirPoste(poste));
    liste.appendChild(li);
  }

  document.querySelectorAll("#etapes button").forEach((b, j) => {
    b.classList.toggle("actif", j === k);
    b.classList.toggle("faite", j < k);
  });
}

// ---------- Lecture ----------
function duree() { return Number(document.getElementById("sel-vitesse").value); }

// Temps écoulé -> position p (avec une pause sur chaque étape)
function tempsVersP(ms) {
  const D = duree();
  const s = Math.floor(ms / D);
  const local = (ms - s * D) / D;
  return s + Math.min(1, local / PART_MOUVEMENT);
}
function pVersTemps(pp) {
  const s = Math.floor(pp);
  return (s + (pp - s) * PART_MOUVEMENT) * duree();
}

function boucle(maintenant) {
  if (!enLecture) return;
  p = tempsVersP(maintenant - debut);
  if (p >= nbSegments()) { p = nbSegments(); dessiner(); pause(); return; }
  dessiner();
  requestAnimationFrame(boucle);
}
function jouer() {
  arreterReaction();
  annulerAuto();
  if (p >= nbSegments()) p = 0;
  debut = performance.now() - pVersTemps(p);
  enLecture = true;
  document.getElementById("btn-jouer").textContent = "⏸ Pause";
  requestAnimationFrame(boucle);
}
function pause() {
  enLecture = false;
  if (!courant) return;
  document.getElementById("btn-jouer").textContent = p >= nbSegments() ? "↺ Rejouer" : "▶ Jouer";
  if (el.ballon) dessiner();   // pour afficher l'analyse des passes
  planifierAuto();             // si l'adversaire a le ballon, il jouera tout seul
}

// Aller directement à une étape (avec une petite animation si c'est l'étape suivante)
function allerEtape(k) {
  arreterReaction();
  k = Math.max(0, Math.min(nbSegments(), k));
  pause();
  if (k === Math.floor(p) + 1 && Number.isInteger(p)) {
    // étape suivante : on anime juste ce mouvement
    const depart = p, t0 = performance.now(), D = duree() * PART_MOUVEMENT;
    enLecture = true;
    document.getElementById("btn-jouer").textContent = "⏸ Pause";
    (function anim(now) {
      if (!enLecture) return;
      p = depart + limiter((now - t0) / D);
      dessiner();
      if (p < k) requestAnimationFrame(anim); else { p = k; dessiner(); pause(); }
    })(t0);
  } else {
    p = k;
    dessiner();
    pause();
  }
}

// ---------- Choix ----------
function choisirPoste(poste) {
  monPoste = poste;
  document.querySelectorAll("#postes button").forEach(b => b.classList.toggle("actif", b.dataset.poste === poste));
  const garde = p;
  pause();
  construire();
  p = garde;
  dessiner();
}

// sansAnimation = true : on affiche juste l'étape 1, sans lancer la lecture (utilisé au démarrage)
function choisirSituation(i, sansAnimation) {
  arreterReaction();
  sit = (i + SITUATIONS.length) % SITUATIONS.length;
  // Dans le panneau « Situations », la carte en cours prend la couleur d'accent (classe "actif")
  document.querySelectorAll(".carte-situation").forEach(b => b.classList.toggle("actif", Number(b.dataset.index) === sit));
  // Le gros bouton au-dessus du terrain affiche le nom de la situation en cours
  document.getElementById("nom-situation").textContent = SITUATIONS[sit].titre;
  pause();
  p = 0;
  courant = JSON.parse(JSON.stringify(SITUATIONS[sit]));   // copie qu'on a le droit de modifier
  construire();
  if (nbSegments() > 0 && !sansAnimation) jouer(); else { dessiner(); planifierAuto(); }
}

function appliquerOptions() {
  document.getElementById("fleches").classList.toggle("cache", !document.getElementById("chk-fleches").checked);
  document.querySelectorAll(".fleche-eux").forEach(f => f.classList.toggle("cache", !document.getElementById("chk-fleches").checked));
  document.getElementById("adversaires").classList.toggle("cache", !document.getElementById("chk-adversaires").checked);
}
