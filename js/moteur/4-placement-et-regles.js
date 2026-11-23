// =====================================================================
//  REPLACEMENT AUTOMATIQUE DES DEUX ÉQUIPES
// =====================================================================

// --- Équipe qui DÉFEND (positions dans son cadre : son but en x = 0) ---
// =====================================================================
//  FORCE DU PRESSING ADVERSE (choisie sous le terrain)
//   niveau 1 : léger – un seul joueur va au ballon, sans coller ; le bloc reste bas ; ils courent lentement
//   niveau 2 : moyen – un presseur, un 2e seulement près de la ligne de touche
//   niveau 3 : fort  – deux presseurs, bloc haut, ils courent vite
// =====================================================================
const PRESSING = {
  1: { distPresseur: 4.5, deuxPresseurs: "jamais",  recul: [18, 11, 9, 9, -2], vitesse: 0.30, glisse: 0.06 },
  2: { distPresseur: 3.2, deuxPresseurs: "touche",  recul: [14, 8, 6, 6, 2],   vitesse: 0.50, glisse: 0.10 },
  3: { distPresseur: 2.4, deuxPresseurs: "toujours", recul: [11, 6, 4, 3, 5],  vitesse: 0.75, glisse: 0.15 }
};
function pressing() { return PRESSING[document.getElementById("sel-pressing").value]; }

function zoneDefense(role, B) {
  const [bx, by] = B, dy = by - 32;
  const [rLigne, rMD, rMC, rAiliers, rAT] = pressing().recul;
  const ligne = borner(bx - rLigne, 9, 42);           // hauteur de la ligne de défense
  switch (role) {
    case "GB": return [borner(3 + bx * 0.1, 3, 12), 32 + dy * 0.25];
    case "DG": return [ligne, borner(22 + dy * 0.45, 8, 40)];
    case "DD": return [ligne, borner(42 + dy * 0.45, 24, 56)];
    case "MD": return [borner(bx - rMD, 14, 50), 32 + dy * 0.55];
    case "MC": return [borner(bx - rMC, 18, 52), 32 + dy * 0.55];
    case "AG": return [borner(bx - rAiliers, 20, 58), borner(14 + dy * 0.55, 4, 40)];
    case "AD": return [borner(bx - rAiliers, 20, 58), borner(50 + dy * 0.55, 24, 60)];
    case "AT": return [borner(bx + rAT, 28, 66), 32 + dy * 0.35];
  }
}

function placerDefense(etape, equipe, porteur) {
  const B = cadre(equipe, posDe(etape, porteur));
  const G = [0, 32];                               // notre but
  const defs = joueurs(etape).filter(j => j.equipe === equipe);
  const atts = joueurs(etape).filter(j => j.equipe !== equipe && j.cle !== porteur);
  const cibles = {}, tags = {};

  const sys = equipe === "eux" ? systemeEux() : systemeNous();
  defs.forEach(j => {
    cibles[j.cle] = sys === "nous" ? zoneDefense(j.role, B) : zoneDefenseSysteme(sys, j.role, B);
    tags[j.cle] = "zone";
  });

  // 1. Le plus proche du ballon PRESSE (entre le porteur et le but)
  const champ = defs.filter(j => j.role !== "GB")
    .sort((a, b) => distance(cadre(equipe, posDe(etape, a.cle)), B) - distance(cadre(equipe, posDe(etape, b.cle)), B));
  const versBut = unitaire([G[0] - B[0], G[1] - B[1]]);
  const dP = pressing().distPresseur;
  cibles[champ[0].cle] = [B[0] + versBut[0] * dP, B[1] + versBut[1] * dP];
  tags[champ[0].cle] = "presse";

  // 2. Ballon près de la ligne de touche : un 2e joueur presse et ferme l'intérieur
  const regle = pressing().deuxPresseurs;
  if (regle === "toujours" || (regle === "touche" && (B[1] < 14 || B[1] > 50))) {
    const interieur = [0, Math.sign(32 - B[1])];
    const dir = unitaire([versBut[0] + interieur[0], versBut[1] + interieur[1]]);
    cibles[champ[1].cle] = [B[0] + dir[0] * 3.2, B[1] + dir[1] * 3.2];
    tags[champ[1].cle] = "presse2";
  }

  // 3. Marquage : chaque attaquant dangereux est surveillé par le défenseur le plus proche de sa zone
  const libres = defs.filter(j => j.role !== "GB" && tags[j.cle] === "zone");
  atts.map(a => ({ ...a, p: cadre(equipe, posDe(etape, a.cle)) }))
    .sort((a, b) => a.p[0] - b.p[0])               // les plus proches de notre but d'abord
    .forEach((a) => {
      let meilleur = null, dMin = 12;
      libres.forEach((d) => {
        if (tags[d.cle] !== "zone") return;
        const dd = distance(cibles[d.cle], a.p);
        if (dd < dMin) { dMin = dd; meilleur = d; }
      });
      if (meilleur) {
        const cote = unitaire([G[0] - a.p[0], G[1] - a.p[1]]);
        const placeMarquage = [a.p[0] + cote[0] * 2.2, a.p[1] + cote[1] * 2.2];
        const z = cibles[meilleur.cle];
        cibles[meilleur.cle] = [z[0] * 0.3 + placeMarquage[0] * 0.7, z[1] * 0.3 + placeMarquage[1] * 0.7];
        tags[meilleur.cle] = "marque";
      }
    });

  // Un seul joueur colle le porteur (deux près de la ligne) : les autres gardent leurs distances
  defs.forEach((j) => {
    if (tags[j.cle] === "presse" || tags[j.cle] === "presse2" || j.role === "GB") return;
    const c = cibles[j.cle], d = distance(c, B);
    if (d < 7) {
      const v = d > 0.1 ? unitaire([c[0] - B[0], c[1] - B[1]]) : versBut;
      cibles[j.cle] = [B[0] + v[0] * 7, B[1] + v[1] * 7];
    }
  });

  defs.forEach(j => mettrePos(etape, j.cle, cadre(equipe, cibles[j.cle])));
  return tags;
}

