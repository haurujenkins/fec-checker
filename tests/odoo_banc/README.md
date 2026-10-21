# Banc Odoo (21/10/2026)

- `resultats_odoo_165.txt` : résultat de l'import réel dans Odoo 20 (société vierge « Banc FEC (test) ») de 165 FEC du jeu « fichiers FECS ». Format : `fichier~OK|ERR|REFUSE|DIFF~message~pièces créées`. `C_` = FEC correct, `E_` = FEC erroné (Pxxxx = paire de `index.csv`).
- `predictions.js` : calcule le verdict de la page (`index.html`) pour les mêmes fichiers et écrit `pred.json`, plus les fichiers de reprise dans `rep/`. Chemins à adapter en tête et en bas du script (listes de fichiers, dossier du jeu de test).
- `compare.py` : croise `pred.json` et les résultats Odoo (matrice prédit / réel et liste des écarts).

L'import lui-même se fait dans un onglet Chrome connecté à la base, voir la méthode dans `docs/resume_projet.md` (§ 9).
