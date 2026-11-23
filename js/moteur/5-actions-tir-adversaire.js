// =====================================================================
//  ACTION : double-clic sur un joueur
//   - coéquipier du porteur -> PASSE (elle peut être interceptée !)
//   - joueur de l'autre équipe -> tentative de RÉCUPÉRATION (s'il est proche)
// =====================================================================
function action(cible) {
  arreterReaction();
  arreterSurEtape();
  const k = p;
  const E = etapes()[k];
  const porteur = E.b;
  if (!porteur || porteur === "*" || E.vue || cible === porteur) return;

  const E2 = JSON.parse(JSON.stringify(E));
  delete E2.f;
  const numero = (courant.libre ? courant.etapes.length : k + 1);
  let txt;

  if (equipeDe(cible) === equipeDe(porteur)) {
    // ---- PASSE ----
    const o = analyserPasses(E).options.find(x => x.cle === cible);
    const nous = equipeDe(porteur) === "nous";
    const de = nous ? POSTES[porteur] : "L'adversaire";
    if (o.coupeur) {
      // Le coupeur intercepte : il va sur la ligne de passe
      E2.b = o.coupeur.cle;
      mettrePos(E2, o.coupeur.cle, cadre(equipeDe(porteur), o.coupeur.point));
      txt = nous
        ? `Passe de ${de} vers ${POSTES[cible]}… INTERCEPTÉE ! La ligne était coupée. On a perdu le ballon : déplace tes joueurs pour défendre (le plus proche presse).`
        : `L'adversaire tente une passe… INTERCEPTÉE par ${POSTES[o.coupeur.cle]} ! On récupère le ballon : déplace tes joueurs pour te démarquer.`;
    } else if (o.espace < 2.5) {
      E2.b = o.marqueur;
      txt = nous
        ? `Passe vers ${POSTES[cible]}, mais il était trop marqué : l'adversaire récupère le ballon !`
        : `L'adversaire passe à un joueur trop marqué : ${POSTES[o.marqueur]} récupère le ballon !`;
    } else {
      E2.b = cible;
      txt = nous
        ? `Passe de ${de} à ${POSTES[cible]}. Les adversaires se replacent. À toi de déplacer tes joueurs pour créer de nouvelles solutions.`
        : "L'adversaire fait une passe. Les adversaires bougent : déplace tes joueurs (le plus proche presse, les autres resserrent).";
    }
  } else {
    // ---- RÉCUPÉRATION ----
    if (distance(posDe(E, cible), posDe(E, porteur)) > 8) {
      document.getElementById("recit").textContent = "Trop loin du porteur pour récupérer le ballon ! Glisse d'abord ton joueur près de lui, puis double-clique.";
      return;
    }
    E2.b = cible;
    txt = equipeDe(cible) === "nous"
      ? `${POSTES[cible]} récupère le ballon ! On attaque : déplace tes joueurs pour te démarquer.`
      : "L'adversaire nous prend le ballon ! On se replace pour défendre.";
  }

  // Le receveur fait un contrôle orienté : s'il a de l'espace devant lui, il avance avec le ballon
  const eqB = equipeDe(E2.b);
  const pb = cadre(eqB, posDe(E2, E2.b));
  const adversaires = joueurs(E2).filter(j => j.equipe !== eqB).map(j => cadre(eqB, posDe(E2, j.cle)));
  for (const pas of (eqB === "eux" ? [10, 7, 4] : [])) {   // seulement pour l'adversaire : tes joueurs ne bougent pas tout seuls
    // loin du but : tout droit ; près du but : on rentre vers le but
    const dir = pb[0] < 62 ? [1, 0] : unitaire([96 - pb[0], 32 - pb[1]]);
    const essai = [Math.min(pb[0] + dir[0] * pas, 90), pb[1] + dir[1] * pas];
    if (Math.min(...adversaires.map(a => distance(a, essai))) > 6) {
      mettrePos(E2, E2.b, cadre(eqB, essai));
      txt += " Le porteur a de l'espace : il avance avec le ballon.";
      break;
    }
  }

  replacer(E2);

  // Pendant que le ballon voyage, les adversaires courent... mais moins vite que le ballon !
  // Chacun ne peut parcourir qu'une partie de la longueur de la passe (selon le niveau de pressing).
  const longueurPasse = distance(posDe(E, porteur), posDe(E2, E2.b));
  const course = Math.max(4, longueurPasse * pressing().vitesse);
  E2.e = E2.e.map((cible, i) => {
    if ("e" + i === E2.b) return cible;                 // le nouveau porteur rouge garde sa place
    const depart = E.e[i];
    const d = distance(depart, cible);
    if (d <= course) return cible;
    const f = course / d;
    return [depart[0] + (cible[0] - depart[0]) * f, depart[1] + (cible[1] - depart[1]) * f];
  });

  E2.txt = `Action ${numero} – ` + txt;
  E2.libre = true;
  delete E2.relance;       // le gardien a joué : la zone protégée n'existe plus
  delete E2.engagement;    // le ballon est en jeu

  // On passe en "jeu libre" : les étapes déjà jouées restent dans l'historique
  if (!courant.libre) {
    courant = {
      titre: "Jeu libre" + (SITUATIONS[sit].etapes.length > 1 ? " (suite de : " + SITUATIONS[sit].titre + ")" : ""),
      cle: "Double-clique sur un joueur : la balle part, les adversaires réagissent, et toi tu déplaces tes joueurs. Pas de limite de passes !",
      roles: SITUATIONS[sit].roles,
      libre: true,
      etapes: etapes().slice(0, k + 1)
    };
  } else {
    courant.etapes = courant.etapes.slice(0, k + 1);   // si on était revenu en arrière, on repart d'ici
  }
  courant.etapes.push(E2);

  construire();
  p = k;
  segAffiche = -1;
  dessiner();
  allerEtape(k + 1);   // animation : la balle part, les joueurs se replacent
}

