# FEC CHECKER — résumé complet du projet (au 21/10/2026)

## 1. Objectif
Outil « Contrôle FEC » pour les consultants qui importent des FEC clients dans Odoo (module `l10n_fr_fec_import`, Odoo 20). Il doit :
- dire si le fichier respecte les **exigences fiscales** (arrêté du 29/07/2013, art. A47 A-1 du LPF, testeur officiel DGFiP) ;
- dire s'il **passera dans Odoo**, sinon pourquoi et comment corriger, avec un temps estimé ;
- proposer un **fichier de reprise** (jamais un FEC) et, si le FEC est trop abîmé, une **balance d'ouverture** ;
- ne rien laisser au hasard : chaque règle Odoo est vérifiée par un import réel.

## 2. Où sont les choses
- **Dépôt GitHub (public)** : https://github.com/haurujenkins/fec-checker. Le dernier commit est 6c2fe7c.
  - `index.html` : la page complète, autonome, qui fonctionne hors ligne. Aucune donnée ne sort du poste.
  - `README.md` : mode d'emploi.
  - `docs/constats_import_odoo.md` : journal de tous les tests Odoo et leurs résultats. C'est la source de vérité des règles.
  - `docs/resume_projet.md` : ce fichier.
  - `tests/run.js` : lance la logique de la page sur des fichiers, sans navigateur. Usage : `npm i xlsx@0.18.5 && node tests/run.js fichier.txt`.
  - `tests/bench_dataset.js` et `tests/bench_measure.py` : banc d'essai sur les 400 paires. Usage : `node tests/bench_dataset.js "chemin/fichiers FECS"`, puis `python3 tests/bench_measure.py`.
  - `tests/gen_editeurs.py`, `tests/gen_variantes.py`, `tests/fixtures/` : FEC fictifs imitant Sage 100, EBP, Pennylane, Quadra, Coala, un Excel retouché, etc.
- **Artifact claude.ai** « Contrôle FEC » (privé, version 18) : https://claude.ai/artifact/7C65uX5PTtUaNcDK1nkZtq. Capability `downloads` activée pour les téléchargements. La source de l'artifact est la même page que `index.html`, sans l'enveloppe `<html>/<head>/<body>`.
- **Poste de l'utilisateur** (`/home/odoo/Documents/FEC`) :
  - `fichiers FECS/` : jeu de test de 400 paires. Il contient `index.csv`, `01_fec_corrects`, `02_fec_erreurs` et `03_reference_erreurs` (une fiche JSON par paire avec les erreurs injectées : 52 codes C01…C29 et F01…F32).
  - `fichiers_FECS.zip`, `Anciens Fichiers/`, `Contrôle FEC.html`.
- **Base Odoo de test** : https://magasin-mcp.odoo.com. Tous les droits sur cette base uniquement.
  - Société 1 : magasin-mcp. Ne pas toucher à ses données.
  - Société 2 : [société retirée]. Ne jamais toucher.
  - Société 3 : **« Banc FEC (test) »**. Créée pour les tests, laissée vide : 0 pièce, plan comptable FR chargé. À réutiliser pour les prochains tests, ou à supprimer si l'utilisateur le souhaite.
  - Module `l10n_fr_fec_import` : désinstallé après chaque campagne. Le réinstaller pour tester.
