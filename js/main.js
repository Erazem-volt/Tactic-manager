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
  // ---------- Panneau des situations ----------
  // Numéro (dans SITUATIONS) de la situation « Placement de base »
  const iPlacement = SITUATIONS.findIndex(s => s.titre === "Placement de base");

  // Les 3 groupes de cartes, dans l'ordre d'affichage.
  // Chaque groupe garde les situations qui répondent à sa condition.
  const groupes = [
    { titre: "Placement",          garder: (s, i) => i === iPlacement },
    { titre: "Situations guidées", garder: (s) => s.ecrite },
    { titre: "Jeu libre",          garder: (s, i) => !s.ecrite && i !== iPlacement }
  ];

  const panneauSit = document.getElementById("situations");
  const fondSit = document.getElementById("fond-situations");
  const listeSit = document.getElementById("liste-situations");

  groupes.forEach((g) => {
    // Petit titre du groupe
    const h = document.createElement("h3");
    h.textContent = g.titre;
    listeSit.appendChild(h);
    // Une carte cliquable par situation du groupe
    SITUATIONS.forEach((s, i) => {
      if (!g.garder(s, i)) return;
      const carte = document.createElement("button");
      carte.className = "carte-situation";
      carte.dataset.index = i;   // on retrouve la situation grâce à ce numéro
      carte.innerHTML = `<b>${s.titre}</b><span class="carte-desc">${s.cle}</span>` +
        `<small class="carte-note">Écrite pour notre système : choisis « Notre système » pour la voir.</small>`;
      // Choisir une carte : on ferme le panneau, puis on charge la situation
      carte.addEventListener("click", () => { fermerSit(); choisirSituation(i); });
      listeSit.appendChild(carte);
    });
  });

  // Ouvrir / fermer le panneau des situations (comme le panneau Paramètres)
  const ouvrirSit = () => {
    panneauSit.hidden = false; fondSit.hidden = false;
    // On place le clavier sur la carte en cours (ou sur la croix)
    (listeSit.querySelector(".carte-situation.actif") || document.getElementById("btn-fermer-situations")).focus();
  };
  const fermerSit = () => {
    if (panneauSit.hidden) return;
    panneauSit.hidden = true; fondSit.hidden = true;
    document.getElementById("btn-situations").focus();
  };
  document.getElementById("btn-situations").addEventListener("click", ouvrirSit);
  document.getElementById("btn-fermer-situations").addEventListener("click", fermerSit);
  fondSit.addEventListener("click", fermerSit);   // clic sur le fond sombre
  document.addEventListener("keydown", (e) => { if (e.key === "Escape") fermerSit(); });

  // Systèmes de jeu
  const changerSysteme = () => {
    appliquerSysteme();
    choisirSituation(iPlacement);
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
    if (!document.getElementById("situations").hidden) return;   // panneau des situations ouvert
    if (e.key === "ArrowRight") allerEtape(Math.floor(p) + 1);
    if (e.key === "ArrowLeft") allerEtape(Math.ceil(p - 0.0001) - 1);
    if (e.key === " ") { e.preventDefault(); enLecture ? pause() : jouer(); }
    if ((e.key === "r" || e.key === "R") && rougePeutJouer()) { annulerAuto(); jouerRouge(); }
    if ((e.key === "t" || e.key === "T") && peutTirer(etapes()[Math.round(p)])) tirer();
  });

  appliquerSysteme();
  // Au démarrage : « Placement de base », étape 1, sans lancer l'animation
  choisirSituation(iPlacement, true);
}

demarrer();
