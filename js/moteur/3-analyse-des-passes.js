// =====================================================================
//  OUTILS COMMUNS AUX DEUX ÉQUIPES
//  On utilise un "cadre" : pour chaque équipe, son propre but est en x = 0
//  et elle attaque vers x = 100. Pour l'adversaire, on retourne le terrain.
// =====================================================================
// Rôle de chaque adversaire (e0 à e7) vu depuis SON côté du terrain
const ROLE_ADV = ["GB", "DD", "MD", "DG", "MC", "AD", "AG", "AT"];

function equipeDe(cle) { return cle[0] === "e" ? "eux" : "nous"; }
function autre(equipe) { return equipe === "nous" ? "eux" : "nous"; }
function cadre(equipe, pt) { return equipe === "nous" ? [pt[0], pt[1]] : [100 - pt[0], 64 - pt[1]]; }
function posDe(etape, cle) { return cle[0] === "e" ? etape.e[Number(cle.slice(1))] : etape.n[cle]; }
function mettrePos(etape, cle, pt) {
  const x = Math.max(1, Math.min(99, pt[0])), y = Math.max(2, Math.min(62, pt[1]));
  if (cle[0] === "e") etape.e[Number(cle.slice(1))] = [x, y]; else etape.n[cle] = [x, y];
}
function joueurs(etape) {
  const liste = Object.keys(POSTES).map(r => ({ cle: r, equipe: "nous", role: r }));
  etape.e.forEach((_, i) => liste.push({ cle: "e" + i, equipe: "eux", role: ROLE_ADV[i] }));
  return liste;
}
function nomJoueur(cle) {
  return equipeDe(cle) === "nous" ? POSTES[cle] : "un adversaire";
}
function distance(a, b) { return Math.hypot(a[0] - b[0], a[1] - b[1]); }
function metres(u) { return Math.round(u * 0.65); }
function borner(v, min, max) { return Math.max(min, Math.min(max, v)); }
function unitaire(v) { const L = Math.hypot(v[0], v[1]) || 1; return [v[0] / L, v[1] / L]; }

// Distance entre un adversaire O et la ligne de passe C -> T
function distanceLigne(C, T, O) {
  const dx = T[0] - C[0], dy = T[1] - C[1];
  const L2 = dx * dx + dy * dy || 1;
  const t = ((O[0] - C[0]) * dx + (O[1] - C[1]) * dy) / L2;
  const px = C[0] + t * dx, py = C[1] + t * dy;
  return { t, d: Math.hypot(O[0] - px, O[1] - py), point: [px, py] };
}

// =====================================================================
//  ÉVALUER UNE PASSE (dans le cadre de l'équipe qui a le ballon)
//   1. la ligne de passe : un adversaire peut-il l'intercepter ?
//   2. l'espace du receveur
//   3. la longueur de la passe
//   4. avancer / éliminer des adversaires
//   5. passe au gardien sous pression = danger
//  (1 unité du terrain ≈ 0,6 mètre)
// =====================================================================
function evaluerPasse(C, T, adversaires, roleReceveur, marge = 0) {
  // marge > 0 : plus prudent (utilisé quand les joueurs cherchent leur place)
  const d = distance(C, T);
  const raisons = [];
  let score = 0;

  const seuil = 2.4 + 0.07 * d + marge * 12;
  let coupeur = null;
  let pression = Infinity;
  adversaires.forEach((a) => {
    const r = distanceLigne(C, T, a.pos);
    const dC = distance(a.pos, C);
    pression = Math.min(pression, dC);
    let coupe;
    if (dC < 5) {
      // Adversaire collé au porteur : il ferme toutes les passes dans SA direction (un cône d'environ 55°)
      const v1 = unitaire([a.pos[0] - C[0], a.pos[1] - C[1]]), v2 = unitaire([T[0] - C[0], T[1] - C[1]]);
      coupe = v1[0] * v2[0] + v1[1] * v2[1] > 0.88 - marge && r.t > 0;
    } else {
      coupe = r.t > 0.08 && r.t < 1 && r.d < seuil;
    }
    if (coupe && (!coupeur || r.d < coupeur.d)) coupeur = { ...r, cle: a.cle };
  });
  if (coupeur) { score -= 60; raisons.push("un adversaire coupe la ligne de passe"); }

  let espace = Infinity, marqueur = null;
  adversaires.forEach((a) => { const dd = distance(a.pos, T); if (dd < espace) { espace = dd; marqueur = a.cle; } });
  if (espace < 4) { score -= 25; raisons.push(`receveur marqué (adversaire à ${metres(espace)} m)`); }
  else {
    score += Math.min(espace, 15) * 1.5;
    raisons.push(espace >= 10 ? `receveur libre (${metres(espace)} m d'espace)` : `un peu d'espace (${metres(espace)} m)`);
  }

  // Passe longue : en U11, au-delà de ~20 m (35 unités) c'est risqué, et encore plus sous pression
  if (d > 35) { score -= (d - 35) * 2.5; raisons.push(`passe très longue (${metres(d)} m)`); }
  const gain = T[0] - C[0];
  if (pression < 4 && d > 25 && gain > 0) { score -= 20; raisons.push("passe longue sous pression"); }

  const elimines = adversaires.filter(a => a.role !== "GB" && a.pos[0] > C[0] + 1 && a.pos[0] < T[0] - 1).length;
  // Avancer rapporte des points ; reculer coûte un tout petit peu (ce n'est pas une faute !)
  score += (gain > 0 ? gain * 0.6 : Math.max(gain * 0.15, -6)) + elimines * 6;
  if (gain > 8) raisons.push("fait avancer le jeu");
  if (gain < -8) raisons.push("passe en arrière");
  if (elimines > 0) raisons.push(`élimine ${elimines} adversaire${elimines > 1 ? "s" : ""}`);

  if (T[0] >= 78 && T[1] >= 16 && T[1] <= 48) { score += 15; raisons.push("receveur en position de tir"); }

  if (roleReceveur === "GB" && espace < 10) { score -= 30; raisons.push("dangereux devant le but"); }

  let niveau = score >= 20 ? "bonne" : score >= 5 ? "possible" : "risquee";
  if (niveau === "bonne" && (d > 35 || coupeur)) niveau = "possible";   // jamais "sûre" si longue
  // Passe en arrière vers un coéquipier démarqué, ligne libre, pas trop longue = passe SÛRE
  if (!coupeur && gain <= 0 && espace >= 8 && d <= 35 && !(roleReceveur === "GB" && espace < 10)) {
    niveau = "bonne";
    if (!raisons.includes("passe sûre en soutien")) raisons.unshift("passe sûre en soutien");
  }
  return { score, niveau, raisons, coupeur, espace, marqueur };
}

