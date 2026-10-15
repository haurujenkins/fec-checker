# Constats import FEC dans Odoo (base test base-test, Odoo 20 saas) — 15/10/2026

Fichier testé : FEC_2025_Client_A.txt (12 000 lignes environ, tabulation, UTF-8, CRLF)

## Accès à l'import
- Module `l10n_fr_fec_import` à installer (Apps → "FEC Import"). Aucune entrée de menu visible après install.
- Assistant accessible via l'action serveur `fec_import_action` : URL `/odoo/action-<id>` (ici 1031), ou `/odoo/account.fec.import.wizard/new` (mais sans bouton Importer).
- L'import standard (Pièces comptables → Importer) refuse le .txt : « Format text/plain non pris en charge ».
- Options : préfixe document, doublons = Ignorer / Mettre à jour.

## Erreur 1 — guillemets dans un champ
- Message Odoo : « Certaines lignes n'ont pas le même nombre de champs que l'en-tête. Veuillez vérifier les numéros de ligne suivants : 140, 152, … »
- Cause : un `"` à l'intérieur d'un champ (ex. CompteLib `Achat  " exemple "`). Testé : `Achat "exemple` (un seul) → rejet ; `"exemple"` (champ entièrement entre guillemets) → accepté (guillemets retirés). Apostrophe OK.
- Le testeur DGFiP et Python csv acceptent ces lignes : c'est propre à Odoo (parseur csv strict).
- Remède : demander un nouvel export sans guillemets, ou retirer les `"` des libellés (pas de valeur comptable).
- Règle page : **Bloquant Odoo** « Guillemet dans un champ » avec numéros de ligne.

## Erreur 2 — compte archivé dans le PCG Odoo
- Message : « Account codes must be unique. You can't create accounts with these duplicate codes: 609100 »
- Cause : 609100 existe dans le plan comptable FR d'Odoo mais **archivé**. L'import ne cherche que les comptes actifs, tente de créer → contrainte d'unicité.
- Comptes archivés par défaut (PCG Odoo 20) : 215110,215140,215310,215340,267100,267400,267500,267600,267700,267800,268100,268800,276820,276840,276850,276880,280810,281870,290810,291870,608000,608200,609100,609200,609400,609500,609600,609700,649000
- Remède : désarchiver ces comptes AVANT l'import (Plan comptable → filtre Archivé → sélectionner → Désarchiver).
- Règle page : **Bloquant Odoo** « Compte présent mais archivé dans le PCG Odoo » (liste codée en dur, à vérifier par version).

## Constat 3 — l'import commit par lots
- Après l'erreur 2, 60 écritures, 12 journaux, 70 comptes, 200 partenaires étaient déjà en base. L'import n'est PAS atomique.
- Conséquence : toujours tester sur un staging / faire un backup ; après échec, relancer avec « Mettre à jour » pour les doublons.

## Constat 4 — types de journaux devinés
- ACH « Achats » → créé en type **general** (pas purchase). VTE « Ventes » → sale. BQx → bank. AN/OD/autres → general.
- À corriger après import (type achat/vente nécessaire pour les factures).

## À vérifier ensuite (après désarchivage)
- JournalCode `OD ` avec espace final vs `OD`.
- EcritureNum repartant à 1 dans chaque journal.
- PieceDate 19000101 (lignes INV/OD avec PieceRef [NS]).
- EcritureLet sans DateLet.
- Écriture de plus de 300 lignes.

## Erreur 5 — compte créé archivé (dérivé de l'erreur 2)
- À la comptabilisation : « Le compte Remboursement sur charges sociales (649500) est archivé. »
- Cause : pour un code inconnu, Odoo copie le compte existant du PCG ayant le plus long préfixe commun (égalité → le plus petit code) pour en déduire le type ; si ce « parent » est archivé (608000, 649000, 2151x, 267x…), le compte créé hérite de active=False.
- Vérifié : 608100 ← 608000, 649500 ← 649000. Heuristique « plus long préfixe commun » reproduit exactement.
- Remède : désarchiver les comptes parents AVANT l'import, ou désarchiver les comptes créés après.