// --- Équipe qui ATTAQUE (positions dans son cadre : elle attaque vers x = 100) ---
function zoneAttaque(role, B) {
  const [bx, by] = B, dy = by - 32;
  switch (role) {
    case "GB": return bx < 35 ? [borner(bx - 12, 3, 12), 32 + dy * 0.45] : [borner(4 + (bx - 15) * 0.22, 4, 18), 32 + dy * 0.2];
    case "DG": return [borner(bx - 16 - (by > 40 ? 6 : 0), 10, 62), by < 26 ? 6 : by < 38 ? 9 : 18];
    case "DD": return [borner(bx - 16 - (by < 24 ? 6 : 0), 10, 62), by > 38 ? 58 : by > 26 ? 55 : 46];
    case "MD": return bx < 22 ? [12, 32] : [borner(bx - 12, 14, 58), 32 + dy * 0.4];
    case "MC": return [borner(bx + 8, 34, 76), 32 + dy * 0.3 + (by < 32 ? 8 : -8)];
    case "AG": return (by > 40 && bx > 62) ? [borner(bx + 12, 0, 86), 24] : [borner(bx + 18, 46, 88), 6];
    case "AD": return (by < 24 && bx > 62) ? [borner(bx + 12, 0, 86), 40] : [borner(bx + 18, 46, 88), 58];
    case "AT": return [borner(bx + 24, 56, 86), 32 + dy * 0.25];
  }
}

function placerAttaque(etape, equipe, porteur) {
  const B = cadre(equipe, posDe(etape, porteur));
  const atts = joueurs(etape).filter(j => j.equipe === equipe && j.cle !== porteur);
  const defs = joueurs(etape).filter(j => j.equipe !== equipe)
    .map(j => ({ cle: j.cle, role: j.role, pos: cadre(equipe, posDe(etape, j.cle)) }));

  // Hors-jeu : on ne dépasse pas l'avant-dernier défenseur (sauf si on est derrière le ballon)
  const xsDef = defs.map(d => d.pos[0]).sort((a, b) => b - a);
  const limite = Math.max(xsDef[1] - 0.5, B[0]);

  // Le porteur est-il pressé ? Alors 2 coéquipiers viennent l'aider de près (soutien court)
  const pression = Math.min(...defs.map(d => distance(d.pos, B)));
  const versCentre = Math.sign(32 - B[1]) || 1;
  const soutiens = {};
  if (pression < 5) {
    soutiens.MD = [B[0] - 3, B[1] + versCentre * 11];                 // à l'intérieur, un peu derrière
    const proches = atts.filter(j => !["GB", "MD"].includes(j.role))
      .sort((a, b) => distance(cadre(equipe, posDe(etape, a.cle)), B) - distance(cadre(equipe, posDe(etape, b.cle)), B));
    if (proches[0]) {
      const large = B[1] < 14 || B[1] > 50;
      soutiens[proches[0].role] = large ? [B[0] + 11, B[1]] : [B[0] + 9, B[1] + versCentre * 6];   // devant, le long de la ligne
    }
    if (soutiens.MD && atts.every(j => j.role !== "MD")) delete soutiens.MD;
  }

  const places = [];
  atts.forEach((j) => {
    const sysA = equipe === "eux" ? systemeEux() : systemeNous();
    const zone = soutiens[j.role] ? [...soutiens[j.role]] : (sysA === "nous" ? zoneAttaque(j.role, B) : zoneAttaqueSysteme(sysA, j.role, B));
    zone[0] = j.role === "GB" ? zone[0] : Math.min(zone[0], limite);
    let choix = zone;
    if (j.role !== "GB") {
      // Démarquage : on cherche autour de sa zone l'endroit où la passe est la meilleure
      let meilleurScore = -Infinity;
      for (const r of [0, 4, 8, 12]) {
        for (let a = 0; a < (r === 0 ? 1 : 12); a++) {
          const ang = a * Math.PI / 6;
          const c = [borner(zone[0] + r * Math.cos(ang), 2, Math.min(98, limite)), borner(zone[1] + r * Math.sin(ang), 3, 61)];
          let s = evaluerPasse(B, c, defs, j.role, 0.12).score - 0.45 * distance(c, zone);
          places.forEach(pl => { const dd = distance(pl, c); if (dd < 7) s -= (7 - dd) * 3; });   // pas les uns sur les autres
          if (s > meilleurScore) { meilleurScore = s; choix = c; }
        }
      }
    }
    places.push(choix);
    mettrePos(etape, j.cle, cadre(equipe, choix));
  });
}