// Toutes les passes possibles pour le porteur actuel (de n'importe quelle équipe)
function analyserPasses(etape) {
  if (!etape.b || etape.b === "*") return null;
  const equipe = equipeDe(etape.b);
  const tous = joueurs(etape);
  const C = cadre(equipe, posDe(etape, etape.b));
  const adv = tous.filter(j => j.equipe !== equipe).map(j => ({ cle: j.cle, role: j.role, pos: cadre(equipe, posDe(etape, j.cle)) }));
  const options = tous
    .filter(j => j.equipe === equipe && j.cle !== etape.b)
    .map(j => ({ cle: j.cle, role: j.role, T: posDe(etape, j.cle),
                 ...evaluerPasse(C, cadre(equipe, posDe(etape, j.cle)), adv, j.role) }));
  options.sort((a, b) => b.score - a.score);
  return { equipe, C, options };
}

// =====================================================================
//  AFFICHAGE DE L'ANALYSE
// =====================================================================
function cacherAnalyse() { el.analyse.innerHTML = ""; }

function afficherAnalyse(etape) {
  el.analyse.innerHTML = "";
  const sel = document.getElementById("sel-ballon");
  // ----- Vue "placement officiel" : pas d'analyse de passe -----
  if (etape.vue) {
    const s = etape.vue === "eux" ? SYSTEMES[systemeEux()] : SYSTEMES[systemeNous()];
    document.getElementById("analyse").innerHTML = `<div class="meilleure-passe">📐 <b>${s.titre}</b><br><small>${s.resume}</small></div>
      <p class="vide">Change de système dans le menu du haut pour voir un autre placement. Clique sur « Étape ▶ » pour voir ${etape.vue === "nous" ? "le système adverse" : "les deux équipes face à face"}.</p>`;
    return;
  }
  // ----- Le ballon est au fond des filets -----
  if (etape.b === "*") {
    sel.value = "";
    const sc = score();
    document.getElementById("analyse").innerHTML = `<div class="meilleure-passe" style="font-size:1.1rem">
      ${etape.but === "nous" ? "<b>BUT pour ton équipe !</b>" : "😬 <b>But de l'adversaire.</b>"}<br>Score : <b>${sc.nous} – ${sc.eux}</b></div>
      <button class="gros-bouton" id="btn-engager">Balle au centre (${etape.but === "nous" ? "l'adversaire engage" : "on engage"})</button>`;
    document.getElementById("btn-engager").addEventListener("click", engagerApresBut);
    return;
  }
  sel.value = equipeDe(etape.b) === "eux" ? "" : etape.b;
  const zone = document.getElementById("analyse");
  const r = analyserPasses(etape);
  const Cr = posDe(etape, etape.b);

  // ----- Rappel de la règle en cours -----
  const regle = reglesActives(etape);
  const fautifs = bleusHorsRegle(etape).map(k => POSTES[k]);
  let note = "";
  if (regle && regle.texte === "relance") note = `<div class="alerte">🧤 <b>Dégagement du gardien</b> : les adversaires doivent rester derrière la ligne pointillée tant que le gardien n'a pas joué. Profite de cet espace : tes défenseurs s'écartent dans la zone pour recevoir tranquillement.</div>`;
  if (regle && regle.texte === "relance-eux") note = `<div class="alerte">🧤 <b>Dégagement du gardien adverse</b> : tes joueurs doivent rester derrière la ligne pointillée de leur côté tant que leur gardien n'a pas joué.</div>`;
  if (regle && regle.texte === "engagement") note = `<div class="alerte"><b>Balle au centre</b> : chaque équipe dans sa moitié, les adversaires hors du rond central. Double-clique sur un coéquipier pour engager.</div>`;
  if (regle && regle.texte === "engagement-eux") note = `<div class="alerte"><b>L'adversaire engage</b> : reste dans ta moitié et hors du rond central. Double-clique sur un adversaire pour qu'il engage.</div>`;
  if (fautifs.length) note += `<div class="alerte" style="border-color:#ff4d4d">⚠️ Pas encore le droit d'être là : <b>${fautifs.join(", ")}</b>. Recule ${fautifs.length > 1 ? "ces joueurs" : "ce joueur"}.</div>`;

  // ----- L'adversaire a le ballon : on montre SA passe la plus dangereuse -----
  if (r.equipe === "eux") {
    const danger = r.options[0];
    creer("line", { x1: Cr[0], y1: Cr[1], x2: danger.T[0], y2: danger.T[1], class: "passe danger" }, el.analyse);
    creer("circle", { cx: danger.T[0], cy: danger.T[1], r: 3, class: "coupe" }, el.analyse);
    if (peutTirer(etape)) note += `<div class="alerte" style="border-color:#ff4d4d">🥅 L'adversaire est en position de tir (${Math.round(analyserTir(etape).chance * 100)} %) ! Place un joueur entre le ballon et le but pour contrer. Bouton « Tirer » pour le faire tirer.</div>`;
    zone.innerHTML = note + `<div class="meilleure-passe" style="border-color:#ff4d4d;background:#3d1717">
      ⚠️ L'adversaire a le ballon. Sa passe la plus dangereuse est vers le joueur <b>entouré en rouge</b>
      ${danger.niveau === "risquee" ? "(mais elle est difficile pour lui : on défend bien !)" : ": il faut la couper !"}</div>
      <p class="vide">👉 Double-clique sur un de tes joueurs <b>proche du porteur</b> pour récupérer le ballon,
      ou sur un <b>adversaire</b> pour le faire jouer toi-même (sinon il joue tout seul si l'option est cochée).</p>`;
    return;
  }

  // ----- Notre équipe a le ballon -----
  const meilleure = r.options[0];
  [...r.options].reverse().forEach((o) => {
    creer("line", { x1: Cr[0], y1: Cr[1], x2: o.T[0], y2: o.T[1],
      class: "passe " + o.niveau + (o === meilleure ? " meilleure" : "") }, el.analyse);
    if (o.coupeur) {
      const pc = posDe(etape, o.coupeur.cle);
      creer("circle", { cx: pc[0], cy: pc[1], r: 2.6, class: "coupe" }, el.analyse);
    }
  });
  if (meilleure.niveau !== "risquee") {
    creer("text", { x: meilleure.T[0], y: meilleure.T[1] - 3.3, class: "etoile" }, el.analyse).textContent = "★";
  }

  let html = note;
  if (peutTirer(etape)) {
    const tir = analyserTir(etape);
    html += `<div class="meilleure-passe">🥅 ${POSTES[etape.b]} est en position de tir : <b>${Math.round(tir.chance * 100)} % de chances de marquer</b><br>
      <small>${tir.raisons.join(", ")}.</small><br><button class="gros-bouton" id="btn-tirer-panneau">🥅 TIRER !</button>
      <small>Ou fais une passe à un coéquipier mieux placé.</small></div>`;
  } else if (meilleure.niveau === "risquee") {
    html += `<div class="meilleure-passe" style="border-color:#ff4d4d;background:#3d1717">⚠️ Aucune passe sûre : avance avec le ballon ou protège-le. La moins risquée : <b>${POSTES[meilleure.cle]}</b>.</div>`;
  } else {
    html += `<div class="meilleure-passe">★ Meilleure passe : <b>${POSTES[meilleure.cle]}</b><br><small>${meilleure.raisons.join(", ")}.</small></div>`;
  }
  html += `<p class="vide">👉 Double-clique sur un coéquipier pour lui faire la passe.</p><ul>`;
  r.options.slice(1).forEach((o) => {
    const mot = o.niveau === "bonne" ? "Bonne" : o.niveau === "possible" ? "Possible" : "Risquée";
    html += `<li><span class="point ${o.niveau}"></span><b>${POSTES[o.cle]}</b> – ${mot} : ${o.raisons.slice(0, 2).join(", ")}.</li>`;
  });
  html += "</ul>";
  zone.innerHTML = html;
  const bt = document.getElementById("btn-tirer-panneau");
  if (bt) bt.addEventListener("click", tirer);
}
