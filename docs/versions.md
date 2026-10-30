# Versions

## Fonctionnement

Deux branches :

- **`dev`** : la branche de travail. Toutes les PR y sont fusionnées, une par modification, comme avant. Chaque modification reste testée par le lien d'aperçu de la branche et, si elle touche au fichier de reprise ou au comportement, par un import réel dans Odoo (société 3 « Banc FEC (test) »).
- **`main`** : seulement les versions publiées. C'est elle que sert GitHub Pages (https://haurujenkins.github.io/fec-checker/) : le site ne change donc qu'à chaque nouvelle version.

Numérotation : `1.0`, `1.1`, `1.2`… pour un lot de nouveautés ; `2.0` pour un changement profond (nouvelle façon de travailler, nouvelle version d'Odoo ciblée). Un correctif urgent sur une version publiée prend le numéro suivant (`1.1` → `1.2`) et passe par le même circuit.

Aperçus :

- version en cours de préparation : https://raw.githack.com/haurujenkins/fec-checker/dev/index.html
- version publiée : https://haurujenkins.github.io/fec-checker/

## Publier une version

Quand `dev` contient assez de nouveautés :

1. Sur une branche partie de `dev`, changer le numéro et la date dans le pied de page de `index.html` (`data-version="1.1"`, texte « version 1.1 du JJ/MM/AAAA ») et ajouter en haut du journal ci-dessous une section `### v1.1 « Nom de la version »` (le nom est facultatif) qui liste les changements, en mots simples pour les collègues. Fusionner sur `dev`.
2. Ouvrir une PR **« Version 1.1 »** de `dev` vers `main`, avec la même liste de changements.
3. Faire un import réel du fichier de reprise dans Odoo (société 3) avec la page de `dev`, sur les FEC de démonstration, et noter le résultat dans la PR. Puis désinstaller le module d'import.
4. La CI vérifie que le numéro est nouveau et qu'il figure au journal ; les tests de non-régression tournent aussi.
5. Fusionner la PR (merge commit, pas de squash, pour garder `dev` et `main` alignées).
6. Automatique : le workflow « Publication de version » pose le tag `v1.1` et crée la Release GitHub avec `index.html` en pièce jointe. C'est ce fichier qu'on envoie aux collègues.

## Journal des versions

### v1.1

Deuxième version publiée (30/10/2026), qui corrige des fausses alertes vues sur des FEC réels et clarifie l'affichage :

- Montant en devise à zéro sans code devise : plus signalé (Odoo l'ignore). Non nul, il devient une simple note « Pour information ».
- Même numéro d'écriture pour plusieurs pièces équilibrées (paquets mensuels) : passe de « Importé, mais faussé » à « À vérifier avec le client », car les montants et les soldes restent justes.
- Temps estimé plus cohérent : les vérifications après import comptent en un seul passage, plafonné à 15 minutes.
- Bulle « i » du temps estimé réparée, et bulles du fichier de reprise et de la table de correspondance réécrites.

### v1.0

Première version publiée (28/10/2026), qui reprend tout le travail fait depuis le début du projet :

- Verdict pour Odoo en quatre niveaux, avec le temps estimé du consultant et les points à régler rangés par endroit où agir.
- Fichier de reprise prêt à importer (préfixe des numéros d'écriture, retrait des à-nouveaux, tiers regroupés sur 411100 et 401100, lettrage préfixé, TVA sur encaissements), sans jamais toucher aux montants.
- Contrôle contre le plan comptable et les journaux de la base cible, à partir des exports Odoo.
- Messages d'erreur de l'assistant d'import d'Odoo repris dans les constats.
- Onglet « Lecture du FEC » relié aux constats.
- Habillage aux couleurs d'Odoo, mode sombre et affichage mobile.
- Numéro de version en bas de page.
