// =====================================================================
//  TACTIC MANAGER – démarrage
//  Crée les boutons, branche les événements et lance l'application.
// =====================================================================

// ---------- Démarrage ----------
function demarrer() {
  const zonePostes = document.getElementById("postes");
  for (const poste in POSTES) {
    const b = document.createElement("button");
    b.dataset.poste = poste;
    b.innerHTML = `<b>${ABBR[poste]}</b>${POSTES[poste]}`;
    b.classList.toggle("actif", poste === monPoste);
    b.addEventListener("click", () => choisirPoste(poste));
    zonePostes.appendChild(b);
  }
  const zonePhases = document.getElementById("phases");
  SITUATIONS.forEach((s, i) => {
    const b = document.createElement("button");
    b.innerHTML = `<span class="num">${i + 1}</span>${s.titre}`;
    b.addEventListener("click", () => choisirSituation(i));
    zonePhases.appendChild(b);
  });

  // Systèmes de jeu
  const changerSysteme = () => {
    appliquerSysteme();
    choisirSituation(SITUATIONS.findIndex(s => s.titre.startsWith("Placement officiel")));
  };
  document.getElementById("sel-systeme").addEventListener("change", changerSysteme);
  document.getElementById("sel-systeme-adv").addEventListener("change", changerSysteme);


  // Roue crantée : ouvrir / fermer le panneau des paramètres
  const panneauParam = document.getElementById("parametres");
  const fondParam = document.getElementById("fond-parametres");
  const ouvrirParam = () => { panneauParam.hidden = false; fondParam.hidden = false; document.getElementById("btn-fermer-parametres").focus(); };
  const fermerParam = () => { panneauParam.hidden = true; fondParam.hidden = true; document.getElementById("btn-parametres").focus(); };
  document.getElementById("btn-parametres").addEventListener("click", ouvrirParam);
  document.getElementById("btn-fermer-parametres").addEventListener("click", fermerParam);
  fondParam.addEventListener("click", fermerParam);
  document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !panneauParam.hidden) fermerParam(); });
  document.getElementById("btn-jouer").addEventListener("click", () => enLecture ? pause() : jouer());
  document.getElementById("btn-prec").addEventListener("click", () => allerEtape(Math.ceil(p - 0.0001) - 1));
  document.getElementById("btn-suiv").addEventListener("click", () => allerEtape(Math.floor(p) + 1));
  document.getElementById("chk-fleches").addEventListener("change", appliquerOptions);
  document.getElementById("chk-adversaires").addEventListener("change", appliquerOptions);

  // Qui a le ballon ?
  const selBallon = document.getElementById("sel-ballon");
  selBallon.innerHTML = '<option value="">(l\'adversaire)</option>';
  for (const poste in POSTES) {
    const o = document.createElement("option");
    o.value = poste; o.textContent = POSTES[poste];
    selBallon.appendChild(o);
  }
  selBallon.addEventListener("change", () => {
    if (!selBallon.value) return;
    arreterSurEtape();
    etapes()[p].b = selBallon.value;
    // Donner le ballon au gardien = dégagement (6 m) : zone protégée
    etapes()[p].relance = selBallon.value === "GB";
    delete etapes()[p].engagement;
    appliquerRegles(etapes()[p]);
    reagirRouges(null);
    segAffiche = -1;
    dessiner();
  });
  document.getElementById("btn-annuler").addEventListener("click", annulerAction);
  document.getElementById("btn-remettre").addEventListener("click", () => {
    const garde = Math.round(p);
    courant = JSON.parse(JSON.stringify(SITUATIONS[sit]));
    pause();
    construire();
    p = garde;
    segAffiche = -1;
    dessiner();
  });
  document.getElementById("btn-tirer").addEventListener("click", tirer);
  document.getElementById("chk-auto").addEventListener("change", planifierAuto);
  document.getElementById("btn-rouge").addEventListener("click", () => { annulerAuto(); jouerRouge(); });
  window.addEventListener("pointermove", deplacerGlisser);
  // Empêche la sélection de texte au clic / double-clic sur le terrain
  svg.addEventListener("mousedown", (e) => e.preventDefault());
  svg.addEventListener("dblclick", (e) => { e.preventDefault(); window.getSelection().removeAllRanges(); });
  window.addEventListener("pointerup", finirGlisser);

  document.addEventListener("keydown", (e) => {
    if (e.target.tagName === "SELECT") return;
    if (!document.getElementById("parametres").hidden) return;   // panneau des paramètres ouvert
    if (e.key === "ArrowRight") allerEtape(Math.floor(p) + 1);
    if (e.key === "ArrowLeft") allerEtape(Math.ceil(p - 0.0001) - 1);
    if (e.key === " ") { e.preventDefault(); enLecture ? pause() : jouer(); }
    if ((e.key === "r" || e.key === "R") && rougePeutJouer()) { annulerAuto(); jouerRouge(); }
    if ((e.key === "t" || e.key === "T") && peutTirer(etapes()[Math.round(p)])) tirer();
  });

  appliquerSysteme();
  choisirSituation(0);
}

demarrer();