function annulerAction() {
  if (!courant.libre || courant.etapes.length < 2) return;
  courant.etapes.pop();
  pause();
  construire();
  p = nbSegments();
  segAffiche = -1;
  dessiner();
}

// =====================================================================
//  LE TIR AU BUT
//  Le bouton « 🥅 Tirer » s'allume quand le porteur est en position de tir.
//  La chance de marquer dépend de :
//   - la distance au but (plus on est près, mieux c'est)
//   - l'angle (face au but, c'est plus facile que de côté)
//   - les défenseurs placés entre le ballon et le but (ils peuvent contrer)
//   - le gardien bien placé sur la ligne de tir
// =====================================================================

// Le porteur est-il en position de tir ? (devant le but adverse, pas trop excentré)
function peutTirer(etape) {
  if (!etape || !etape.b || etape.b === "*" || etape.vue || etape.engagement) return false;   // pas de but direct sur l'engagement
  const C = cadre(equipeDe(etape.b), posDe(etape, etape.b));
  return C[0] >= 75 && C[1] >= 14 && C[1] <= 50;
}

function analyserTir(etape) {
  const equipe = equipeDe(etape.b);
  const C = cadre(equipe, posDe(etape, etape.b));
  const BUT = [100, 32];
  const dist = distance(C, BUT);
  let chance = borner(1.2 - dist / 30, 0.05, 0.9);                       // distance
  chance *= borner(1 - Math.max(0, Math.abs(C[1] - 32) - 6) / 20, 0.3, 1); // angle
  const raisons = [`à ${metres(dist)} m du but`];

  const adv = joueurs(etape).filter(j => j.equipe !== equipe)
    .map(j => ({ cle: j.cle, role: j.role, pos: cadre(equipe, posDe(etape, j.cle)) }));
  const contreurs = [];
  let gardienBienPlace = false;
  adv.forEach((a) => {
    const r = distanceLigne(C, BUT, a.pos);
    if (r.t <= 0.05 || r.t >= 1.05) return;
    if (a.role === "GB") { if (r.d < 2.5) gardienBienPlace = true; }
    else if (r.d < 1.8) contreurs.push(a.cle);
  });
  if (contreurs.length) { chance *= Math.pow(0.4, contreurs.length); raisons.push(`${contreurs.length} défenseur${contreurs.length > 1 ? "s" : ""} devant le tir`); }
  if (gardienBienPlace) { chance *= 0.75; raisons.push("le gardien est bien placé"); }
  if (Math.abs(C[1] - 32) > 10) raisons.push("angle fermé");
  return { chance: borner(chance, 0.02, 0.9), raisons, contreurs };
}

function mettreAJourBoutonTir() {
  const b = document.getElementById("btn-tirer");
  if (!b) return;
  const etape = etapes()[Math.round(p)];
  const ok = !enLecture && Number.isInteger(p) && peutTirer(etape);
  b.disabled = !ok;
  if (ok) {
    const t = analyserTir(etape);
    b.textContent = `🥅 Tirer (${Math.round(t.chance * 100)} %)`;
  } else {
    b.textContent = "🥅 Tirer";
  }
}

// Position d'engagement (balle au centre) pour l'équipe qui vient d'encaisser
function positionsEngagement(equipeQuiEngage) {
  const modele = SITUATIONS.find(s => s.etapes[0].engagement === equipeQuiEngage).etapes[0];
  return JSON.parse(JSON.stringify({ n: modele.n, e: modele.e, b: modele.b, engagement: modele.engagement }));
}