## Erreur 6 — « Mettre à jour » duplique les lignes
- Après un import partiel (60 écritures commitées), relancer le même fichier avec l'option doublons = « Mettre à jour » AJOUTE les lignes aux écritures existantes au lieu de les remplacer : écriture AN 300 lignes → 600 lignes, 120 comptes avec montants doublés.
- Remède : après un échec partiel, SUPPRIMER les écritures importées (ou restaurer le backup) avant de relancer ; ne jamais compter sur « Mettre à jour ». Ou relancer avec « Ignorer » (non testé).

## Constat 7 — import et comptabilisation
- Les écritures arrivent en brouillon ; comptabilisation par lots via action_post OK (5 300 pièces) une fois les comptes désarchivés.
- Nom de pièce = EcritureNum brut (« 1 », « 224 ») : unique par journal, mais illisible ; prévoir le préfixe document de l'assistant.
- Les écritures du journal FEC « INV » (inventaire) ont été rattachées au journal Ventes « INV » d'Odoo (collision de code) : 30 pièces d'inventaire dans le journal de ventes.
- `OD ` (espace final) fusionné avec `OD` : Odoo trim les codes. JournalLib préfixé « FEC-».
- Journaux créés : type deviné d'après ??? — ACH → general. Tous les journaux inconnus → general sauf ceux contenant une banque ? (BQx → bank, VTE → sale).
- Partenaires : 1 par CompAuxNum (ref = CompAuxNum), 392 créés ; tous les 401/411 ont un tiers.
- Lettrage : matching_number repris (6 000 lignes environ) mais aucun full_reconcile → balances âgées à reconstituer.
- Types de comptes créés : déduits du voisin PCG (64x → expense_other, etc.), globalement corrects.

## Résultat final (import propre, 15/10 10:15)
- Base vidée (button_draft + unlink en lots), fichier v2 (guillemets retirés), comptes 608100/608200/609100/649500 désarchivés avant import.
- 5 300 écritures importées, balance Odoo = balance du fichier au centime sur les 220 comptes, 5 300 pièces comptabilisées sans erreur.
- Reste à faire côté projet (non bloquant) : types de journaux (ACH en « divers »), journal INV d'inventaire dans le journal de ventes, lettrage à reconstituer, noms de pièces bruts.

## Règles intégrées à la page Contrôle FEC (v4)
- Bloquant Odoo : guillemet dans un champ ; compte archivé du PCG Odoo ; compte créé archivé (parent PCG archivé) ; code journal = journal Odoo par défaut de type différent ; codes de compte hétérogènes ; écritures futures.
- À vérifier : espaces en bordure JournalCode/EcritureNum/CompteNum ; PieceDate < 1950 ; ValidDate < EcritureDate ; lettrage sans date.
- Info : comptes à créer (liste), EcritureNum par journal, import non atomique + « Mettre à jour » duplique, devises, journaux repris d'Odoo.
- Section « Avant d'importer dans Odoo » (checklist en 6 étapes).

## Erreur 8 — import de plusieurs exercices (test 2024 + 2025, mini-FEC)
- Sans préfixe : l'AN 2025 (journal AN, n° 1) est FUSIONNÉ dans l'AN 2024 (même journal + même EcritureNum → « Mettre à jour » ajoute les lignes et déplace la date). 4 pièces au lieu de 5. Tout numéro repris d'un exercice à l'autre dans le même journal fusionne (ex. VEN/1 2024 et VEN/1 2025).
  → Remède : saisir un préfixe de document différent par exercice dans l'assistant (ex. « 2024 », « 2025 »). Vérifié : 5 pièces, noms « 2024 1 », « 2025 1 ».