// --- On écarte les joueurs trop collés ---
function separer(etape, porteur) {
  const tous = joueurs(etape).map(j => j.cle);
  for (let iter = 0; iter < 4; iter++) {
    for (let i = 0; i < tous.length; i++) {
      for (let k = i + 1; k < tous.length; k++) {
        const a = posDe(etape, tous[i]), b = posDe(etape, tous[k]);
        const d = distance(a, b);
        if (d < 3 && d > 0.001) {
          const v = unitaire([b[0] - a[0], b[1] - a[1]]), m = (3 - d) / 2;
          const bougeI = tous[i] !== porteur && equipeDe(tous[i]) === "eux";
          const bougeK = tous[k] !== porteur && equipeDe(tous[k]) === "eux";
          if (bougeI) mettrePos(etape, tous[i], [a[0] - v[0] * m * (bougeK ? 1 : 2), a[1] - v[1] * m * (bougeK ? 1 : 2)]);
          if (bougeK) mettrePos(etape, tous[k], [b[0] + v[0] * m * (bougeI ? 1 : 2), b[1] + v[1] * m * (bougeI ? 1 : 2)]);
        }
      }
    }
  }
}

// =====================================================================
//  RÈGLES : DÉGAGEMENT DU GARDIEN ET ENGAGEMENT
//   - Dégagement (6 m) : tant que le gardien n'a pas joué, les adversaires
//     restent derrière la ligne pointillée (zone protégée).
//   - Engagement (balle au centre) : chacun dans sa moitié, et l'équipe
//     qui n'engage pas reste hors du rond central.
// =====================================================================
function reglesActives(etape) {
  if (!etape) return null;
  if (etape.relance && etape.b === "GB") return { rougesXmin: LIGNE_RELANCE + 0.5, texte: "relance" };
  if (etape.relance && etape.b === "e0") return { bleusXmax: 100 - LIGNE_RELANCE - 0.5, texte: "relance-eux" };
  if (etape.engagement === "nous") return { rougesXmin: 50.5, rondRouges: true, texte: "engagement" };
  if (etape.engagement === "eux") return { rougesXmin: 50.5, bleusXmax: 49.5, rondBleus: true, texte: "engagement-eux" };
  return null;
}

// Pousse un point hors du rond central (6 m)
function horsDuRond(pt) {
  const R = RAYON_ROND + 0.5;
  const d = distance(pt, [50, 32]);
  if (d >= R) return pt;
  const v = d > 0.1 ? unitaire([pt[0] - 50, pt[1] - 32]) : [1, 0];
  return [50 + v[0] * R, 32 + v[1] * R];
}

// Les adversaires respectent la règle (sauf celui qui a le ballon)
function appliquerRegles(etape) {
  const r = reglesActives(etape);
  if (!r || !r.rougesXmin) return;
  etape.e = etape.e.map((pos, i) => {
    if ("e" + i === etape.b) return pos;
    let pt = [Math.max(pos[0], r.rougesXmin), pos[1]];
    if (r.rondRouges) { pt = horsDuRond(pt); pt[0] = Math.max(pt[0], r.rougesXmin); }
    return pt;
  });
}

