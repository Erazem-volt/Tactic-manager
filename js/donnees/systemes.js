// =====================================================================
//  LES SYSTÈMES DE JEU DU FOOT À 8 (1 gardien + 7 joueurs)
//  Chaque système donne, pour les 8 places du simulateur :
//   abbr  : ce qui est écrit sur le joueur
//   nom   : le nom du poste
//   ligne : G (gardien), D (défense), M (milieu), A (attaque)
//   base  : le placement officiel sur TOUTE la longueur du terrain
//           (vu par l'équipe : son but en x = 0, elle attaque vers x = 100)
//  Les 8 "places" internes gardent les mêmes clés (GB, DG, DD, MD, MC, AG, AD, AT).
// =====================================================================
const SYSTEMES = {
  nous: {
    titre: "Notre système (2 – 1 – 1 – 3)",
    resume: "2 défenseurs latéraux, 1 milieu défensif qui redescend, 1 milieu, 2 ailiers et 1 attaquant.",
    places: {
      GB: { abbr: "GB", nom: "Gardien", ligne: "G", base: [5, 32] },
      DG: { abbr: "DG", nom: "Défenseur gauche", ligne: "D", base: [24, 10] },
      DD: { abbr: "DD", nom: "Défenseur droit", ligne: "D", base: [24, 54] },
      MD: { abbr: "MD", nom: "Milieu défensif", ligne: "M", base: [36, 32] },
      MC: { abbr: "MC", nom: "Milieu", ligne: "M", base: [52, 32] },
      AG: { abbr: "AG", nom: "Ailier gauche", ligne: "A", base: [68, 8] },
      AD: { abbr: "AD", nom: "Ailier droit", ligne: "A", base: [68, 56] },
      AT: { abbr: "AT", nom: "Attaquant", ligne: "A", base: [80, 32] }
    }
  },
  "2-3-2": {
    titre: "2 – 3 – 2 (équilibré)",
    resume: "2 défenseurs, 3 milieux et 2 attaquants : le système le plus équilibré, solide derrière avec des options pour contre-attaquer vite.",
    places: {
      GB: { abbr: "GB", nom: "Gardien", ligne: "G", base: [5, 32] },
      DG: { abbr: "DG", nom: "Défenseur gauche", ligne: "D", base: [24, 18] },
      DD: { abbr: "DD", nom: "Défenseur droit", ligne: "D", base: [24, 46] },
      MD: { abbr: "MG", nom: "Milieu gauche", ligne: "M", base: [48, 9] },
      MC: { abbr: "MC", nom: "Milieu central", ligne: "M", base: [45, 32] },
      AG: { abbr: "MDr", nom: "Milieu droit", ligne: "M", base: [48, 55] },
      AD: { abbr: "AtG", nom: "Attaquant gauche", ligne: "A", base: [74, 22] },
      AT: { abbr: "AtD", nom: "Attaquant droit", ligne: "A", base: [74, 42] }
    }
  },
  "2-4-1": {
    titre: "2 – 4 – 1 (contrôle du milieu)",
    resume: "2 défenseurs, 4 milieux et 1 attaquant : on veut garder le ballon et créer des occasions par des passes précises et des combinaisons.",
    places: {
      GB: { abbr: "GB", nom: "Gardien", ligne: "G", base: [5, 32] },
      DG: { abbr: "DG", nom: "Défenseur gauche", ligne: "D", base: [24, 18] },
      DD: { abbr: "DD", nom: "Défenseur droit", ligne: "D", base: [24, 46] },
      MD: { abbr: "MDf", nom: "Milieu défensif", ligne: "M", base: [40, 32] },
      MC: { abbr: "MO", nom: "Milieu offensif", ligne: "M", base: [58, 32] },
      AG: { abbr: "MG", nom: "Milieu gauche", ligne: "M", base: [50, 8] },
      AD: { abbr: "MDr", nom: "Milieu droit", ligne: "M", base: [50, 56] },
      AT: { abbr: "AT", nom: "Attaquant", ligne: "A", base: [78, 32] }
    }
  },
  "3-2-2": {
    titre: "3 – 2 – 2 (pressing offensif)",
    resume: "3 défenseurs, 2 milieux et 2 attaquants : pression haute dès la perte du ballon pour le récupérer vite et attaquer rapidement.",
    places: {
      GB: { abbr: "GB", nom: "Gardien", ligne: "G", base: [5, 32] },
      DG: { abbr: "DG", nom: "Défenseur gauche", ligne: "D", base: [24, 10] },
      MD: { abbr: "DC", nom: "Défenseur central", ligne: "D", base: [22, 32] },
      DD: { abbr: "DD", nom: "Défenseur droit", ligne: "D", base: [24, 54] },
      MC: { abbr: "MCG", nom: "Milieu gauche", ligne: "M", base: [46, 22] },
      AG: { abbr: "MCD", nom: "Milieu droit", ligne: "M", base: [46, 42] },
      AD: { abbr: "AtG", nom: "Attaquant gauche", ligne: "A", base: [72, 22] },
      AT: { abbr: "AtD", nom: "Attaquant droit", ligne: "A", base: [72, 42] }
    }
  },
  "3-3-1": {
    titre: "3 – 3 – 1 (occupation du terrain)",
    resume: "3 défenseurs, 3 milieux et 1 attaquant : un bloc défensif équilibré qui occupe bien la largeur et la profondeur.",
    places: {
      GB: { abbr: "GB", nom: "Gardien", ligne: "G", base: [5, 32] },
      DG: { abbr: "DG", nom: "Défenseur gauche", ligne: "D", base: [24, 10] },
      MD: { abbr: "DC", nom: "Défenseur central", ligne: "D", base: [22, 32] },
      DD: { abbr: "DD", nom: "Défenseur droit", ligne: "D", base: [24, 54] },
      AG: { abbr: "MG", nom: "Milieu gauche", ligne: "M", base: [50, 8] },
      MC: { abbr: "MC", nom: "Milieu central", ligne: "M", base: [46, 32] },
      AD: { abbr: "MDr", nom: "Milieu droit", ligne: "M", base: [50, 56] },
      AT: { abbr: "AT", nom: "Attaquant", ligne: "A", base: [76, 32] }
    }
  }
};

