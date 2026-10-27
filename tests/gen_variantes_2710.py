"""FEC fictifs des pièges vus le 27/10/2026 sur des FEC réels, vérifiés sur Odoo 20 (société de test).
Usage : python3 tests/gen_variantes_2710.py -> tests/fixtures/variantes/
"""
import os
OUT = os.path.join(os.path.dirname(__file__), 'fixtures', 'variantes')
os.makedirs(OUT, exist_ok=True)
HDR = 'JournalCode|JournalLib|EcritureNum|EcritureDate|CompteNum|CompteLib|CompAuxNum|CompAuxLib|PieceRef|PieceDate|EcritureLib|Debit|Credit|EcritureLet|DateLet|ValidDate|Montantdevise|Idevise'
IBAN = 'FR76 3000 4000 0100 0000 0000 001'


def L(j, n, c, cl, de, cr, jl=None, lib='x'):
    return '|'.join([j, jl or 'Journal ' + j, n, '20250105', c, cl, '', '', 'P' + n, '20250105', lib, de, cr, '', '', '20250131', '', ''])


V = {
    # refusé : « Email aliases … cannot be used on several records » ; avec « (512005) » ajouté au libellé : importé
    'banques_meme_libelle': [L('OD', '1', '512005', IBAN, '10,00', '0,00'), L('OD', '1', '512006', IBAN, '0,00', '10,00')],
    # refusé : « Le code du journal doit être unique par société » (Odoo crée BNK2 pour 512005)
    'journal_bnk2': [L('BNK2', '1', '512005', 'Banque A', '10,00', '0,00', 'Banque reserve'),
                     L('BNK2', '1', '606400', 'Fournitures', '0,00', '10,00', 'Banque reserve')],
    # refusés un par un : « The account code can only contain alphanumeric characters, dots, and dashes »
    'compte_caracteres_refuses': [L('OD', '1', "401A'B", 'Tiers A', '10,00', '0,00'), L('OD', '1', '606400', 'Fournitures', '0,00', '10,00'),
                                  L('OD', '2', '6064É0', 'Fournitures E', '10,00', '0,00'), L('OD', '2', '512000', 'Banque', '0,00', '10,00')],
}
for k, rows in V.items():
    open(os.path.join(OUT, k + '.txt'), 'w', encoding='utf-8', newline='').write('\r\n'.join([HDR] + rows) + '\r\n')
# Réenregistré dans Excel : « ; » en fin de ligne, ligne à guillemet entourée de guillemets (intérieurs doublés) ; refusé par Odoo
rows = [HDR, L('VT', '1', '411000', 'Clients', '120,00', '0,00'), L('VT', '1', '706000', 'Prestations', '0,00', '120,00', lib='Ecran 42" a 65"'),
        L('BQ', '1', '512000', 'Banque', '120,00', '0,00'), L('BQ', '1', '411000', 'Clients', '0,00', '120,00')]
xl = [('"' + r.replace('"', '""') + '"' if '"' in r else r) + ';;;;' for r in rows]
open(os.path.join(OUT, 'excel_reenregistre.txt'), 'w', encoding='utf-8', newline='').write('\r\n'.join(xl) + '\r\n')
print(len(V) + 1, 'fichiers')