// Mes joueurs (bleus) qui ne respectent pas la règle -> on prévient (on ne les bouge pas)
function bleusHorsRegle(etape) {
  const r = reglesActives(etape);
  if (!r || !r.bleusXmax) return [];
  return Object.keys(POSTES).filter((k) => {
    if (k === etape.b) return false;
    const pos = etape.n[k];
    return pos[0] > r.bleusXmax || (r.rondBleus && distance(pos, [50, 32]) < RAYON_ROND);
  });
}

// Seuls les ADVERSAIRES (rouges) se replacent tout seuls.
// Les joueurs bleus ne bougent jamais automatiquement : c'est toi qui les déplaces.
function replacer(etape) {
  if (equipeDe(etape.b) === "nous") placerDefense(etape, "eux", etape.b);   // ils défendent
  else placerAttaque(etape, "eux", etape.b);                               // ils attaquent
  separer(etape, etape.b);
  appliquerRegles(etape);
}

// =====================================================================
//  CONSIGNES DYNAMIQUES (jeu libre)
// =====================================================================
function conseilAttaque(role, B) {
  switch (role) {
    case "GB": return "Reste en soutien derrière tes défenseurs.";
    case "DG": case "DD": return "Reste large pour écarter le jeu.";
    case "MD": return "Reste derrière le ballon : tu es la sécurité si on le perd.";
    case "MC": return "Propose-toi entre les adversaires, face au jeu.";
    case "AG": return (B[1] > 40 && B[0] > 62) ? "Ballon de l'autre côté : attaque le 2e poteau !" : "Reste large, prêt à partir dans la profondeur.";
    case "AD": return (B[1] < 24 && B[0] > 62) ? "Ballon de l'autre côté : attaque le 2e poteau !" : "Reste large, prêt à partir dans la profondeur.";
    case "AT": return "Reste au niveau du dernier défenseur (attention au hors-jeu), prêt à attaquer le but.";
  }
}
const CONSEIL_DEFENSE = {
  GB: "Place-toi selon le ballon et parle fort à tes défenseurs.",
  DG: "Reste aligné avec l'autre défenseur et glisse du côté du ballon.",
  DD: "Reste aligné avec l'autre défenseur et glisse du côté du ballon.",
  MD: "Protège le centre, devant tes défenseurs.",
  MC: "Glisse vers le ballon et ferme le milieu du terrain.",
  AG: "Reviens aider et ferme ton côté.",
  AD: "Reviens aider et ferme ton côté.",
  AT: "Ferme la passe en arrière et pousse le jeu adverse vers un côté."
};

function consigneLibre(etape, poste) {
  if (etape.b === "*") return etape.but === "nous" ? "BUT ! Bravo ! On se replace pour l'engagement." : "But encaissé. Pas grave : on se replace et on repart.";
  if (equipeDe(etape.b) === "nous") {
    const B = etape.n[etape.b];
    if (poste === etape.b) {
      if (peutTirer(etape)) return "Tu es en position de tir : appuie sur « 🥅 Tirer », ou passe à un copain encore mieux placé !";
      return "Tu as le ballon ! Lève la tête : la ★ montre la meilleure passe. Double-clique sur le coéquipier pour lui passer.";
    }
    const o = analyserPasses(etape).options.find(x => x.cle === poste);
    let debut;
    if (o.coupeur) debut = "Un adversaire coupe ta ligne de passe : déplace-toi pour la libérer.";
    else if (o.espace < 4) debut = "Tu es trop marqué : démarque-toi pour recevoir.";
    else if (o.niveau === "bonne") debut = `Tu es une solution LIBRE (${metres(o.espace)} m d'espace) : montre-toi et appelle le ballon !`;
    else debut = "Tu es une solution possible, mais un adversaire n'est pas loin : bouge encore un peu.";
    return debut + " " + conseilAttaque(poste, B);
  }
  // L'adversaire a le ballon : le bleu le plus proche doit aller presser (c'est toi qui le déplaces)
  const B = posDe(etape, etape.b);
  const plusProche = Object.keys(POSTES).filter(r => r !== "GB")
    .sort((a, b) => distance(etape.n[a], B) - distance(etape.n[b], B))[0];
  const tag = poste === plusProche ? "presse" : null;
  if (tag === "presse") return "Tu es le plus proche : PRESSE le porteur, en te plaçant entre lui et notre but !";
  if (tag === "presse2") return "Aide ton coéquipier : pressez à deux et ferme la passe vers l'intérieur.";
  if (tag === "marque") return "Surveille l'adversaire près de toi : place-toi entre lui et notre but.";
  return CONSEIL_DEFENSE[poste];
}
