# fec_checker

Un checker de FEC avant l'import dans Odoo.

Une page web autonome (`index.html`) qui contrôle un Fichier des Écritures Comptables avant de lancer l'assistant d'import FEC d'Odoo (`l10n_fr_fec_import`). Elle reprend les contrôles de Test Compta Démat (DGFiP) et ajoute ceux qui font échouer, ou fausser sans message, l'import dans Odoo. Chaque règle Odoo a été vérifiée par un import réel sur une base Odoo 20 (voir `docs/constats_import_odoo.md`).

**Aucune donnée ne sort du poste** : le fichier est lu et analysé dans le navigateur.

**En ligne : https://haurujenkins.github.io/fec-checker/**

## Utilisation

1. Ouvrir la page en ligne, ou `index.html` en local (téléchargé depuis le dépôt).
2. Déposer le FEC (`.txt` à tabulation ou `|`, ou l'Excel dans lequel il a été collé).
3. Recommandé : déposer avec lui trois exports de la base Odoo cible, pour contrôler contre le plan comptable et les journaux réels du client :
   - Comptabilité → Configuration → Plan comptable → tout sélectionner → Actions → Exporter, avec les champs **Code, Nom du compte, Type, Actif** ;
   - le même export avec le filtre **Comptes inactifs** (Odoo masque les comptes archivés, et ce sont eux qui bloquent ; le champ Actif n'est pas mémorisé d'un export à l'autre) ;
   - Configuration → Journaux → tout sélectionner → Exporter (les champs par défaut suffisent).

   La page reconnaît ces exports toute seule (.xlsx ou .csv, en-têtes français ou techniques). Sans eux, elle contrôle contre le plan comptable par défaut d'Odoo 20 France.
4. Plusieurs exercices : déposer tous les FEC ensemble pour le contrôle croisé (à-nouveaux en double, numéros de pièces communs, chevauchement de périodes).
5. Après l'import : comparer le tableau « Contrôle après import » (par code de journal) avec Comptabilité → Analyse des écritures.

## Hébergement (GitHub Pages)

La page est servie gratuitement par GitHub Pages, directement depuis la branche `main` : aucun build ni workflow. Pour l'activer (une seule fois) :

1. Dans le dépôt GitHub : **Settings → Pages**.
2. *Build and deployment* → *Source* : **Deploy from a branch**.
3. *Branch* : **main**, dossier **/ (root)**, puis **Save**.

Après une minute environ, la page est en ligne sur https://haurujenkins.github.io/fec-checker/. Chaque push sur `main` la met à jour.

Le serveur ne fait que livrer la page : le FEC et les exports Odoo restent dans le navigateur et ne sont jamais envoyés. La page charge seulement la bibliothèque de lecture Excel (cdnjs) et les polices (Google Fonts). Le dépôt étant public, tout ce qui y est versé est aussi publié : n'y mettre aucun fichier client.

## Ce que la page rend

- **Un verdict fiscal** : accepté ou refusé par le testeur officiel de la DGFiP (Test Compta Démat 1.00.10b), dont les contrôles sont repris fidèlement depuis son code source (en-tête, nombre de champs, champs obligatoires, montants, dates, alertes), avec les écarts à l'arrêté que ce testeur ne contrôle pas (nom du fichier, séparateur, dates inexistantes au calendrier).
- **Un verdict pour l'import Odoo** : importable tel quel, importable avec le FEC corrigé, à corriger avant import, ou FEC déconseillé. Avec un temps estimé (indicatif) et le délai client quand une correction dépend du logiciel d'origine.
- **Un parcours en étapes** et les points regroupés par endroit où agir : corrigé automatiquement, dans Odoo avant l'import, à la source, dans Odoo après l'import. Chaque point est expliqué simplement, avec la marche à suivre.
- **Un fichier de reprise pour Odoo** (pas un FEC : le FEC d'origine reste la seule pièce légale, à conserver). Il ne change ni montant, ni sens, ni date d'écriture, ni devise, n'ajoute ni ne retire aucune ligne : seulement l'écriture technique (encodage, séparateur, en-tête, guillemets, espaces, virgule décimale, dates AAAAMMJJ) et des correspondances de reprise listées ligne à ligne (codes de compte, tiers rangés dans CompteNum, code journal en collision, numéros d'écriture reconstituables, libellés vides). Contrôle d'intégrité au centime ; téléchargement soumis à validation des correspondances par l'expert-comptable. Le fichier est réanalysé : la page affiche ce qui reste.
- **Une balance d'ouverture** au format import Odoo (pièce comptable + fichier des tiers, clients et fournisseurs repris pièce par pièce) quand le FEC ne vaut pas la peine d'être corrigé. À faire valider : elle doit reprendre exactement la balance de clôture.

## Ce que la page détecte

- **Bloquant DGFiP** : en-tête, séparateur, nombre de champs, dates, montants (virgule décimale), champs obligatoires vides, écritures déséquilibrées, lignes vides.
- **Bloquant Odoo** (vérifié) : guillemet dans un champ ; compte archivé dans la base ; compte qui sera créé archivé (copié d'un voisin archivé) ; code journal déjà pris par un journal d'un autre type ; pièces déséquilibrées une fois regroupées par PieceRef quand EcritureNum est vide ; Montantdevise en EUR différent du débit/crédit (le montant est remplacé) ; à-nouveaux d'un exercice non initial ; numéros de pièces communs entre exercices ; codes de compte non réductibles à 6 chiffres ; fichier Excel.
- **À vérifier** : comportements silencieux d'Odoo (montant négatif inversé, débit+crédit compensés, lignes en double importées deux fois, devise inconnue ignorée, espaces dans JournalCode/EcritureNum, journaux de banque créés automatiquement pour les comptes 512/519/53…).

## Tests

`tests/fixtures/` contient uniquement des fichiers synthétiques (un cas d'anomalie par fichier) et les exports du plan comptable et des journaux d'une base Odoo 20 France neuve.

`tests/fixtures/editeurs/` : un même exercice fictif exporté selon les variantes de format courantes des logiciels comptables (Sage 100, EBP, Pennylane, Cegid Quadra, Sage Génération Expert / Coala, fichier repassé par Excel, UTF-8 avec BOM sans ValidDate). Ce ne sont pas de vrais exports d'éditeurs : aucun n'en publie. Ils reproduisent les choix de format typiques (séparateur, encodage, comptes à 8 caractères, tiers dans CompteNum, numérotation par journal, à-nouveaux datés au jour de saisie). Régénérer avec `python3 tests/gen_editeurs.py`.

`tests/fixtures/variantes/` : un FEC minimal par anomalie (lettrage, 3 décimales, codes courts, tiers dans CompteNum, date inexistante, type des journaux…), chacun importé sur Odoo 20 ; résultat en commentaire dans `tests/gen_variantes.py`.

```bash
npm i xlsx@0.18.5
node tests/run.js tests/fixtures/dc.txt
node tests/run.js tests/fixtures/neg.txt tests/fixtures/odoo20_fr_export_comptes_actifs.xlsx tests/fixtures/odoo20_fr_export_comptes_inactifs.xlsx tests/fixtures/odoo20_fr_export_journaux.xlsx
```

## Banc d'essai

Sur un jeu de 400 paires de FEC fictifs (17 styles d'export, 1 567 erreurs connues) : 400 FEC corrects sur 400 jugés importables, 98,6 % des erreurs détectées, et un échantillon de 31 fichiers confirmé par import réel dans Odoo 20. `node tests/bench_dataset.js "chemin/fichiers FECS"` puis `python3 tests/bench_measure.py`.

## Limites

- Comportements relevés sur Odoo 20 (SaaS, plan comptable français). Une autre version peut différer : rejouer les cas de `tests/fixtures` sur une base de test.
- L'import FEC d'Odoo n'est pas atomique : toujours importer d'abord sur un staging ou après un backup.
- Ne remplace pas le rapport officiel de Test Compta Démat.