// Ce qui est écrit sur chaque joueur bleu (change avec le système choisi)
const ABBR = { GB: "GB", DG: "DG", DD: "DD", MD: "MD", MC: "MC", AG: "AG", AD: "AD", AT: "AT" };

function systemeNous() { return document.getElementById("sel-systeme").value; }
function systemeEux() { return document.getElementById("sel-systeme-adv").value; }

// Conseils par ligne (pour les systèmes autres que le nôtre)
const CONSEIL_LIGNE = {
  G: { att: "Reste en soutien derrière tes défenseurs.", def: "Place-toi selon le ballon et parle fort à tes défenseurs." },
  D: { att: "Écarte-toi et reste disponible pour une passe en retrait sûre.", def: "Reste aligné avec les autres défenseurs et glisse du côté du ballon." },
  M: { att: "Propose-toi entre les adversaires, face au jeu.", def: "Glisse vers le ballon et ferme le milieu du terrain." },
  A: { att: "Reste haut au niveau du dernier défenseur (attention au hors-jeu), prêt à attaquer le but.", def: "Ferme la passe en arrière et pousse le jeu adverse vers un côté." }
};

function rolesGeneriques(sysId) {
  const r = {};
  for (const k in SYSTEMES[sysId].places) r[k] = CONSEIL_LIGNE[SYSTEMES[sysId].places[k].ligne].att;
  return r;
}

// Rôle (clé interne) de chaque adversaire e0..e7, vu depuis SON côté du terrain
function baseAdv(i) { return SYSTEMES[systemeEux()].places[ROLE_ADV[i]].base; }

// --- Zones "génériques" d'un système : on part du placement officiel et on le décale avec le ballon ---
function zoneAttaqueSysteme(sysId, cle, B) {
  const pl = SYSTEMES[sysId].places[cle], [bx, by] = B, dy = by - 32;
  if (pl.ligne === "G") return [borner(4 + (bx - 15) * 0.22, 4, 18), 32 + dy * 0.2];
  return [borner(pl.base[0] + (bx - 50) * 0.55, 8, 86), borner(pl.base[1] + dy * 0.25, 3, 61)];
}
function zoneDefenseSysteme(sysId, cle, B) {
  const pl = SYSTEMES[sysId].places[cle], [bx, by] = B, dy = by - 32;
  if (pl.ligne === "G") return [borner(3 + bx * 0.1, 3, 12), 32 + dy * 0.25];
  const decalage = { 1: -6, 2: 0, 3: 5 }[document.getElementById("sel-pressing").value];
  return [borner(8 + pl.base[0] * 0.55 + (bx - 50) * 0.45 + decalage, 6, 62), borner(32 + (pl.base[1] - 32) * 0.8 + dy * 0.45, 3, 61)];
}