- Même avec préfixe : les à-nouveaux de N+1 recomptent les soldes de bilan de N déjà présents (mouvements de N + AN de N). Résultat : capital ×2, banque 22 400 au lieu de 11 200, TVA ×2 ; résultat de N compté deux fois (120000 de l'AN + report automatique des 6/7 de N par Odoo).
  → Remède : n'importer le journal AN que pour le PREMIER exercice importé ; retirer les lignes AN des fichiers suivants (l'assistant n'a pas d'option d'exclusion de journal). Ou n'importer que le dernier exercice. Dans Odoo, le résultat de N est reporté automatiquement (compte de résultat non distribué), ne pas importer un 120/129 d'ouverture en plus.
- Règles page : Bloquant Odoo « Journal AN présent : à retirer si un exercice antérieur est importé » + mode multi-fichiers : collisions (journal, numéro) entre fichiers, AN présent dans un fichier non initial.

## Leçons des fichiers « bons pour import » (15/10 10:30)
- CLIENT-A nettoyé par un collègue : seuls les guillemets ont été retirés. Le vérificateur signale encore 608200/609100 (archivés), 608100/649500 (seront créés archivés), journal INV → ventes, « OD  » avec espace : l'import aurait échoué puis la comptabilisation aussi.
- Export Odoo 999999990 : identique au fichier déjà testé ; sur une base neuve, 608000 archivé bloquerait.
- Conclusion : le « bon pour import » à l'œil ne suffit pas ; passer systématiquement par la page.

## Page Contrôle FEC v5
- Mode multi-fichiers : déposer plusieurs exercices → contrôle croisé (AN dans un exercice non initial, numéros de pièces communs, chevauchement de périodes, SIREN différents) + ordre d'import conseillé.
- Mono-fichier : avertissement « journal d'à-nouveaux présent » avec la consigne.
- Checklist « Avant d'importer » complétée (multi-exercices : AN du premier seulement, préfixe par exercice).

## Batterie serveur 1 (process_chunk par RPC, 43 cas, 15/10 10:45)
Architecture : le parsing du fichier est fait par le JS du navigateur ; le serveur reçoit `process_chunk(header, rows)` (valeurs brutes, montants à la virgule). Les règles de structure (encodage, séparateur, guillemets, nb de champs) sont côté client, les règles de valeurs côté serveur.

| Cas | Valeur | Réaction Odoo |
|---|---|---|
| S01 point décimal 35.46 | **accepté** (35,46) — Odoo tolère le point, pas la DGFiP |
| S02 séparateur de milliers « 1 035,46 » | ERREUR could not convert string to float |
| S03 montant négatif -35,46 au débit | **accepté silencieusement, inversé** en crédit 35,46 |
| S05/S06 date 2025-01-07, 07/01/2025 | ERREUR time data does not match format %Y%m%d |
| S07 date 20251345 | ERREUR unconverted data remains |
| S43 date 20250107T10:00:00 | ERREUR |
| S08 EcritureDate vide | **accepté**, date de pièce = PieceDate/ValidDate |
| S09 ValidDate vide | accepté (non conforme DGFiP) |
| S10 EcritureNum vide | **accepté**, pièce nommée « préfixe PieceRef » (P1) |
| S11 CompteNum vide | ERREUR « account non trouvé » |
| S17 JournalCode vide | ERREUR « journal non trouvé » |
| S12 CompteNum 6012 (4 car.) | mappé sur 601200 (complété par des zéros) |
| S13 60120000 / S32 601200000 | mappés sur 601200 (zéros finaux retirés) |
| S14 601A00 / S34 A12345 | **compte créé tel quel** (pas de contrôle 3 chiffres) |
| S15 CompteLib vide, S24 EcritureLib vide, S29 JournalLib vide, S18 PieceRef+PieceDate vides | acceptés |
| S16 écriture déséquilibrée | ERREUR « Soldes incorrects… solde de 5.46 » |
| S19 Montantdevise sans Idevise | accepté, ignoré |
| S20 Idevise XYZ (inconnue) | **accepté silencieusement**, devise EUR, Montantdevise ignoré |
| S35 Idevise EUR + Montantdevise 99 ≠ Débit 35,46 | **CORRUPTION : la ligne est importée à 99,00** (Odoo prend Montantdevise comme montant) |
| S21 401 sans CompAuxNum | accepté sans partenaire |
| S22 CompAuxNum sans CompAuxLib | accepté, partenaire créé |
| S23 date future 2027 | accepté |
| S25 EcritureLet sans DateLet | accepté, matching partiel |
| S26 ligne 0/0 | acceptée (ligne à zéro) |
| S27 CompteNum « 601200 » avec espaces | ERREUR « account code can only contain alphanumeric characters, dots, and dashes » (CompteNum NON trimé, contrairement à JournalCode) |
| S28 libellé 300 car., S33 montant 999 999 999 999,99, S38 JournalCode 10 car. | acceptés (journal créé avec code long) |
| S30 Credit vide, S42 espaces autour des montants, S31 3 décimales | acceptés (arrondi 2 déc.) |
| S36 PieceDate 19000101 | accepté |
| S37 CompAuxNum sur compte 6 | accepté, partenaire sur la ligne |
| S39 même EcritureNum dans 2 journaux | 2 pièces distinctes (clé journal+num) |
| S40 lettrage AB + DateLet | matching_number repris |

## Batterie serveur 2 (22 cas)
| Cas | Réaction Odoo |
|---|---|
| T04 Débit 35,46 ET Crédit 10,00 sur une même ligne | **accepté, compensé** (ligne à 25,46) |
| T44 60120001 (8 car. sans zéros finaux) / T65 6012001 / T66 601200.1 | comptes créés tels quels (longueur hétérogène) |
| T45 « 601 » | mappé 601000 ; T46 « 4010 » → 401000 |
| T47/T69 Idevise USD (devise inactive) | accepté, EUR silencieux, Montantdevise ignoré |
| T48 « 35 » sans décimales, T58 « +35,46 » | acceptés |
| T49 lignes dupliquées à l'identique | **4 lignes importées** (aucune déduplication) |
| T50 deux EcritureDate dans une même écriture | une pièce à la date de la 1re ligne, l'autre date perdue |
| T51 « 35,46€ » | ERREUR could not convert |
| T53 « ACH » avec espace | fusionné avec ACH (trim) ; T54 EcritureNum « 1 » avec espace → pièce « 1  » distincte (PAS trimé) |
| T56 CompAuxNum existant avec autre libellé | partenaire réutilisé (ref), 1 seul créé sur toute la batterie |
| T57 tous montants vides | pièce à zéro acceptée |
| T67 D = C sur une ligne (net 0) + contrepartie | ERREUR déséquilibre |
| T68 Montantdevise 0,00 EUR | montant conservé (35,46) → la substitution de S35 ne joue que si Montantdevise ≠ 0 |
| T70 609200 (archivé PCG) | ERREUR unique, reconfirmé |

## Batterie 3 — structure, via le bouton Importer (parseur JS d'Odoo), 22 cas
| Cas | Réaction Odoo |
|---|---|
| U01 Latin-1 avec accents / U20 cp1252 | acceptés, accents décodés ; **le « € » (0x80 cp1252) est perdu** silencieusement |
| U02 BOM UTF-8 | accepté (en-tête propre) |
| U03 séparateur « ; » / U04 « , » / U17 .xlsx | REFUS « Les zones doivent être séparées par une tabulation ou par le caractère '|' » |
| U05 LF seul / U16 CR seul / U21 sans retour final | acceptés |
| U06 lignes vides en fin / U07 ligne vide au milieu / U19 en-tête seul | **« Aucune donnée importée » sans erreur** : la ligne vide fait échouer tout le lot silencieusement |
| U08 en-tête en minuscules / U18 UTF-16 | REFUS « La ligne 2 n'a pas de nom de pièce valide » (en-tête sensible à la casse) |
| U09 17 colonnes (sans Idevise) | accepté |
| U10 19 colonnes (colonne en plus) | accepté, colonne ignorée |
| U11 colonnes dans le désordre | accepté (mapping par nom d'en-tête) |
| U12 variante Montant / Sens | **accepté, montants corrects** (Odoo 20) |
| U13 ligne à 17 champs | REFUS « nombre de champs différent de l'en-tête » |
| U14 tabulation dans un champ (fichier |) | accepté |
| U15 espaces autour des noms d'en-tête | accepté (trim) |
| Libellé de compte variable | le dernier libellé rencontré nomme le compte (silencieux) |

## Synthèse : ce qui fait échouer le clic « Importer » (vérifié)
Client : séparateur ≠ tab/|, en-tête non exact (casse), ligne avec nb de champs ≠ en-tête (dont guillemet dans un champ), fichier non texte (xlsx, UTF-16).
Serveur : date hors AAAAMMJJ, montant non numérique (milliers, €), écriture déséquilibrée, CompteNum vide ou avec espaces, JournalCode vide, compte archivé du PCG, compte créé archivé (à la comptabilisation).
Silencieux (le pire) : ligne vide → rien d'importé ; Montantdevise EUR ≠ montant → montant remplacé ; devise inconnue/inactive ignorée ; montant négatif inversé ; débit+crédit compensés ; lignes dupliquées importées deux fois ; dates multiples → première gardée ; EcritureNum vide → PieceRef comme nom (fusion possible) ; « Mettre à jour » qui ajoute les lignes ; AN d'un 2e exercice ; collisions de codes journaux ; € perdu en cp1252.

## Test de bout en bout réel (15/10 12:10–12:40) — export → contrôle → import → comptabilisation → balance
Base remise à neuf (677 comptes PCG, 8 journaux, 0 écriture). Exports réels via l'interface (Plan comptable sans filtre, puis filtre « Comptes inactifs », Journaux), fichiers .xlsx récupérés dans Téléchargements, déposés avec CLIENT-A v3 dans la logique de la page.
- Exports : en-têtes Code / Nom du compte / Type / Lettrage des paiements / Actif (booléen Excel). Odoo ne retient pas le champ Actif d'un export à l'autre. Export journaux : Séquence (n°), Nom du journal, Type, Préfixe de la Séquence (= code), Compte par défaut.
- Base neuve : 649 comptes actifs, 28 inactifs. 608200 N'EXISTE PAS dans le PCG par défaut (créé archivé par le 1er import du matin) → liste par défaut corrigée.
- Prédiction page : 130 comptes créés dont 608100/608200/649500 archivés ; 609100 archivé existant ; INV → journal Ventes ; 14 journaux créés.
- Réel : 130 comptes créés, identiques un à un ; exactement 608100/608200/649500 créés archivés (avec le libellé du FEC) ; 30 pièces INV dans le journal Ventes ; import SANS erreur.
- Comptabilisation : toutes les pièces sans compte signalé validées ; les 180 pièces prévues refusées (environ 120×608200, 50×608100, 7×649500, 3×609100). Après désarchivage des 4 comptes : 5 300 pièces validées.
- Balance : 220 comptes identiques au centime ; contrôle par journal (15 journaux) identique au tableau de la page.
- Nouveau : création de comptes 512500 / 519500 → Odoo crée automatiquement 2 journaux de banque BNK2 / BNK3 (règle ajoutée). Deux journaux FEC peuvent porter le même nom (OD/OD2) : comparer par code.
- Corrigé : l'affirmation « le compte créé prend le libellé du compte source » était fausse (observation faite dans une autre langue).

## FEC provisoire CLIENT-A 2026 (jugé mauvais par un collègue) — 15/10 12:40
Base nettoyée (677 comptes, 28 inactifs, 8 journaux). 8 000 lignes environ, 20260101→20260731.
- Testeur : EcritureNum vide sur 7 800 lignes environ (tout sauf AN) ; 2 000 guillemets environ ; 609100 archivé ; 608100/608200/649500 créés archivés ; 20 lignes en double ; 512500/519500 → journaux banque.
- Import réel n°1 : refus immédiat « Certaines lignes n'ont pas le même nombre de champs… 140, 152, 158, 161… » = liste du testeur.
- Import réel n°2 (guillemets retirés) : « Soldes incorrects… '<pièce du client>' solde X / -X » après 700 écritures déjà enregistrées.
- Cause : sans EcritureNum, Odoo regroupe par journal + PieceRef ; simulation : 2 500 pièces dont 1 000 environ déséquilibrées ; la pièce citée par Odoo (banque +X / autre journal −X) est retrouvée exactement.
- Règle ajoutée (v10) : simulation du regroupement par PieceRef quand EcritureNum est vide → « Pièces déséquilibrées une fois regroupées par PieceRef » (Bloquant Odoo).
- Remède : seul un FEC avec EcritureNum renseigné est importable ; retirer les guillemets ne suffit pas.

## FEC par profil de logiciel et variantes (base de test vidée, 15/10 16:00)
Fichiers synthétiques uniquement (`tests/fixtures/editeurs`, `tests/fixtures/variantes`). Import par l'assistant (profils) ou par `process_chunk` + `import_summary_action` (variantes), puis comptabilisation et balance par compte.
- Sage 100 (`|`, comptes 8 car.), EBP, Pennylane, UTF-8 BOM sans ValidDate : 133 écritures, balance identique au fichier sur les 16 comptes, aucune erreur. ValidDate vide et PieceDate vide acceptées par Odoo.
- Fichier repassé par Excel : erreur serveur `time data '01/01/2025' does not match format '%Y%m%d'`, rien d'importé.
- Cegid Quadra (tiers en 0XXX / 9XXX dans CompteNum) : comptes créés en « Actif circulant », non lettrables, aucun partenaire ; journaux VT / AC créés en Divers.
- Sage Génération Expert / Coala : AN importés au 14/02 ; au 31/01, banque à 896,30 au lieu de 15 146,70 et capital absent.
- Type des journaux créés : déduit du contenu, pas du code ni du libellé. ≥ 3 écritures et environ 2/3 sur 41x → Ventes, 40x → Achats, 512/53 → Banque ; 2 écritures → Divers ; 70 % → Ventes ; 60 % → Divers.
- Un compte 512 créé ouvre BNK2 en plus du journal de banque du FEC : deux journaux bancaires sur le même compte.
- Lettrage : `matching_number` repris ; à la comptabilisation Odoo relettre : lettre soldée → lettrage complet ; non soldée → lettrage partiel (reste dû) ; lettre sur une seule ligne → rien.
- Montants à 3 décimales : arrondis au centime (10,005 → 10,01) ; écriture déséquilibrée après arrondi → « The entry is not balanced ».
- Codes courts : 6064 rattaché à 606400 existant ; 5120 créé tel quel (pas de 512000).
- 401DUPONT : compte Fournisseurs lettrable créé, sans partenaire.
- Même CompAuxNum, libellés différents : premier libellé gardé. CompAuxLib vide : partenaire nommé avec le code. Même JournalCode, libellés différents : dernier libellé gardé.
- Date 20250230 : erreur serveur « day 30 must be in range 1..28 for month 2 ».
- Compte à créer sans CompteLib : « Champ requis manquant 'Nom du compte' ».
- Débit / crédit vides : lus comme 0 ; espaces autour des montants : retirés.
- Règles ajoutées à la page : type prévu des journaux créés et alerte si différent du libellé ; tiers dans CompteNum (0/9 et 401XXX/411XXX) ; codes courts créés tels quels ; compte à créer sans libellé ; montants à plus de 2 décimales (arrondi exact au demi-centime supérieur) ; date inexistante ; lettre isolée et lettrage non soldé ; descriptions « vérifié » pour ValidDate / PieceDate vides, libellés variables.
- Base remise à l'état d'origine : 0 écriture, 677 comptes dont 28 archivés, 8 journaux, 12 partenaires, module désinstallé.
