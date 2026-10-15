"""Petits FEC d'une anomalie chacun, importés sur Odoo 20 le 15/10/2026 (résultat en commentaire).
Usage : python3 tests/gen_variantes.py -> tests/fixtures/variantes/
"""
import os
OUT = os.path.join(os.path.dirname(__file__), 'fixtures', 'variantes')
os.makedirs(OUT, exist_ok=True)
HDR = 'JournalCode JournalLib EcritureNum EcritureDate CompteNum CompteLib CompAuxNum CompAuxLib PieceRef PieceDate EcritureLib Debit Credit EcritureLet DateLet ValidDate Montantdevise Idevise'.split()

def L(j, n, d, c, cl, aux, al, pr, lib, de, cr, let='', dl='', pd=None, jl=None):
    return [j, jl or 'Journal ' + j, n, d, c, cl, aux, al, pr, d if pd is None else pd, lib, de, cr, let, dl, '20250131', '', '']

def entries(j, k, c1, c2, aux=''):
    rows = []
    for i in range(1, k + 1):
        rows += [L(j, str(i), '20250105', c1, 'A', aux, 'Tiers ' + aux if aux else '', f'P{j}{i}', 'x', '10,00', '0,00'),
                 L(j, str(i), '20250105', c2, 'B', '', '', f'P{j}{i}', 'x', '0,00', '10,00')]
    return rows