// --- Placements de départ des situations "libres" (7 à 10), calculés d'après les systèmes ---
// facteur < 1 : on "resserre" le placement officiel dans sa propre moitié
function placementBleu(facteur, xMax) {
  const n = {};
  const pl = SYSTEMES[systemeNous()].places;
  for (const k in pl) n[k] = [Math.min(4 + (pl[k].base[0] - 4) * facteur, xMax), pl[k].base[1]];
  return n;
}
function placementRouge(facteur, xMinReel) {
  return ROLE_ADV.map((cle, i) => {
    const b = baseAdv(i);
    const x = 4 + (b[0] - 4) * facteur;
    return [Math.max(100 - x, xMinReel), 64 - b[1]];
  });
}
// Joueur le plus avancé et central = celui qui engage
function engageur(n) {
  return Object.keys(n).filter(k => k !== "GB").sort((a, b) => (n[b][0] - Math.abs(n[b][1] - 32) * 0.5) - (n[a][0] - Math.abs(n[a][1] - 32) * 0.5))[0];
}

// Écarte les joueurs d'une même équipe trop collés (ex. deux joueurs poussés au bord du rond)
function ecarter(points) {
  for (let it = 0; it < 6; it++) {
    for (let i = 0; i < points.length; i++) for (let j = i + 1; j < points.length; j++) {
      if (distance(points[i], points[j]) < 5) points[j] = [points[j][0] - 2, points[j][1] + (points[j][1] >= 32 ? 5 : -5)];
    }
  }
  return points;
}
// Même chose pour les bleus (n = { GB: [x, y], ... }) ; "fixe" = joueur qui ne bouge pas (l'engageur)
function ecarterBleus(n, fixe) {
  const cles = Object.keys(n).filter(k => k !== fixe);
  const avecFixe = fixe ? [n[fixe], ...cles.map(k => n[k])] : cles.map(k => n[k]);
  const pts = ecarter(avecFixe);
  const decalage = fixe ? 1 : 0;
  cles.forEach((k, i) => { n[k] = pts[i + decalage]; });
  return n;
}