- **Contraintes permanentes** :
  - aucune donnée client dans le dépôt public (l'historique a déjà été réécrit une fois pour purger des données réelles) ;
  - économiser l'usage ;
  - les commits sont signés par Claude (noreply@anthropic.com).

## 3. Ce que fait la page (vue par défaut minimale, détail à la demande)
1. **Verdict pour l'import dans Odoo**. Quatre niveaux :
   - Importable tel quel ;
   - Importable avec le fichier de reprise ;
   - À corriger avant import ;
   - FEC déconseillé en l'état.

   Le verdict donne un temps estimé et ajoute « + délai du client » si la correction dépend du logiciel d'origine.
2. **Exigences fiscales**, nouveau bandeau repliable : « Accepté » ou « Refusé par le testeur officiel DGFiP ». Il liste les motifs avec les lignes, les alertes non bloquantes et les « écarts à l'arrêté que le testeur ne contrôle pas ».
3. **À régler** : au plus 6 points décisifs, étiquetés par endroit où agir (à la source, dans Odoo avant, dans Odoo après), avec un temps estimé pour chacun.
4. **Fichiers à télécharger** : fichier de reprise, table de correspondance, balance d'ouverture et tiers.
5. **Détail** (replié) : plan d'action, explication de chaque point (pourquoi, comment, où), contrôles réussis, tableau de contrôle après import (totaux par journal) et mode d'emploi complet de l'import FEC dans Odoo.
6. **Copier le rapport** : rapport texte, qui inclut le verdict fiscal.
7. **Exports Odoo en option** : on peut déposer les exports du plan comptable (actifs et inactifs) et des journaux de la base cible pour contrôler contre la vraie base. Sans eux, la page contrôle contre le plan comptable Odoo 20 FR par défaut.
8. **Plusieurs exercices** : contrôle croisé (à-nouveaux en double, numéros communs, chevauchement) et ordre d'import conseillé.

## 4. Cadre légal retenu (important, demandé par l'utilisateur)
- Le **fichier de reprise n'est pas un FEC**. Seul le fichier du logiciel du client a valeur légale (art. L47 A du LPF). Il doit être conservé tel quel 6 ans (L102 B du LPF) et 10 ans (L123-22 du Code de commerce), et ne doit jamais être remis à l'administration. Un FEC non conforme expose à l'amende de l'art. 1729 D du CGI.
- Le fichier de reprise **ne change jamais** un montant, un sens, une date d'écriture ou une devise, et n'ajoute ni ne retire aucune ligne de données. Deux natures de modifications seulement :
  - `fmt`, écriture technique de la même valeur : encodage, séparateur, en-tête, guillemets, espaces, virgule décimale, dates AAAAMMJJ, Montant/Sens → Débit/Crédit, séparateur parasite dans un libellé remplacé par une espace, lignes vides et en-têtes répétés retirés ;
  - `map`, correspondances de reprise listées ligne à ligne (codes de compte, tiers rangés dans CompteNum, code journal en collision, numéros d'écriture reconstituables, libellés vides). Elles doivent être validées par l'expert-comptable : une case à cocher est obligatoire avant le téléchargement.
- **Contrôle d'intégrité au centime** (nombre de lignes, total débit, total crédit) : s'il échoue, le fichier est bloqué. Le fichier de reprise est réanalysé et la page affiche ce qui reste.
- **Balance d'ouverture** : elle doit reprendre exactement la balance de clôture validée. Les clients et fournisseurs sont repris pièce par pièce (avec échéance) quand le lettrage existe ; les charges et produits vont au résultat (120/129). Si elle est déséquilibrée, la page le signale.

## 5. Règles vérifiées dans Odoo 20 (extraits clés ; tout est dans `constats_import_odoo.md`)
- **Lecteur JS d'Odoo** :
  - encodage UTF-8 après un BOM, sinon UTF-8 strict, sinon ISO-8859-15 ;
  - séparateur tabulation ou `|` uniquement ;
  - champs nettoyés de leurs espaces et guillemets ;
  - une ligne avec moins de champs que l'en-tête est refusée ; une ligne avec plus de champs est acceptée, mais les colonnes sont décalées ;
  - le nom de pièce vient d'EcritureNum, sinon de PieceRef ;
  - les colonnes sont lues **par leur nom**, en respectant la casse ;
  - les données partent au serveur par paquets de 1000 lignes ; les écritures déséquilibrées sont regroupées par mois.
- **Import non atomique** : en cas d'erreur, les paquets déjà traités restent dans Odoo (jusqu'à 724 pièces observées). Il faut tout supprimer avant de relancer.
- **Corruption silencieuse** : si Idevise = EUR et que Montantdevise diffère du débit/crédit, Odoo importe le montant de Montantdevise.
- **Comptes créés archivés** quand un voisin est archivé : il faut les désarchiver **après** l'import (désarchiver le parent avant ne sert à rien).
- **Type de journal deviné** : au moins 3 écritures et au moins 70 % de lignes sur 41x (ventes), 40x (achats) ou 512/53 (banque) ; sinon le journal est créé en « divers ».
- **Codes journal en variantes** (vte/VTE, B/BQ) : les écritures sont coupées et Odoo répond « Soldes incorrects ».
- **Messages d'erreur d'Odoo et leur cause** :

  | Message d'Odoo | Cause |
  |---|---|
  | « account non trouvé » | CompteNum absente ou mal nommée, ou ligne vide au milieu du fichier |
  | « journal non trouvé » | JournalCode absente, mal nommée ou vide |
  | « could not convert string to float » | colonnes décalées par un séparateur dans un libellé, ou séparateur de milliers |
  | « time data … does not match » | en-tête répété, date JJ/MM/AAAA ou mois 00 |
  | « day 30 must be in range » | 30 février |
  | « unconverted data remains » | mois 13 |
  | « Soldes incorrects » | écriture déséquilibrée |
  | « n'a pas de nom de pièce valide » | ligne écrite avec un autre séparateur, ou casse de l'en-tête différente |
- **Passent dans Odoo alors que la DGFiP refuse** :
  - ValidDate, DateLet, CompAuxLib ou Idevise absente ou mal nommée ;
  - colonnes dans le désordre ;
  - point décimal ;
  - colonnes en trop.
- **Autres comportements observés** : un Montantdevise non signé sur un crédit reste un crédit ; un lettrage sur un compte de charge est gardé, mais rien n'est lettré.

## 6. Testeur officiel DGFiP porté dans la page
Source : Test Compta Démat 1.00.10b, code Perl (`trt_txt.pl`, `trt_entete.pl`, `FECCOM.sql`). Il ne tourne pas sans interface (Tk et PostgreSQL), d'où le portage dans la fonction `dgfipTester()`.
- **Préparation des lignes, comme le testeur** : espaces insécables convertis en espaces ; espaces autour des séparateurs et en fin de ligne retirés ; en-tête comparé sans casse ni accents.
- **Refus** :
  - un des 18 champs de l'en-tête absent ;
  - nombre de champs différent de l'en-tête ;
  - champ obligatoire vide (JournalCode, EcritureNum, EcritureDate, CompteNum, CompteLib, EcritureLib, ValidDate) ;
  - point dans un montant ; séparateur de milliers ; montant non numérique ;
  - date hors des formats AAAAMMJJ ou JJMMAAAA (séparateurs `/ - .` et heure tolérés) ;
  - mois > 12 ou jour > 31 ;
  - fichier Excel.
- **Alertes** : compte ne commençant pas par 3 chiffres ; débit et crédit sur une même ligne, ou tous deux nuls ; année hors 1900-2099.
- **Non contrôlé par le testeur, signalé par la page en « écart à l'arrêté »** : nom de fichier SIRENFECAAAAMMJJ, séparateur autre que tabulation ou `|`, date au format autre que AAAAMMJJ, date inexistante (30 février, mois 00). L'équilibre des écritures n'est pas contrôlé par le testeur ; la page le contrôle côté Odoo.
- Une ligne vide est signalée par le testeur, sans blocage.

## 7. Campagnes de test réalisées
1. Imports réels successifs sur magasin-mcp : FEC du test de bout en bout, mini-FEC, plusieurs exercices, profils d'éditeurs. 31 fichiers, tous conformes aux prédictions.
2. **Banc des 400 paires** (17 styles d'export, 1 567 erreurs injectées) :
   - 400 / 400 FEC corrects « Importable tel quel » ;
   - 1 546 / 1 567 erreurs détectées (98,7 %) ; les écarts restants sont surtout des numéros de ligne décalés dans la mesure ;
   - aucun plantage.
3. **21/10 : 165 FEC importés dans la société vierge 3** (26 corrects, 139 erronés, environ 3 par code d'erreur), comparés au verdict de la page :
   - 43 / 43 fichiers annoncés bloquants ont échoué dans Odoo ;
   - 0 fichier annoncé importable n'a échoué ;
   - les 26 corrects sont passés au centime ;
   - 2 / 2 corruptions silencieuses annoncées sont confirmées ;
   - 29 fichiers annoncés « fausse les données » ont été importés sans erreur. Ce sont des défauts comptables de la source (doublons, à-nouveaux mal datés, comptes non numériques, encodage mixte), qu'Odoo importe tels quels : le verdict est juste.
   - **Fichiers de reprise réimportés** : les 15 jugés « importables avec le fichier de reprise » sont tous passés, totaux identiques. Ceux jugés « à corriger à la source » ont de nouveau échoué.

## 8. Améliorations faites ce jour suite aux tests
- Verdict fiscal fidèle au testeur DGFiP, plus les écarts à l'arrêté. Les 26 FEC corrects sont acceptés.
- Colonnes lues par leur nom, comme Odoo. Avant, un en-tête à 17 colonnes faisait lire les montants au mauvais endroit.
- Colonne absente sans effet sur Odoo classée « norme DGFiP seulement », au lieu de « bloque ».
- Séparateur dans un libellé : la page retrouve le seul libellé possible et le fichier de reprise remplace le séparateur par une espace. Avant, ce cas produisait 5 fausses erreurs et un verdict « déconseillé, 1 h 44 ».
- Lignes écrites avec un autre séparateur : elles sont redécoupées dans le fichier de reprise.
- En-tête répété au milieu du fichier : signalé une seule fois, retiré du fichier de reprise. Vérifié dans Odoo sur 3 fichiers.
- Message « ligne vide » mis à jour avec l'erreur serveur réelle.

## 9. Pistes pour la suite
- **Points ouverts** :
  - Les codes d'erreur C03 (rupture de chronologie), C06, C20, F14, F16 et F30 ont quelques non-détections au banc, à vérifier une par une.
  - Les F04 avec JournalCode mal nommée (exemple : en-tête « Journal ») ne peuvent pas avoir de fichier de reprise aujourd'hui. On pourrait proposer un renommage d'en-tête validé par l'utilisateur.
  - Le verdict « À corriger » est prudent quand Montantdevise est présent sans Idevise : Odoo a importé correctement le fichier E_P0037. Ce point est à confirmer sur plus de cas.
- **Possible** : tester l'import du fichier de reprise directement depuis la page via le bouton Importer d'Odoo (UI), et pas seulement par RPC.
- **Possible** : variante XML du FEC (non gérée), FEC BNC/BA en comptabilité de trésorerie (variante Montant/Sens, déjà lue).
- **Méthode de test Odoo réutilisable**, à lancer dans un onglet Chrome connecté à la base :
  - charger le lecteur avec `odoo.loader.modules.get('@l10n_fr_fec_import/hooks/fec_parser_hook').useFECParser().parse({size, data: base64})` ;
  - créer l'assistant avec `account.fec.import.wizard` → `create` (`company_id: 3`), puis appeler `process_chunk` pour chaque paquet, via `/web/dataset/call_kw` avec le contexte `allowed_company_ids: [3]` ;
  - comparer les totaux du fichier avec les lignes créées ;
  - entre deux fichiers, tout supprimer dans la société 3 ;
  - à la fin, désinstaller le module.