const DU = { GB: "du gardien", DG: "du défenseur gauche", DD: "du défenseur droit", MD: "du milieu défensif",
             MC: "du milieu", AG: "de l'ailier gauche", AD: "de l'ailier droit", AT: "de l'attaquant" };

// Score = nombre de buts dans les étapes jouées (si on annule, le but disparaît)
function score() {
  const s = { nous: 0, eux: 0 };
  (courant.etapes || []).forEach(e => { if (e.but) s[e.but] += 1; });
  return s;
}

function tirer() {
  arreterReaction();
  arreterSurEtape();
  const k = p;
  const E = etapes()[k];
  if (!peutTirer(E)) return;

  const equipe = equipeDe(E.b);
  const nous = equipe === "nous";
  const tireur = nous ? POSTES[E.b] : "L'adversaire";
  const t = analyserTir(E);
  const hasard = Math.random();
  const E2 = JSON.parse(JSON.stringify(E));
  delete E2.f; delete E2.relance; delete E2.engagement;
  E2.libre = true;

  const sc = score();
  let txt;
  if (hasard < t.chance) {
    // ---- BUT ----
    sc[equipe] += 1;
    E2.b = "*";
    E2.bp = cadre(equipe, [101.5, 32 + (Math.random() - 0.5) * 5]);   // le ballon finit au fond du filet
    E2.but = equipe;
    txt = nous
      ? `BUUUT ! Tir ${DU[E.b] || "adverse"} : il marque (il avait ${Math.round(t.chance * 100)} % de chances). Score : ${sc.nous} – ${sc.eux}.`
      : `L'adversaire marque… (${Math.round(t.chance * 100)} % de chances). Score : ${sc.nous} – ${sc.eux}. On repart !`;
  } else if (t.contreurs.length && hasard < t.chance + (1 - t.chance) * 0.6) {
    // ---- TIR CONTRÉ ----
    E2.b = t.contreurs[0];
    replacer(E2);
    txt = nous
      ? `Tir ${DU[E.b] || "adverse"}… CONTRÉ par un défenseur ! Il y avait quelqu'un sur la ligne de tir.`
      : `Tir adverse… CONTRÉ par ${POSTES[t.contreurs[0]]} ! Bien placé entre le ballon et le but.`;
  } else {
    // ---- ARRÊT DU GARDIEN -> dégagement ----
    E2.b = nous ? "e0" : "GB";
    E2.relance = true;
    replacer(E2);
    txt = nous
      ? `Tir ${DU[E.b] || "adverse"}… ARRÊTÉ par le gardien ! (${Math.round(t.chance * 100)} % de chances). Le gardien adverse dégage : recule derrière la ligne pointillée.`
      : "Tir adverse… ARRÊTÉ par notre gardien ! Dégagement : les adversaires reculent derrière la ligne.";
  }

  const numero = courant.libre ? courant.etapes.length : k + 1;
  E2.txt = `Action ${numero} – ` + txt;
  passerEnJeuLibre(k);
  courant.etapes.push(E2);
  construire();
  p = k;
  segAffiche = -1;
  dessiner();
  allerEtape(k + 1);
}

// Après un but : balle au centre pour l'équipe qui a encaissé
function engagerApresBut() {
  arreterSurEtape();
  const k = p;
  const E = etapes()[k];
  if (!E.but) return;
  const qui = E.but === "nous" ? "eux" : "nous";
  const sc = score();
  const E2 = positionsEngagement(qui);
  E2.libre = true;
  E2.txt = qui === "eux"
    ? `Balle au centre : l'adversaire engage. Score : ${sc.nous} – ${sc.eux}. Double-clique sur un adversaire pour qu'il engage.`
    : `Balle au centre : on engage. Score : ${sc.nous} – ${sc.eux}. Double-clique sur un coéquipier pour engager.`;
  courant.etapes = courant.etapes.slice(0, k + 1);
  courant.etapes.push(E2);
  construire();
  p = k;
  segAffiche = -1;
  dessiner();
  allerEtape(k + 1);
}

// Transforme la situation en "jeu libre" (les étapes déjà jouées restent)
function passerEnJeuLibre(k) {
  if (!courant.libre) {
    courant = {
      titre: "Jeu libre" + (SITUATIONS[sit].etapes.length > 1 ? " (suite de : " + SITUATIONS[sit].titre + ")" : ""),
      cle: "Double-clique sur un joueur : la balle part, les adversaires réagissent, et toi tu déplaces tes joueurs. Pas de limite de passes !",
      roles: SITUATIONS[sit].roles,
      libre: true,
      etapes: etapes().slice(0, k + 1)
    };
  } else {
    courant.etapes = courant.etapes.slice(0, k + 1);
  }
}