function genererSituationsLibres() {
  const nousId = systemeNous();
  const roles = nousId === "nous" ? null : rolesGeneriques(nousId);
  const trouver = (debut) => SITUATIONS.find(s => s.titre.startsWith(debut));

  // 7. Terrain libre
  const libre = trouver("Terrain libre");
  libre.etapes[0].n = placementBleu(0.72, 60);
  libre.etapes[0].e = placementRouge(0.72, 40);
  libre.etapes[0].b = "DD";
  if (!libre.rolesOrig) libre.rolesOrig = libre.roles;
  libre.roles = roles || libre.rolesOrig;

  // 8. Dégagement du gardien : nos défenseurs dans la zone protégée, les rouges derrière la ligne des 13 m
  const deg = trouver("Dégagement");
  deg.etapes[0].n = placementBleu(0.68, 60);
  ["DG", "DD"].forEach(k => { if (SYSTEMES[nousId].places[k].ligne === "D") deg.etapes[0].n[k][0] = Math.min(deg.etapes[0].n[k][0], 16); });
  deg.etapes[0].e = placementRouge(0.9, LIGNE_RELANCE + 2);
  if (!deg.rolesOrig) deg.rolesOrig = deg.roles;
  deg.roles = roles || deg.rolesOrig;

  // Pas de rouge collé sur un bleu au départ
  [libre, deg].forEach((s) => {
    const E = s.etapes[0];
    for (let it = 0; it < 8; it++) {
      E.e = E.e.map((pt, i) => {
        if (i === 0) return pt;
        const proches = [...Object.values(E.n), ...E.e.filter((_, j) => j !== i)].filter(q => distance(q, pt) < 4.5);
        return proches.length ? [pt[0] + 3, borner(pt[1] + (pt[1] >= 32 ? -4 : 4), 3, 61)] : pt;
      });
    }
    appliquerRegles(E);
  });

  // 9. On engage : chacun dans sa moitié, adversaires à 6 m (hors du rond)
  const eng = trouver("Balle au centre : on engage");
  const nE = placementBleu(0.6, 47);
  const k1 = engageur(nE);
  nE[k1] = [49.5, 32];
  eng.etapes[0].n = ecarterBleus(nE, k1);
  eng.etapes[0].b = k1;
  eng.etapes[0].e = placementRouge(0.6, 50.5).map(horsDuRond).map(p => [Math.max(p[0], 50.5), p[1]]);
  if (!eng.rolesOrig) eng.rolesOrig = eng.roles;
  eng.roles = roles || eng.rolesOrig;

  // 10. L'adversaire engage
  const engE = trouver("Balle au centre : l'adversaire");
  const nB = placementBleu(0.6, 47);
  for (const k in nB) { nB[k] = horsDuRond(nB[k]); nB[k][0] = Math.min(nB[k][0], 49.5); }
  engE.etapes[0].n = ecarterBleus(nB, null);
  for (const k in engE.etapes[0].n) { const q = horsDuRond(engE.etapes[0].n[k]); engE.etapes[0].n[k] = [Math.min(q[0], 49.5), q[1]]; }
  const eR = placementRouge(0.6, 50.5);
  const iEng = ROLE_ADV.indexOf("AT");
  eR.forEach((p, i) => { if (i !== iEng) { eR[i] = horsDuRond(p); eR[i][0] = Math.max(eR[i][0], 50.5); } });
  eR[iEng] = [50.5, 32];
  const autres = ecarter([eR[iEng], ...eR.filter((_, i) => i !== iEng)]).slice(1);
  let a = 0;
  engE.etapes[0].e = eR.map((p, i) => i === iEng ? p : autres[a++]);
  engE.etapes[0].b = "e" + iEng;
  if (!engE.rolesOrig) engE.rolesOrig = engE.roles;
  engE.roles = roles || engE.rolesOrig;

  // 11. Placement officiel des deux systèmes
  const off = trouver("Placement officiel");
  const sN = SYSTEMES[nousId], sE = SYSTEMES[systemeEux()];
  const lignes = (s) => {
    const c = { D: 0, M: 0, A: 0 };
    Object.values(s.places).forEach(p => { if (c[p.ligne] !== undefined) c[p.ligne]++; });
    return `${c.D} défenseur${c.D > 1 ? "s" : ""}, ${c.M} milieu${c.M > 1 ? "x" : ""}, ${c.A} attaquant${c.A > 1 ? "s" : ""}`;
  };
  const nOff = {}; for (const k in sN.places) nOff[k] = [...sN.places[k].base];
  off.etapes = [
    { txt: `Notre placement officiel : ${sN.titre}. ${sN.resume} (${lignes(sN)}).`, b: "GB", vue: "nous",
      n: nOff, e: placementRouge(1, 0) },
    { txt: `Placement officiel de l'adversaire : ${sE.titre}. ${sE.resume} (${lignes(sE)}).`, b: "e0", vue: "eux",
      n: nOff, e: placementRouge(1, 0) },
    { txt: `Face à face : chaque équipe dans sa moitié, avant le coup d'envoi. ${sN.titre} (bleu) contre ${sE.titre} (rouge).`, b: "GB", vue: "les2",
      n: placementBleu(0.6, 47), e: placementRouge(0.6, 50.5).map(horsDuRond).map(p => [Math.max(p[0], 50.5), p[1]]) }
  ];
  off.roles = nousId === "nous" ? SITUATIONS[0].roles : rolesGeneriques(nousId);
}

// Changer de système : noms et lettres des joueurs, situations recalculées
function appliquerSysteme() {
  const sys = SYSTEMES[systemeNous()];
  for (const k in sys.places) { POSTES[k] = sys.places[k].nom; ABBR[k] = sys.places[k].abbr; }
  genererSituationsLibres();
  // boutons des postes
  document.querySelectorAll("#postes button").forEach(b => { b.innerHTML = `<b>${ABBR[b.dataset.poste]}</b>${POSTES[b.dataset.poste]}`; });
  // liste « Ballon à »
  document.querySelectorAll("#sel-ballon option").forEach(o => { if (o.value) o.textContent = POSTES[o.value]; });
  // les situations 1 à 6 sont écrites pour NOTRE système
  const ecrites = systemeNous() === "nous";
  document.querySelectorAll("#phases button").forEach((b, i) => {
    const sitEcrite = SITUATIONS[i].ecrite;
    b.disabled = sitEcrite && !ecrites;
    b.title = b.disabled ? "Situation écrite pour notre système : choisis « Notre système » pour la voir" : "";
  });
}
