# Captures d'Odoo affichées au survol

La page cite des chemins de menu Odoo (« Comptabilité › Configuration › Plan comptable », « Actions › Désarchiver »…). Chacun est affiché comme une étiquette. Quand le fichier de capture correspondant existe dans ce dossier, l'étiquette prend une icône d'appareil photo et la capture s'affiche au survol (au toucher sur mobile), avec un encadré rouge sur l'endroit où cliquer.

Les captures ont été prises le 21/10/2026 sur Odoo 20, base de test magasin-mcp, société « Banc FEC (test) » uniquement, en lecture seule (menus ouverts, cases cochées, rien d'enregistré). Les noms visibles dans la liste des pièces comptables sont les exemples fictifs qu'Odoo affiche sur une liste vide.

Un fichier absent ne casse rien : l'étiquette reste simplement sans capture. La page enregistrée seule (sans ce dossier) fonctionne aussi, sans les captures.

## Remplacer ou ajouter une capture

- **Base de test uniquement**, aucune donnée client, aucun nom réel : le dépôt est public.
- Odoo 20 en français, fenêtre de 1 400 px de large, zoom 100 %, recadrée sur la zone utile. PNG de moins de 150 Ko.
- Garder exactement le nom de fichier. Les encadrés sont dessinés par la page : dans `index.html`, la liste `NAV` donne pour chaque chemin `box:[[gauche, haut, largeur, hauteur]]` en % de l'image. Les recalculer si le cadrage change.

## Les captures

| Fichier | Écran | Encadré | Utilisé pour |
|---|---|---|---|
| `menu-configuration.png` | Menu **Configuration** déroulé | Plan comptable, Journaux ou Devises | Exports de la base cible, désarchivage, devises, journaux |
| `menu-comptabilite.png` | Menu **Comptabilité** déroulé | Pièces comptables ou Dates de verrouillage… | Balance d'ouverture, verrouillage des périodes |
| `menu-revision.png` | Menu **Révision** déroulé | Écritures comptables | Contrôle après import |
| `filtre-comptes-inactifs.png` | Plan comptable, panneau des filtres | « Comptes inactifs » | Export des comptes inactifs, désarchivage |
| `action-desarchiver.png` | Plan comptable filtré sur les comptes inactifs, 3 comptes cochés, menu **Actions** | « Désarchiver » | Comptes archivés, comptes créés archivés |
| `action-exporter.png` | Plan comptable, page cochée, menu **Actions** | « Exporter » et « Tout sélectionner » | Exports du plan comptable et des journaux |
| `importer-enregistrements.png` | Pièces comptables, menu ⋮ à côté du titre | « Importer » | Import de tiers.xlsx et balance_ouverture.xlsx |
| `ecritures-par-journal.png` | Écritures comptables, barre de recherche et vues | Filtre « Comptabilisé » et bouton tableau croisé | Contrôle après import |
| `devise-activer.png` | Configuration › Devises | Colonne « Actif » | Écritures en devises |
| `journal-type.png` | Fiche du journal Opérations diverses | Champ « Type » | Journaux créés avec un mauvais type |
| `journal-archiver.png` | Journaux, journal de banque coché, menu **Actions** | « Archiver » | Journal de banque en double |
| `assistant-import-fec.png` | Assistant **Import FEC** | Fichier, préfixe, doublons | **Manquante** : le module `l10n_fr_fec_import` n'est pas installé sur la base de test. À prendre lors de la prochaine campagne de tests, avant de désinstaller le module. |
