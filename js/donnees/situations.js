// =====================================================================
//  TACTIC MANAGER – situations de jeu
//  Les situations écrites étape par étape (positions, consignes).
// =====================================================================

// =====================================================================
//  LES SITUATIONS DE JEU
//  Chaque situation = une suite d'ÉTAPES (comme des photos).
//  Le simulateur fait bouger les joueurs d'une étape à la suivante.
//
//  Pour chaque étape :
//    txt : ce qui se passe (lu par l'entraîneur / le joueur)
//    b   : qui a le ballon -> "DD" (un des nôtres) ou "e4" (adversaire n°4)
//    n   : positions de NOTRE équipe  { poste: [x, y] }
//    e   : positions des 8 ADVERSAIRES [[x, y], ...] (le 1er = leur gardien)
//    f   : (facultatif) consignes spéciales pour cette étape { poste: "..." }
//
//  roles : consigne générale de chaque poste pour toute la situation
//  Terrain : x de 0 (notre but) à 100 (leur but), y de 0 (notre gauche) à 64.
// =====================================================================

const SITUATIONS = [
  // -------------------------------------------------------------------
  {
    titre: "Relance : pressing à 2 sur le défenseur",
    cle: "Deux adversaires sur le ballon = un coéquipier LIBRE quelque part. Trouve-le !",
    roles: {
      GB: "Joue court et reste toujours disponible derrière tes défenseurs.",
      DG: "Reste large : quand le ballon est de l'autre côté, c'est souvent toi qui es libre.",
      DD: "Sous pression à deux : garde ton calme, un copain est forcément libre.",
      MD: "Redescends entre les défenseurs et déplace-toi pour être bien visible.",
      MC: "Bouge pour emmener ton adversaire et créer de l'espace.",
      AG: "Reste large et haut, prêt à partir dans la profondeur.",
      AD: "Redescends le long de la ligne pour aider ton défenseur.",
      AT: "Reste haut pour obliger la défense adverse à reculer."
    },
    etapes: [
      { txt: "Le gardien a le ballon (dégagement). Les adversaires attendent derrière la ligne pointillée : on s'écarte pour faire un grand terrain.", b: "GB", relance: true,
        n: { GB: [4, 32], DG: [17, 8], DD: [17, 56], MD: [14, 32], MC: [30, 30], AG: [46, 6], AD: [44, 58], AT: [62, 32] },
        e: [[96, 32], [76, 18], [80, 32], [76, 46], [52, 32], [30, 12], [38, 50], [30, 34]] },
      { txt: "Le gardien passe au défenseur droit. Aussitôt, DEUX adversaires foncent sur lui !", b: "DD",
        n: { GB: [6, 38], DG: [18, 10], DD: [18, 55], MD: [15, 34], MC: [32, 42], AG: [46, 6], AD: [38, 60], AT: [60, 34] },
        e: [[96, 32], [72, 20], [78, 34], [72, 48], [34, 43], [32, 14], [28, 55], [17, 46]],
        f: { DD: "Avant même de recevoir, jette un coup d'œil autour de toi : qui arrive sur moi ? Qui est libre ?" } },
      { txt: "Deux contre un ! L'attaquant adverse arrive par l'intérieur et coupe la passe vers le gardien. Leur ailier coupe la passe le long de la ligne. Mais en pressant à deux, ils ont laissé le milieu défensif SEUL : c'est lui la solution.", b: "DD",
        n: { GB: [8, 44], DG: [20, 12], DD: [18, 55], MD: [25, 43], MC: [38, 44], AG: [48, 6], AD: [34, 61], AT: [58, 32] },
        e: [[96, 32], [70, 22], [76, 34], [70, 48], [40, 47], [36, 20], [23, 58], [13, 51]],
        f: {
          DD: "Ne panique pas ! Protège le ballon et cherche le copain libre. Ici, le milieu défensif est seul.",
          MD: "L'attaquant adverse t'a laissé pour presser : tu es LIBRE. Décale-toi pour que le défenseur te voie, et appelle le ballon !",
          GB: "L'attaquant adverse coupe ta ligne de passe : décale-toi pour en ouvrir une nouvelle.",
          AD: "Leur ailier est entre toi et le ballon : la passe est coupée. Bouge pour te rendre disponible.",
          MC: "Éloigne ton adversaire du ballon : tu libères de la place pour le milieu défensif.",
          DG: "Reste large et seul de ton côté : tu seras la prochaine solution."
        } },
      { txt: "Passe au milieu défensif ! Les deux adversaires qui pressaient sont éliminés. De l'autre côté, le défenseur gauche est tout seul.", b: "MD",
        n: { GB: [8, 40], DG: [22, 12], DD: [20, 54], MD: [26, 41], MC: [38, 44], AG: [50, 6], AD: [36, 60], AT: [58, 30] },
        e: [[96, 32], [68, 22], [76, 34], [70, 48], [36, 42], [34, 20], [34, 58], [17, 48]],
        f: {
          MD: "Avant de recevoir, regarde de l'autre côté : le défenseur gauche est libre. Contrôle vers la gauche !",
          DG: "Le jeu est de l'autre côté ? Écarte-toi et monte un peu : tu vas recevoir.",
          DD: "Bravo, tu as trouvé la solution. Remets-toi en place."
        } },
      { txt: "Changement de côté vers le défenseur gauche. L'adversaire doit traverser tout le terrain : on gagne du temps.", b: "DG",
        n: { GB: [8, 34], DG: [28, 12], DD: [22, 50], MD: [27, 35], MC: [42, 34], AG: [56, 6], AD: [40, 58], AT: [62, 26] },
        e: [[96, 32], [66, 16], [76, 30], [70, 44], [34, 32], [34, 16], [26, 46], [24, 38]],
        f: {
          DG: "Reçois en avançant, tête levée. L'ailier gauche démarre : passe-lui le ballon devant lui, dans sa course.",
          AG: "Le ballon change de côté : démarre dans le dos du défenseur adverse !",
          AT: "Attire les défenseurs vers le centre pour laisser de la place à l'ailier."
        } },
      { txt: "Passe dans la course de l'ailier gauche : on est sortis du pressing en 4 passes !", b: "AG",
        n: { GB: [10, 32], DG: [32, 12], DD: [24, 48], MD: [30, 34], MC: [48, 28], AG: [64, 6], AD: [50, 54], AT: [72, 28] },
        e: [[95, 32], [62, 10], [76, 28], [68, 44], [40, 30], [36, 14], [30, 46], [28, 38]],
        f: {
          AG: "Contrôle vers l'avant et regarde l'attaquant qui arrive dans la surface.",
          AT: "Fonce vers la surface pour reprendre le centre de l'ailier."
        } }
    ]
  },

  // -------------------------------------------------------------------
  {
    titre: "Axe bloqué : le dédoublement",
    cle: "Passe et va ! Après ta passe, tu cours pour redevenir une solution.",
    roles: {
      GB: "Avance quand on attaque : tu es le dernier défenseur.",
      DG: "Après ta passe, cours à l'extérieur de ton ailier : c'est le dédoublement.",
      DD: "Ballon de l'autre côté : reste derrière pour surveiller la contre-attaque.",
      MD: "Reste derrière le ballon : tu es la sécurité.",
      MC: "Rapproche-toi du ballon pour aider, puis va au point de penalty.",
      AG: "Redescends vers le ballon, puis donne-le dans la course du défenseur.",
      AD: "Rentre vers le deuxième poteau.",
      AT: "Attaque le premier poteau quand le centre arrive."
    },
    etapes: [
      { txt: "Le milieu défensif a le ballon. L'adversaire ferme bien le milieu du terrain.", b: "MD",
        n: { GB: [14, 32], DG: [38, 12], DD: [32, 52], MD: [36, 32], MC: [48, 36], AG: [58, 8], AD: [58, 56], AT: [70, 32] },
        e: [[95, 32], [80, 20], [82, 32], [80, 44], [64, 30], [58, 11], [59, 54], [47, 39]] },
      { txt: "Passe au défenseur gauche. L'ailier gauche redescend vers le ballon : son adversaire le suit.", b: "DG",
        n: { GB: [16, 30], DG: [40, 12], DD: [34, 46], MD: [38, 30], MC: [48, 28], AG: [50, 8], AD: [60, 48], AT: [68, 28] },
        e: [[95, 32], [60, 10], [80, 28], [80, 40], [60, 26], [54, 14], [62, 44], [44, 30]],
        f: {
          AG: "Redescends vers le ballon. Ton défenseur te suit : tu crées de l'espace derrière lui.",
          DG: "Passe à l'ailier qui vient vers toi, puis prépare-toi à courir."
        } },
      { txt: "L'ailier reçoit dos au but, un adversaire collé à lui. Le défenseur gauche part en course À L'EXTÉRIEUR : c'est le dédoublement.", b: "AG",
        n: { GB: [18, 30], DG: [44, 6], DD: [36, 44], MD: [40, 30], MC: [48, 22], AG: [51, 9], AD: [64, 46], AT: [72, 28] },
        e: [[95, 32], [55, 11], [80, 28], [80, 40], [58, 24], [46, 14], [62, 40], [44, 26]],
        f: {
          DG: "Tu as fait ta passe ? Ne reste pas là ! Cours à l'extérieur de ton ailier, le long de la ligne.",
          AG: "Protège le ballon avec ton corps. Ton défenseur arrive à l'extérieur : glisse-lui le ballon devant lui.",
          MC: "Rapproche-toi pour offrir une autre solution à l'ailier.",
          MD: "Remonte un peu derrière l'action : tu es la sécurité si on perd le ballon."
        } },
      { txt: "L'ailier glisse le ballon dans la course du défenseur. L'adversaire ne peut pas suivre deux joueurs en même temps !", b: "DG",
        n: { GB: [20, 32], DG: [64, 6], DD: [38, 44], MD: [44, 30], MC: [58, 26], AG: [56, 16], AD: [72, 46], AT: [78, 28] },
        e: [[95, 32], [58, 14], [82, 30], [82, 40], [64, 26], [48, 12], [68, 44], [46, 28]],
        f: {
          DG: "Avance avec le ballon jusqu'au niveau de la surface, puis lève la tête pour centrer.",
          AT: "Attaque le premier poteau !",
          AD: "Rentre vers le deuxième poteau.",
          MC: "Va vers le point de penalty pour une passe en retrait."
        } },
      { txt: "Centre ! L'attaquant au 1er poteau, l'ailier droit au 2e poteau, le milieu en retrait : 3 joueurs pour marquer.", b: "AT",
        n: { GB: [22, 32], DG: [76, 8], DD: [40, 44], MD: [48, 30], MC: [72, 30], AG: [64, 16], AD: [84, 40], AT: [86, 28] },
        e: [[96, 30], [70, 10], [86, 32], [86, 40], [72, 26], [52, 14], [76, 44], [50, 30]],
        f: {
          AT: "Arrive lancé au premier poteau et frappe du premier coup.",
          GB: "Avance jusqu'au bord de ta surface en cas de contre.",
          DD: "Reste derrière avec le milieu défensif pour surveiller la contre-attaque."
        } }
    ]
  },

  // -------------------------------------------------------------------
  {
    titre: "C'est bouché : on change de côté",
    cle: "C'est bouché d'un côté ? On fait tourner le ballon de l'autre côté, là où il y a de la place.",
    roles: {
      GB: "Avance pour rester proche de tes défenseurs.",
      DG: "Viens en soutien derrière ton ailier pour qu'il puisse rejouer en arrière.",
      DD: "Reste disponible de l'autre côté, sans trop monter.",
      MD: "Sois toujours libre au centre : c'est toi qui changes le jeu de côté.",
      MC: "Aide l'ailier gauche, puis va vers la surface.",
      AG: "Si tu es bloqué, rejoue en arrière ; ballon de l'autre côté : va au 2e poteau.",
      AD: "Reste très large de l'autre côté : c'est là qu'il y a de la place.",
      AT: "Reste dans l'axe et attaque la surface au moment du centre."
    },
    etapes: [
      { txt: "Le milieu a le ballon. L'ailier gauche est libre : il lui passe.", b: "MC",
        n: { GB: [18, 32], DG: [40, 12], DD: [38, 52], MD: [44, 32], MC: [58, 30], AG: [70, 8], AD: [70, 56], AT: [78, 32] },
        e: [[95, 32], [82, 20], [84, 32], [82, 44], [68, 30], [60, 14], [68, 50], [54, 32]] },
      { txt: "Tous les adversaires glissent du côté du ballon : l'ailier gauche est bloqué. Son défenseur gauche vient en soutien derrière lui. Et de l'autre côté, l'ailier droit est TOUT SEUL.", b: "AG",
        n: { GB: [20, 32], DG: [60, 6], DD: [40, 48], MD: [46, 30], MC: [60, 24], AG: [72, 8], AD: [74, 54], AT: [80, 30] },
        e: [[95, 30], [75, 10], [81, 27], [84, 32], [66, 20], [68, 14], [70, 36], [56, 26]],
        f: {
          AG: "Tu es bloqué ? Pas grave : protège le ballon et rejoue en arrière vers ton défenseur.",
          DG: "Viens en soutien derrière ton ailier, le long de la ligne : il pourra te redonner le ballon.",
          MD: "Place-toi au centre, libre, pour recevoir du défenseur gauche.",
          AD: "Le jeu est de l'autre côté ? Reste très large : c'est là qu'il y a de la place."
        } },
      { txt: "L'ailier rejoue en arrière vers son défenseur. Revenir en arrière n'est pas une faute : c'est pour mieux repartir !", b: "DG",
        n: { GB: [22, 32], DG: [58, 7], DD: [44, 50], MD: [50, 28], MC: [62, 22], AG: [70, 10], AD: [74, 56], AT: [80, 32] },
        e: [[95, 30], [74, 12], [82, 24], [84, 34], [65, 22], [64, 10], [70, 38], [58, 26]],
        f: {
          DG: "Un adversaire arrive sur toi : passe vite au milieu défensif, seul au centre.",
          MD: "Montre-toi au centre et, avant de recevoir, regarde à droite : l'ailier droit est seul."
        } },
      { txt: "Le milieu défensif reçoit au centre. Tous les adversaires sont à gauche : il renverse le jeu vers l'ailier droit.", b: "MD",
        n: { GB: [22, 34], DG: [56, 10], DD: [48, 50], MD: [50, 30], MC: [62, 26], AG: [72, 14], AD: [74, 56], AT: [80, 32] },
        e: [[95, 32], [74, 14], [82, 26], [84, 36], [64, 26], [62, 14], [70, 42], [58, 28]],
        f: {
          MD: "Grande passe vers l'ailier droit, devant lui, avant que l'adversaire ne revienne.",
          AD: "Démarre vers l'avant pour recevoir dans ta course."
        } },
      { txt: "L'ailier droit reçoit seul. Il a de l'espace pour avancer.", b: "AD",
        n: { GB: [24, 34], DG: [54, 14], DD: [52, 50], MD: [52, 34], MC: [66, 30], AG: [76, 18], AD: [78, 56], AT: [82, 32] },
        e: [[95, 32], [78, 18], [84, 30], [84, 42], [66, 32], [66, 20], [72, 50], [60, 34]],
        f: {
          AD: "Avance vers le but, puis centre vers l'attaquant ou l'ailier gauche au 2e poteau.",
          AG: "Ballon de l'autre côté : rentre vers le 2e poteau !"
        } },
      { txt: "Centre au deuxième poteau pour l'ailier gauche qui arrive lancé !", b: "AG",
        n: { GB: [26, 34], DG: [54, 18], DD: [56, 50], MD: [54, 36], MC: [72, 36], AG: [86, 24], AD: [84, 54], AT: [86, 34] },
        e: [[96, 32], [80, 22], [86, 32], [86, 42], [70, 34], [70, 20], [78, 52], [62, 36]],
        f: { AG: "Arrive lancé au deuxième poteau et frappe !" } }
    ]
  },

  // -------------------------------------------------------------------
  {
    titre: "Ballon perdu : on presse à 3",
    cle: "Ballon perdu ? Les 3 plus proches pressent pendant 5 secondes, les autres ferment les passes.",
    roles: {
      GB: "Avance pour couvrir l'espace derrière tes défenseurs.",
      DG: "Resserre-toi et surveille les attaquants adverses.",
      DD: "Resserre-toi et surveille les attaquants adverses.",
      MD: "Ne monte pas presser : reste devant la défense et intercepte.",
      MC: "Le plus proche presse tout de suite !",
      AG: "Reviens en courant pour fermer une passe.",
      AD: "Ferme la passe vers le côté.",
      AT: "Retourne-toi et ferme la passe en arrière."
    },
    etapes: [
      { txt: "Le milieu a le ballon dans le camp adverse et tente une passe vers l'attaquant… alors qu'un adversaire coupe la ligne (regarde l'analyse : c'était la passe risquée !).", b: "MC",
        n: { GB: [20, 32], DG: [42, 12], DD: [40, 52], MD: [46, 34], MC: [64, 38], AG: [76, 10], AD: [74, 50], AT: [80, 30] },
        e: [[95, 32], [82, 18], [84, 30], [82, 44], [70, 32], [66, 16], [64, 48], [56, 32]] },
      { txt: "Interception ! L'adversaire a le ballon. C'est le moment le plus dangereux : il faut réagir TOUT DE SUITE.", b: "e4",
        n: { GB: [18, 32], DG: [42, 12], DD: [40, 50], MD: [46, 34], MC: [65, 37], AG: [76, 12], AD: [74, 48], AT: [78, 30] },
        e: [[95, 32], [82, 18], [84, 30], [82, 44], [71, 33], [66, 16], [64, 48], [56, 32]],
        f: { MC: "C'est ta passe qui a été coupée : tu es le plus proche, fonce sur le porteur !" } },
      { txt: "On presse à TROIS : le milieu fonce sur le porteur, l'attaquant ferme la passe en arrière, l'ailier droit ferme la passe sur le côté.", b: "e4",
        n: { GB: [16, 32], DG: [38, 14], DD: [36, 46], MD: [44, 32], MC: [70, 36], AG: [66, 14], AD: [70, 42], AT: [76, 30] },
        e: [[95, 32], [82, 18], [84, 30], [82, 44], [70, 32], [64, 16], [64, 48], [54, 32]],
        f: {
          MC: "Presse le porteur sans te jeter. Mets-toi entre lui et notre but.",
          AT: "Coupe la passe en arrière vers leur défenseur.",
          AD: "Ferme la passe vers leur ailier sur le côté.",
          AG: "Reviens vite pour fermer la passe vers l'autre ailier.",
          MD: "Ne monte pas : reste devant tes défenseurs, prêt à intercepter."
        } },
      { txt: "Le porteur est enfermé. Il passe à son ailier, mais notre ailier gauche, revenu en courant, le presse dans le dos.", b: "e5",
        n: { GB: [16, 32], DG: [36, 16], DD: [34, 44], MD: [46, 28], MC: [68, 32], AG: [63, 20], AD: [68, 42], AT: [72, 28] },
        e: [[95, 32], [82, 18], [84, 30], [82, 44], [69, 33], [60, 18], [64, 48], [52, 30]],
        f: {
          AG: "Arrive dans son dos et presse-le : il ne peut pas se retourner.",
          MD: "Leur attaquant est la seule solution : place-toi devant lui pour couper la passe."
        } },
      { txt: "Il tente la passe vers son attaquant… interceptée par le milieu défensif ! Ballon récupéré en 5 secondes.", b: "MD",
        n: { GB: [18, 32], DG: [38, 16], DD: [36, 44], MD: [50, 30], MC: [64, 32], AG: [60, 20], AD: [68, 44], AT: [74, 28] },
        e: [[95, 32], [80, 20], [82, 30], [80, 44], [66, 36], [58, 18], [62, 46], [52, 33]],
        f: { MD: "Tu as deviné la passe : récupère et LÈVE LA TÊTE. L'attaquant est devant !" } },
      { txt: "Passe immédiate vers l'attaquant : l'adversaire est désorganisé, on attaque !", b: "AT",
        n: { GB: [20, 32], DG: [42, 16], DD: [40, 44], MD: [52, 30], MC: [68, 32], AG: [70, 16], AD: [76, 44], AT: [80, 30] },
        e: [[95, 32], [82, 22], [86, 30], [84, 42], [66, 32], [60, 20], [64, 46], [54, 33]],
        f: { AT: "Contrôle vers le but et frappe, ou passe à l'ailier qui arrive." } }
    ]
  },

  // -------------------------------------------------------------------
  {
    titre: "Ils attaquent à gauche : la couverture",
    cle: "Quand un copain sort presser, un autre se place DERRIÈRE lui : c'est la couverture.",
    roles: {
      GB: "Parle à tes défenseurs et place-toi selon le ballon.",
      DG: "Ballon de ton côté : sors presser, de côté, sans te jeter.",
      DD: "Ballon de l'autre côté : resserre-toi au centre et surveille l'attaquant.",
      MD: "Couvre le défenseur qui sort presser : place-toi derrière lui.",
      MC: "Glisse avec le ballon et surveille leur milieu.",
      AG: "Presse leur ailier ; si tu es dribblé, reviens aider.",
      AD: "Rentre vers l'intérieur pour fermer le centre.",
      AT: "Pousse le jeu adverse vers un côté."
    },
    etapes: [
      { txt: "L'adversaire a le ballon au milieu. Notre bloc est en place, bien serré.", b: "e4",
        n: { GB: [6, 32], DG: [18, 20], DD: [18, 44], MD: [26, 32], MC: [36, 30], AG: [40, 14], AD: [40, 50], AT: [50, 30] },
        e: [[94, 32], [74, 18], [76, 32], [74, 46], [56, 30], [48, 10], [50, 54], [34, 34]] },
      { txt: "Il passe à son ailier, sur notre côté gauche. Toute l'équipe glisse vers le ballon.", b: "e5",
        n: { GB: [6, 28], DG: [22, 12], DD: [18, 34], MD: [26, 24], MC: [36, 22], AG: [42, 10], AD: [36, 40], AT: [50, 24] },
        e: [[94, 32], [70, 16], [74, 30], [72, 44], [54, 28], [45, 7], [48, 48], [32, 30]],
        f: {
          AG: "Presse le porteur : mets-toi entre lui et le milieu du terrain.",
          DD: "Ballon de l'autre côté : resserre-toi vers le centre.",
          AD: "Rentre vers l'intérieur pour fermer le milieu."
        } },
      { txt: "L'ailier adverse dribble notre ailier et avance. Le défenseur gauche sort le presser… et le milieu défensif se place DERRIÈRE lui : c'est la couverture.", b: "e5",
        n: { GB: [6, 28], DG: [28, 10], DD: [18, 30], MD: [22, 16], MC: [32, 24], AG: [38, 10], AD: [32, 38], AT: [46, 24] },
        e: [[94, 32], [66, 16], [72, 30], [70, 44], [46, 26], [33, 7], [44, 46], [24, 28]],
        f: {
          DG: "Va presser le porteur, de côté, pour le pousser vers la ligne. Ne te jette pas !",
          MD: "Viens derrière ton défenseur gauche : s'il se fait dribbler, c'est toi qui arrêtes l'ailier.",
          DD: "Prends l'attaquant adverse au centre. Reste entre lui et le but.",
          AG: "Tu t'es fait dribbler ? Reviens tout de suite en courant pour aider !",
          MC: "Redescends pour surveiller leur milieu qui arrive."
        } },
      { txt: "Bloqué contre la ligne, l'ailier adverse tente une passe vers son attaquant au centre… le défenseur droit, bien placé, l'intercepte !", b: "DD",
        n: { GB: [6, 30], DG: [28, 10], DD: [21, 27], MD: [22, 17], MC: [32, 20], AG: [33, 11], AD: [30, 42], AT: [44, 26] },
        e: [[94, 32], [64, 18], [72, 30], [70, 44], [42, 28], [30, 8], [42, 46], [24, 30]],
        f: { DD: "Tu étais entre l'attaquant et le but : la passe arrive sur toi. Intercepte !" } },
      { txt: "Le défenseur droit joue tout de suite au milieu, libre devant lui.", b: "MC",
        n: { GB: [8, 32], DG: [30, 12], DD: [22, 28], MD: [24, 22], MC: [36, 30], AG: [40, 10], AD: [40, 44], AT: [52, 28] },
        e: [[94, 32], [64, 18], [72, 30], [70, 44], [42, 32], [30, 12], [42, 46], [26, 32]],
        f: {
          MC: "Montre-toi pour recevoir, et regarde déjà vers l'avant.",
          AG: "On a récupéré : repars vite vers l'avant, le long de la ligne !"
        } },
      { txt: "Le milieu lance l'ailier gauche dans le dos de l'adversaire : contre-attaque !", b: "AG",
        n: { GB: [10, 32], DG: [32, 12], DD: [26, 30], MD: [30, 26], MC: [40, 30], AG: [56, 8], AD: [52, 46], AT: [62, 26] },
        e: [[94, 32], [62, 16], [70, 30], [68, 44], [42, 32], [32, 14], [44, 46], [28, 32]],
        f: { AG: "Sprint ! Contrôle vers l'avant et file vers le but." } }
    ]
  },

  // -------------------------------------------------------------------
  {
    titre: "Contre-attaque éclair",
    cle: "Ballon récupéré ? On attaque en 4 passes MAX, avant que l'adversaire se replace.",
    roles: {
      GB: "Avance pour rester proche de tes défenseurs.",
      DG: "Remonte un peu, sans te précipiter.",
      DD: "Remonte un peu, sans te précipiter.",
      MD: "Récupère et joue VITE vers l'avant, puis reste en sécurité.",
      MC: "Monte vite pour recevoir la remise de l'attaquant.",
      AG: "Sprint vers le but adverse, puis va au 2e poteau.",
      AD: "Sprint le long de la ligne pour recevoir dans ta course.",
      AT: "Viens chercher le ballon, remets-le, puis repars vers le but."
    },
    etapes: [
      { txt: "Le milieu défensif récupère le ballon devant notre surface. L'adversaire était monté attaquer : il y a de la place derrière lui.", b: "MD",
        n: { GB: [8, 32], DG: [20, 18], DD: [20, 46], MD: [28, 32], MC: [36, 36], AG: [40, 14], AD: [42, 52], AT: [50, 30] },
        e: [[92, 32], [60, 20], [66, 32], [60, 44], [30, 36], [38, 12], [40, 50], [24, 30]] },
      { txt: "Passe vers l'attaquant qui vient au-devant du ballon. Il joue en pivot, dos au but.", b: "AT",
        n: { GB: [10, 32], DG: [22, 18], DD: [22, 46], MD: [30, 32], MC: [42, 38], AG: [46, 10], AD: [48, 54], AT: [46, 32] },
        e: [[92, 32], [60, 22], [56, 32], [60, 44], [32, 36], [44, 12], [46, 52], [24, 22]],
        f: {
          AT: "Viens vers le ballon pour le recevoir. Protège-le avec ton corps : un copain arrive.",
          MC: "Monte vite pour être face à l'attaquant : il va te remettre le ballon.",
          AD: "Pars en sprint le long de la ligne !"
        } },
      { txt: "L'attaquant remet le ballon au milieu, qui arrive face au jeu.", b: "MC",
        n: { GB: [12, 32], DG: [24, 18], DD: [24, 46], MD: [32, 32], MC: [46, 40], AG: [52, 8], AD: [56, 56], AT: [48, 30] },
        e: [[92, 32], [60, 22], [54, 32], [58, 44], [36, 36], [44, 14], [46, 50], [30, 30]],
        f: {
          MC: "Tu es face au jeu : lève la tête et cherche l'ailier lancé dans le dos des défenseurs.",
          AT: "Après ta remise, repars tout de suite vers le but !"
        } },
      { txt: "Grande passe dans la course de l'ailier droit.", b: "AD",
        n: { GB: [14, 32], DG: [26, 18], DD: [26, 46], MD: [34, 32], MC: [48, 36], AG: [62, 12], AD: [68, 56], AT: [60, 30] },
        e: [[92, 32], [66, 20], [64, 32], [62, 46], [40, 36], [46, 14], [48, 50], [34, 30]],
        f: {
          AD: "Contrôle vers l'avant, sans ralentir. Regarde qui arrive dans la surface.",
          AG: "Ballon de l'autre côté : fonce vers le 2e poteau.",
          AT: "File vers le premier poteau."
        } },
      { txt: "Centre ! L'attaquant au 1er poteau, l'ailier gauche au 2e poteau : 2 contre 2 dans la surface.", b: "AG",
        n: { GB: [16, 32], DG: [28, 18], DD: [28, 46], MD: [38, 32], MC: [60, 36], AG: [84, 24], AD: [80, 54], AT: [84, 34] },
        e: [[94, 30], [76, 22], [80, 34], [74, 48], [46, 36], [52, 16], [54, 50], [40, 30]],
        f: {
          AG: "Arrive lancé au 2e poteau et frappe du premier coup.",
          MD: "Reste derrière pour la sécurité si on perd le ballon."
        } }
    ]
  },
  // -------------------------------------------------------------------
  {
    titre: "Terrain libre : place les joueurs",
    cle: "Déplace tes joueurs : la meilleure passe se recalcule toute seule.",
    roles: {
      GB: "Déplace-toi pour toujours offrir une ligne de passe libre.",
      DG: "Cherche l'endroit où aucun adversaire ne coupe la passe.",
      DD: "Cherche l'endroit où aucun adversaire ne coupe la passe.",
      MD: "Cherche l'endroit où aucun adversaire ne coupe la passe.",
      MC: "Cherche l'endroit où aucun adversaire ne coupe la passe.",
      AG: "Cherche l'endroit où aucun adversaire ne coupe la passe.",
      AD: "Cherche l'endroit où aucun adversaire ne coupe la passe.",
      AT: "Cherche l'endroit où aucun adversaire ne coupe la passe."
    },
    etapes: [
      { txt: "Glisse les joueurs avec la souris (ou le doigt). Choisis qui a le ballon dans le menu du haut (« Ballon à »). Les lignes vertes = bonnes passes, orange = possibles, rouges = dangereuses.", b: "DD",
        n: { GB: [5, 32], DG: [18, 10], DD: [18, 54], MD: [16, 32], MC: [32, 30], AG: [46, 6], AD: [44, 58], AT: [60, 32] },
        e: [[96, 32], [76, 18], [80, 32], [76, 46], [50, 32], [40, 14], [28, 52], [24, 42]] }
    ]
  },
  // -------------------------------------------------------------------
  {
    titre: "Dégagement du gardien (6 m)",
    cle: "Les adversaires attendent derrière la ligne : profite de la zone protégée pour relancer court et proprement.",
    roles: {
      GB: "Prends ton temps : les adversaires ne peuvent pas entrer dans la zone. Cherche le défenseur le plus libre.",
      DG: "Écarte-toi au bord de la zone, près de la ligne de touche : tu es la première solution.",
      DD: "Écarte-toi au bord de la zone, près de la ligne de touche : tu es la première solution.",
      MD: "Redescends dans la zone, au centre, pour offrir une passe courte au gardien.",
      MC: "Place-toi entre les adversaires, juste derrière la ligne, prêt à recevoir la 2e passe.",
      AG: "Reste large et haut pour écarter le bloc adverse.",
      AD: "Reste large et haut pour écarter le bloc adverse.",
      AT: "Monte le plus haut possible pour pousser leurs défenseurs à reculer."
    },
    etapes: [
      { txt: "Dégagement aux 6 mètres. Tant que notre gardien n'a pas joué, les adversaires doivent rester derrière la ligne pointillée. Place tes joueurs, puis double-clique sur un coéquipier pour relancer.", b: "GB", relance: true,
        n: { GB: [4, 32], DG: [15, 6], DD: [15, 58], MD: [13, 32], MC: [28, 30], AG: [44, 6], AD: [44, 58], AT: [60, 32] },
        e: [[95, 32], [72, 20], [76, 32], [72, 44], [36, 32], [24, 12], [24, 52], [22, 32]] }
    ]
  },

  // -------------------------------------------------------------------
  {
    titre: "Balle au centre : on engage",
    cle: "Après un but, on engage : chacun dans sa moitié. Garde le ballon, ne le donne pas tout de suite à l'adversaire !",
    roles: {
      GB: "Reste dans ton but, prêt à recevoir une passe en retrait.",
      DG: "Reste large dans ta moitié pour ouvrir le terrain.",
      DD: "Reste large dans ta moitié pour ouvrir le terrain.",
      MD: "Place-toi derrière le ballon : tu es la passe sûre de l'engagement.",
      MC: "Mets-toi à côté du ballon pour engager avec l'attaquant.",
      AG: "Large et haut, sur la ligne médiane, prêt à partir dès que le ballon bouge.",
      AD: "Large et haut, sur la ligne médiane, prêt à partir dès que le ballon bouge.",
      AT: "Tu engages : une passe courte et sûre, puis va vite te placer devant."
    },
    etapes: [
      { txt: "Balle au centre après un but : c'est nous qui engageons. Chaque équipe est dans sa moitié et les adversaires restent hors du rond central. Double-clique sur un coéquipier pour engager.", b: "AT", engagement: "nous",
        n: { GB: [5, 32], DG: [30, 12], DD: [30, 52], MD: [40, 32], MC: [46, 38], AG: [47, 6], AD: [47, 58], AT: [49.5, 32] },
        e: [[95, 32], [74, 20], [78, 32], [74, 44], [62, 32], [56, 14], [56, 50], [58, 26]] }
    ]
  },

  // -------------------------------------------------------------------
  {
    titre: "Balle au centre : l'adversaire engage",
    cle: "L'adversaire engage : reste dans ta moitié et hors du rond, puis presse dès que le ballon bouge.",
    roles: {
      GB: "Place-toi et parle à tes défenseurs.",
      DG: "Reste dans ta moitié, bien placé entre ton adversaire et le but.",
      DD: "Reste dans ta moitié, bien placé entre ton adversaire et le but.",
      MD: "Protège le centre, devant tes défenseurs.",
      MC: "Juste au bord du rond, prêt à presser dès que le ballon bouge.",
      AG: "Sur la ligne médiane, prêt à fermer ton côté.",
      AD: "Sur la ligne médiane, prêt à fermer ton côté.",
      AT: "Au bord du rond, prêt à presser le premier adversaire qui reçoit."
    },
    etapes: [
      { txt: "Balle au centre : c'est l'adversaire qui engage. Tes joueurs restent dans leur moitié et hors du rond central. Double-clique sur un adversaire pour qu'il engage.", b: "e7", engagement: "eux",
        n: { GB: [5, 32], DG: [24, 18], DD: [24, 46], MD: [34, 32], MC: [42, 38], AG: [44, 10], AD: [44, 54], AT: [42, 26] },
        e: [[95, 32], [72, 20], [76, 32], [72, 44], [58, 36], [52, 10], [52, 54], [50.5, 32]] }
    ]
  },

  // -------------------------------------------------------------------
  // Calculée automatiquement d'après les systèmes choisis dans le menu du haut
  {
    titre: "Placement officiel des systèmes",
    cle: "Le placement de base de chaque système, sur toute la longueur du terrain. Change de système dans le menu du haut.",
    roles: {},
    etapes: []
  }
];

// Les situations 1 à 6 sont écrites pour notre système
SITUATIONS.slice(0, 6).forEach(s => { s.ecrite = true; });