// =====================================================================
//  L'ADVERSAIRE JOUE TOUT SEUL
//  Quand les rouges ont le ballon (en jeu libre), ils attendent quelques
//  secondes (le temps que tu replaces tes bleus), puis ils décident :
//   1. en position de tir avec une bonne chance -> ils TIRENT
//   2. une bonne passe existe -> ils PASSENT
//   3. sinon, s'il y a de la place devant -> ils AVANCENT avec le ballon
//   4. sinon -> ils tentent la passe la moins risquée (elle peut être interceptée !)
// =====================================================================
let autoMinuteur = null;
let autoReste = 0;

function autoActif() { return document.getElementById("chk-auto").checked; }

function annulerAuto() {
  if (autoMinuteur) clearInterval(autoMinuteur);
  autoMinuteur = null;
  const info = document.getElementById("auto-info");
  if (info) info.textContent = "";
}

function planifierAuto() {
  annulerAuto();
  if (!autoActif() || !courant || enLecture || !Number.isInteger(p)) return;
  const E = etapes()[p];
  if (!E || !E.b || E.b === "*" || equipeDe(E.b) !== "eux") return;
  if (!(E.libre || etapes().length === 1)) return;     // pas pendant une situation déjà écrite
  autoReste = Number(document.getElementById("sel-delai").value);
  const info = document.getElementById("auto-info");
  info.textContent = `⏳ L'adversaire joue dans ${autoReste} s – replace tes joueurs !`;
  autoMinuteur = setInterval(() => {
    if (glisser) return;                                 // on attend que tu lâches le joueur
    autoReste -= 1;
    if (autoReste > 0) { info.textContent = `⏳ L'adversaire joue dans ${autoReste} s – replace tes joueurs !`; return; }
    annulerAuto();
    jouerRouge();
  }, 1000);
}

// Le bouton « L'adversaire joue » est actif quand les rouges ont le ballon
function rougePeutJouer() {
  if (enLecture || !Number.isInteger(p) || !courant) return false;
  const E = etapes()[p];
  return !!(E && E.b && E.b !== "*" && !E.vue && equipeDe(E.b) === "eux");
}

function jouerRouge() {
  if (!rougePeutJouer()) return;
  const E = etapes()[p];
  if (!E || equipeDe(E.b) !== "eux" || E.b === "*") return;

  // 1. Tir ?
  if (peutTirer(E) && analyserTir(E).chance >= 0.25) { tirer(); return; }

  // 2. Bonne passe ? (un peu de hasard entre les 2 meilleures pour ne pas être prévisible)
  const options = analyserPasses(E).options;
  const bonnes = options.filter(o => o.niveau === "bonne").slice(0, 2);
  if (bonnes.length) { action(bonnes[Math.random() < 0.7 ? 0 : bonnes.length - 1].cle); return; }

  // 3. Avancer avec le ballon ?
  if (conduireRouge()) return;

  // 4. Passe possible, sinon la moins risquée
  action(options[0].cle);
}

// Le porteur rouge avance avec le ballon (si aucun bleu ne bloque devant lui)
function conduireRouge() {
  arreterSurEtape();
  const k = p;
  const E = etapes()[k];
  const pb = cadre("eux", posDe(E, E.b));
  const bleus = Object.keys(POSTES).map(r => cadre("eux", E.n[r]));
  for (const pas of [9, 6, 3]) {
    const dir = pb[0] < 62 ? [1, 0] : unitaire([96 - pb[0], 32 - pb[1]]);
    const essai = [Math.min(pb[0] + dir[0] * pas, 92), pb[1] + dir[1] * pas];
    if (Math.min(...bleus.map(b => distance(b, essai))) > 5) {
      const E2 = JSON.parse(JSON.stringify(E));
      delete E2.f; delete E2.relance; delete E2.engagement;
      E2.libre = true;
      mettrePos(E2, E2.b, cadre("eux", essai));
      replacer(E2);
      // les autres rouges ne courent pas plus loin que le porteur
      E2.e = E2.e.map((c, i) => {
        if ("e" + i === E2.b) return c;
        const d0 = E.e[i], d = distance(d0, c), course = Math.max(4, pas * 1.2);
        return d <= course ? c : [d0[0] + (c[0] - d0[0]) * course / d, d0[1] + (c[1] - d0[1]) * course / d];
      });
      E2.txt = `Action ${courant.libre ? courant.etapes.length : k + 1} – L'adversaire avance avec le ballon. Va le presser ou ferme ses passes !`;
      passerEnJeuLibre(k);
      courant.etapes.push(E2);
      construire();
      p = k;
      segAffiche = -1;
      dessiner();
      allerEtape(k + 1);
      return true;
    }
  }
  return false;
}
