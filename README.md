# fec_checker

Un checker de FEC avant l'import dans Odoo.

Une page web autonome (`index.html`) qui contrôle un Fichier des Écritures Comptables avant de lancer l'assistant d'import FEC d'Odoo (`l10n_fr_fec_import`). Elle reprend les contrôles de Test Compta Démat (DGFiP) et ajoute ceux qui font échouer, ou fausser sans message, l'import dans Odoo. Chaque règle Odoo a été vérifiée par un import réel sur une base Odoo 20 (voir `docs/constats_import_odoo.md`).

**Aucune donnée ne sort du poste** : le fichier est lu et analysé dans le navigateur.

## Utilisation

1. Ouvrir `index.html` (en local ou via GitHub Pages).
2. Déposer le FEC (`.txt` à tabulation ou `|`, ou l'Excel dans lequel il a été collé).
3. Recommandé : déposer avec lui trois exports de la base Odoo cible, pour contrôler contre le plan comptable et les journaux réels du client :
   - Comptabilité → Configuration → Plan comptable → tout sélectionner → Actions → Exporter, avec les champs **Code, Nom du compte, Type, Actif** ;
   - le même export avec le filtre **Comptes inactifs** (Odoo masque les comptes archivés, et ce sont eux qui bloquent ; le champ Actif n'est pas mémorisé d'un export à l'autre) ;
   - Configuration → Journaux → tout sélectionner → Exporter (les champs par défaut suffisent).

   La page reconnaît ces exports toute seule (.xlsx ou .csv, en-têtes français ou techniques). Sans eux, elle contrôle contre le plan comptable par défaut d'Odoo 20 France.
4. Plusieurs exercices : déposer tous les FEC ensemble pour le contrôle croisé (à-nouveaux en double, numéros de pièces communs, chevauchement de périodes).
5. Après l'import : comparer le tableau « Contrôle après import » (par code de journal) avec Comptabilité → Analyse des écritures.

## Ce que la page détecte

- **Bloquant DGFiP** : en-tête, séparateur, nombre de champs, dates, montants (virgule décimale), champs obligatoires vides, écritures déséquilibrées, lignes vides.
- **Bloquant Odoo** (vérifié) : guillemet dans un champ ; compte archivé dans la base ; compte qui sera créé archivé (copié d'un voisin archivé) ; code journal déjà pris par un journal d'un autre type ; pièces déséquilibrées une fois regroupées par PieceRef quand EcritureNum est vide ; Montantdevise en EUR différent du débit/crédit (le montant est remplacé) ; à-nouveaux d'un exercice non initial ; numéros de pièces communs entre exercices ; codes de compte non réductibles à 6 chiffres ; fichier Excel.
- **À vérifier** : comportements silencieux d'Odoo (montant négatif inversé, débit+crédit compensés, lignes en double importées deux fois, devise inconnue ignorée, espaces dans JournalCode/EcritureNum, journaux de banque créés automatiquement pour les comptes 512/519/53…).

## Tests

`tests/fixtures/` contient uniquement des fichiers synthétiques (un cas d'anomalie par fichier) et les exports du plan comptable et des journaux d'une base Odoo 20 France neuve.

`tests/fixtures/editeurs/` : un même exercice fictif exporté selon les variantes de format courantes des logiciels comptables (Sage 100, EBP, Pennylane, Cegid Quadra, Sage Génération Expert / Coala, fichier repassé par Excel, UTF-8 avec BOM sans ValidDate). Ce ne sont pas de vrais exports d'éditeurs : aucun n'en publie. Ils reproduisent les choix de format typiques (séparateur, encodage, comptes à 8 caractères, tiers dans CompteNum, numérotation par journal, à-nouveaux datés au jour de saisie). Régénérer avec `python3 tests/gen_editeurs.py`.

```bash
npm i xlsx@0.18.5
node tests/run.js tests/fixtures/dc.txt
node tests/run.js tests/fixtures/neg.txt tests/fixtures/odoo20_fr_export_comptes_actifs.xlsx tests/fixtures/odoo20_fr_export_comptes_inactifs.xlsx tests/fixtures/odoo20_fr_export_journaux.xlsx
```

## Limites

- Comportements relevés sur Odoo 20 (SaaS, plan comptable français). Une autre version peut différer : rejouer les cas de `tests/fixtures` sur une base de test.
- L'import FEC d'Odoo n'est pas atomique : toujours importer d'abord sur un staging ou après un backup.
- Ne remplace pas le rapport officiel de Test Compta Démat.