V = {
    # matching_number repris ; à la comptabilisation : lettrage complet
    'lettrage_equilibre': [L('VT', '1', '20250105', '411000', 'Clients', 'C1', 'Client Un', 'F1', 'Fact', '120,00', '0,00', 'AA', '20250120'),
                           L('VT', '1', '20250105', '706000', 'Presta', '', '', 'F1', 'Fact', '0,00', '120,00'),
                           L('BQ', '1', '20250120', '512000', 'Banque', '', '', 'F1', 'Regl', '120,00', '0,00'),
                           L('BQ', '1', '20250120', '411000', 'Clients', 'C1', 'Client Un', 'F1', 'Regl', '0,00', '120,00', 'AA', '20250120')],
    # à la comptabilisation : lettrage partiel, reste dû 20
    'lettrage_non_solde': [L('VT', '1', '20250105', '411000', 'Clients', 'C1', 'Client Un', 'F1', 'Fact', '120,00', '0,00', 'AB', '20250120'),
                           L('VT', '1', '20250105', '706000', 'Presta', '', '', 'F1', 'Fact', '0,00', '120,00'),
                           L('BQ', '1', '20250120', '512000', 'Banque', '', '', 'F1', 'Regl', '100,00', '0,00'),
                           L('BQ', '1', '20250120', '411000', 'Clients', 'C1', 'Client Un', 'F1', 'Regl', '0,00', '100,00', 'AB', '20250120')],
    # lettre d'un seul côté : rien rapproché
    'lettre_un_cote': [L('BQ', '1', '20250120', '512000', 'Banque', '', '', 'F1', 'Regl', '100,00', '0,00'),
                       L('BQ', '1', '20250120', '411000', 'Clients', 'C1', 'Client Un', 'F1', 'Regl', '0,00', '100,00', 'AC', '20250120')],
    # arrondi silencieux 10,005 -> 10,01
    'trois_decimales': [L('OD', '1', '20250105', '606400', 'F', '', '', 'P', 'x', '10,005', '0,00'),
                        L('OD', '1', '20250105', '512000', 'B', '', '', 'P', 'x', '0,00', '10,005')],
    # équilibrée à 3 décimales, déséquilibrée après arrondi -> « The entry is not balanced »
    'trois_decimales_desequilibre': [L('OD', '1', '20250105', '606400', 'F', '', '', 'P', 'x', '10,004', '0,00'),
                                     L('OD', '1', '20250105', '606400', 'F', '', '', 'P', 'x', '10,004', '0,00'),
                                     L('OD', '1', '20250105', '512000', 'B', '', '', 'P', 'x', '0,00', '20,008')],
    # 6064 -> 606400 existant ; 5120 créé tel quel
    'compte_court': [L('OD', '1', '20250105', '6064', 'F', '', '', 'P', 'x', '10,00', '0,00'),
                     L('OD', '1', '20250105', '5120', 'B', '', '', 'P', 'x', '0,00', '10,00')],
    # compte fournisseur par tiers, sans partenaire
    'tiers_dans_compte_401': [L('AC', '1', '20250105', '606400', 'F', '', '', 'P', 'x', '10,00', '0,00'),
                              L('AC', '1', '20250105', '401DUPONT', 'Dupont', '', '', 'P', 'x', '0,00', '10,00')],
    # premier libellé gardé pour le partenaire
    'tiers_libelles_differents': [L('VT', '1', '20250105', '411000', 'C', 'C1', 'Nom A', 'F1', 'x', '10,00', '0,00'),
                                  L('VT', '1', '20250105', '706000', 'P', '', '', 'F1', 'x', '0,00', '10,00'),
                                  L('VT', '2', '20250106', '411000', 'C', 'C1', 'Nom B', 'F2', 'x', '10,00', '0,00'),
                                  L('VT', '2', '20250106', '706000', 'P', '', '', 'F2', 'x', '0,00', '10,00')],
    # partenaire nommé « C9 »
    'tiers_sans_libelle': [L('VT', '1', '20250105', '411000', 'C', 'C9', '', 'F1', 'x', '10,00', '0,00'),
                           L('VT', '1', '20250105', '706000', 'P', '', '', 'F1', 'x', '0,00', '10,00')],
    # erreur serveur « day 30 must be in range 1..28 »
    'date_30_fevrier': [L('OD', '1', '20250230', '606400', 'F', '', '', 'P', 'x', '10,00', '0,00'),
                        L('OD', '1', '20250230', '512000', 'B', '', '', 'P', 'x', '0,00', '10,00')],
    # dernier libellé gardé pour le journal
    'journal_libelles_differents': [L('OD', '1', '20250105', '606400', 'F', '', '', 'P', 'x', '10,00', '0,00'),
                                    L('OD', '1', '20250105', '512000', 'B', '', '', 'P', 'x', '0,00', '10,00'),
                                    L('OD', '2', '20250106', '606400', 'F', '', '', 'P2', 'x', '5,00', '0,00', jl='Autre libelle'),
                                    L('OD', '2', '20250106', '512000', 'B', '', '', 'P2', 'x', '0,00', '5,00', jl='Autre libelle')],
    # compte à créer sans libellé -> « Champ requis manquant 'Nom du compte' »
    'compte_cree_sans_libelle': [L('OD', '1', '20250105', '606400', '', '', '', 'P', 'x', '10,00', '0,00'),
                                 L('OD', '1', '20250105', '512000', '', '', '', 'P', 'x', '0,00', '10,00')],
    # importés tels quels (montant vide = 0, espaces retirés, PieceDate vide acceptée)
    'montant_vide_espaces_piecedate': [L('OD', '1', '20250105', '606400', 'F', '', '', 'P', 'x', ' 10,00 ', '', pd=''),
                                       L('OD', '1', '20250105', '512000', 'B', '', '', 'P', 'x', '', '10,00 ', pd='')],
    # types de journaux : X1 (2 écritures) Divers ; Y (3) Ventes ; Z4 70 % Ventes ; Z6 60 % Divers
    'types_journaux': entries('X1', 2, '411000', '706000', 'C1') + entries('Y1', 3, '411000', '706000', 'C1')
        + entries('Z4', 7, '411000', '706000', 'C1') + [r[:2] + [str(int(r[2]) + 7)] + r[3:] for r in entries('Z4', 3, '606400', '512001')]
        + entries('Z6', 6, '411000', '706000', 'C1') + [r[:2] + [str(int(r[2]) + 6)] + r[3:] for r in entries('Z6', 4, '606400', '512001')]
        + entries('Y3', 10, '606400', '401000', 'F1') + entries('Y4', 10, '512001', '706000'),
}
for k, rows in V.items():
    txt = '\r\n'.join(['\t'.join(HDR)] + ['\t'.join(r) for r in rows]) + '\r\n'
    open(os.path.join(OUT, k + '.txt'), 'w', encoding='utf-8', newline='').write(txt)
print(len(V), 'fichiers')
