# Captures d'Odoo affichées au survol

La page cite des chemins de menu Odoo (« Comptabilité › Configuration › Plan comptable », « Action › Désarchiver »…). Chacun est affiché comme une étiquette. Quand le fichier de capture correspondant existe dans ce dossier, l'étiquette prend une icône d'appareil photo et la capture s'affiche au survol (au toucher sur mobile).

Il suffit de déposer les fichiers ici, avec **exactement** les noms ci-dessous : aucun code à modifier. Un fichier absent ne casse rien, l'étiquette reste simplement sans capture. La page enregistrée seule (sans ce dossier) fonctionne aussi, sans les captures.

## Règles

- **Base de test uniquement** : magasin-mcp.odoo.com, société 3 « Banc FEC (test) ». Aucune donnée client, aucun nom réel : le dépôt est public.
- Odoo 20 en français, fenêtre d'environ 1 400 px de large, zoom 100 %. Recadrer sur la zone utile (pas besoin du navigateur entier).
- Format PNG (ou WebP renommé en .png), 1 200 px de large au plus, idéalement moins de 150 Ko par image.
- Les encadrés rouges peuvent être dessinés sur l'image, ou ajoutés par la page : dans `index.html`, la liste `NAV` accepte pour chaque chemin `box:[[gauche, haut, largeur, hauteur]]` en % de l'image.

## Les captures (par ordre d'utilité)

| Fichier | Écran à capturer | À encadrer | Utilisé pour |
|---|---|---|---|
| `menu-configuration.png` | Application Comptabilité, menu **Configuration** déroulé | Plan comptable, Journaux, Devises | Exports de la base cible, désarchivage, devises, journaux |
| `action-desarchiver.png` | Plan comptable, filtre « Comptes inactifs » actif, deux ou trois comptes cochés, menu **Actions** ouvert | « Désarchiver » | Comptes archivés (avant import) et comptes créés archivés (après import) |
| `filtre-comptes-inactifs.png` | Plan comptable, panneau de filtres de la barre de recherche ouvert | « Comptes inactifs » | Export des comptes inactifs, désarchivage |
| `action-exporter.png` | Plan comptable, tout sélectionné, menu **Actions** ouvert ; idéalement la fenêtre d'export avec Code, Nom du compte, Type, Actif | « Exporter » (et les 4 champs) | Exports du plan comptable et des journaux |
| `assistant-import-fec.png` | Assistant **Import FEC** ouvert (trouvé par la barre de recherche, Ctrl+K « Import FEC ») | Fichier, préfixe de document, doublons « Ignorer » | Mode d'emploi, étape d'import |
| `menu-comptabilite.png` | Application Comptabilité, menu **Comptabilité** déroulé | Pièces comptables, Dates de verrouillage | Balance d'ouverture, verrouillage des périodes |
| `ecritures-par-journal.png` | Révision › Écritures comptables, sans le filtre « Comptabilisé », vue tableau croisé, lignes par journal, mesures Débit, Crédit, Nombre | Le tableau | Contrôle après import |
| `menu-revision.png` | Application Comptabilité, menu **Révision** déroulé | Écritures comptables | Contrôle après import |
| `importer-enregistrements.png` | Une liste (Pièces comptables) avec le menu ⚙ à côté du titre ouvert | « Importer des enregistrements » | Import de tiers.xlsx et balance_ouverture.xlsx |
| `devise-activer.png` | Configuration › Devises, filtre des devises inactives, ligne USD avec le bouton Actif | Le bouton Actif | Écritures en devises |
| `journal-type.png` | Fiche d'un journal (Configuration › Journaux › un journal) | Champ « Type » | Journaux créés avec un mauvais type |
| `journal-archiver.png` | Configuration › Journaux, un journal BNK coché, menu Actions ouvert | « Archiver » | Journal de banque en double |

Les huit premières couvrent l'essentiel. Les menus ont été relevés sur la base de test (Odoo 20) le 21/10/2026.
