"""Génère des FEC synthétiques imitant les variantes d'export courantes de logiciels comptables.

Ce ne sont PAS de vrais exports : aucun éditeur ne publie d'échantillon. Chaque profil reproduit
des choix de format répandus (séparateur, encodage, longueur des comptes, tiers, numérotation).
Même jeu d'écritures pour tous les profils : seul le format change.
Usage : python3 tests/gen_editeurs.py  -> tests/fixtures/editeurs/
"""
import os, random, datetime as dt
from decimal import Decimal as D

random.seed(42)
OUT = os.path.join(os.path.dirname(__file__), 'fixtures', 'editeurs')
os.makedirs(OUT, exist_ok=True)
HDR = 'JournalCode JournalLib EcritureNum EcritureDate CompteNum CompteLib CompAuxNum CompAuxLib PieceRef PieceDate EcritureLib Debit Credit EcritureLet DateLet ValidDate Montantdevise Idevise'.split()

CLIENTS = [('C001', 'DUPONT', 'Boulangerie Dupont'), ('C002', 'MARTIN', 'Martin & Fils'),
           ('C003', 'LEROY', 'Leroy Distribution'), ('C004', 'PETIT', 'Petit Événements')]
FOURN = [('F001', 'ORANGE', 'Orange'), ('F002', 'EDF', 'EDF'), ('F003', 'METRO', 'Metro Cash'),
         ('F004', 'BUREAU', 'Bureau Vallée')]
CHARGES = {'ORANGE': ('626000', 'Frais postaux et télécom'), 'EDF': ('606100', 'Fournitures non stockables'),
           'METRO': ('607000', 'Achats de marchandises'), 'BUREAU': ('606400', 'Fournitures administratives')}
J = {'VT': 'Ventes', 'AC': 'Achats', 'BQ': 'Banque', 'OD': 'Opérations diverses', 'AN': 'A nouveaux'}

def build():
    """Écritures logiques : liste de dict(j, date, piece, lib, lignes=[(compte, lib, tiers|None, d, c)])."""
    E = []
    y0 = dt.date(2025, 1, 1)
    # à-nouveaux
    E.append(dict(j='AN', date=y0, piece='AN2025', lib='Report à nouveau', lignes=[
        ('101000', 'Capital', None, D(0), D('10000.00')),
        ('512000', 'Banque', None, D('14250.40'), D(0)),
        ('411000', 'Clients', CLIENTS[0], D('1800.00'), D(0)),
        ('401000', 'Fournisseurs', FOURN[2], D(0), D('2350.40')),
        ('120000', 'Résultat de l\'exercice (bénéfice)', None, D(0), D('3700.00'))]))
    nf = 0
    for m in range(1, 13):
        for _ in range(3):
            nf += 1
            cl = random.choice(CLIENTS); d = dt.date(2025, m, random.randint(1, 25))
            ht = D(random.randint(200, 3000)) + D(random.randint(0, 99)) / 100
            tva = (ht * D('0.20')).quantize(D('0.01')); ttc = ht + tva
            ref = f'FA2025-{nf:04d}'
            E.append(dict(j='VT', date=d, piece=ref, lib=f'Facture {cl[2]}', lignes=[
                ('411000', 'Clients', cl, ttc, D(0)),
                ('706000', 'Prestations de services', None, D(0), ht),
                ('445710', 'TVA collectée', None, D(0), tva)]))
            E.append(dict(j='BQ', date=min(d + dt.timedelta(days=20), dt.date(2025, 12, 31)), piece=ref,
                          lib=f'Règlement {cl[2]}', lignes=[
                ('512000', 'Banque', None, ttc, D(0)), ('411000', 'Clients', cl, D(0), ttc)], let=ref))
        for fo in random.sample(FOURN, 2):
            d = dt.date(2025, m, random.randint(1, 25))
            ht = D(random.randint(50, 1500)) + D(random.randint(0, 99)) / 100
            tva = (ht * D('0.20')).quantize(D('0.01')); ttc = ht + tva
            ref = f'{fo[1][:3]}{m:02d}{random.randint(100, 999)}'
            ch = CHARGES[fo[1]]
            E.append(dict(j='AC', date=d, piece=ref, lib=f'Facture {fo[2]}', lignes=[
                (ch[0], ch[1], None, ht, D(0)), ('445660', 'TVA déductible sur ABS', None, tva, D(0)),
                ('401000', 'Fournisseurs', fo, D(0), ttc)]))
            E.append(dict(j='BQ', date=min(d + dt.timedelta(days=30), dt.date(2025, 12, 31)), piece=ref,
                          lib=f'Paiement {fo[2]}', lignes=[
                ('401000', 'Fournisseurs', fo, ttc, D(0)), ('512000', 'Banque', None, D(0), ttc)], let=ref))
        d = dt.date(2025, m, 28)
        E.append(dict(j='OD', date=d, piece=f'SAL{m:02d}', lib=f'Salaires {m:02d}/2025', lignes=[
            ('641000', 'Rémunérations du personnel', None, D('2800.00'), D(0)),
            ('645100', 'Cotisations URSSAF', None, D('1150.00'), D(0)),
            ('421000', 'Personnel - Rémunérations dues', None, D(0), D('2180.00')),
            ('431000', 'Sécurité sociale', None, D(0), D('1770.00'))]))
    E.sort(key=lambda e: (e['date'], e['j']))
    # lettres de lettrage
    lettres, n = {}, 0
    for e in E:
        if e.get('let') and e['let'] not in lettres:
            n += 1; a, b = divmod(n - 1, 26); lettres[e['let']] = (chr(65 + a) if a else '') + chr(65 + b)
    return E, lettres

def ymd(d): return d.strftime('%Y%m%d')
def amt(x, dec=','): return f'{x:.2f}'.replace('.', dec)

def render(name, E, lettres, *, sep='\t', enc='cp1252', eol='\r\n', compte=None, aux=None, num=None,
           journ=None, devise=False, valid=True, dec=',', datefmt=ymd, an_date=None, bom=False):
    seqj, rows, g = {}, [], 0
    for e in E:
        jc = (journ or {}).get(e['j'], e['j'])
        seqj[jc] = seqj.get(jc, 0) + 1; g += 1
        en = num(jc, seqj[jc], g, e) if num else str(g)
        d = an_date if (e['j'] == 'AN' and an_date) else e['date']
        nxt = dt.date(d.year + (d.month == 12), d.month % 12 + 1, 1)
        vd = ymd(nxt - dt.timedelta(days=1)) if valid else ''
        for (c, cl, t, de, cr) in e['lignes']:
            cn, cln, an, al = (compte(c, cl) if compte else (c, cl)) + ('', '')
            if t:
                cn, cln, an, al = aux(c, cl, t)
            is_tiers = c[:3] in ('401', '411') and e.get('let')
            let = lettres.get(e.get('let'), '') if is_tiers else ''
            rows.append([jc, J[e['j']], en, datefmt(d), cn, cln, an, al, e['piece'], datefmt(e['date']), e['lib'],
                         amt(de, dec), amt(cr, dec), let, ymd(dt.date(2025, 12, 31)) if let else '', vd,
                         amt(de - cr, dec) if devise else '', 'EUR' if devise else ''])
    txt = eol.join([sep.join(HDR)] + [sep.join(r) for r in rows]) + eol
    data = txt.encode(enc, errors='replace')
    if bom: data = b'\xef\xbb\xbf' + data
    os.makedirs(os.path.dirname(os.path.join(OUT, name)), exist_ok=True)
    open(os.path.join(OUT, name), 'wb').write(data)
    return len(rows)

E, L = build()
coll = lambda c, cl, t: (c, cl, t[0], t[2])            # collectif + CompAuxNum
pad8 = lambda c, cl: (c.ljust(8, '0'), cl)
P = {
    # Sage 100 : pipe, comptes 8 caractères, numéro par journal, journaux ACH/VTE/BQ1/OD/RAN
    'sage100/999999990FEC20251231.txt': dict(sep='|', compte=pad8,
        aux=lambda c, cl, t: (c.ljust(8, '0'), cl, t[0], t[2]),
        num=lambda jc, n, g, e: str(n), journ={'VT': 'VTE', 'AC': 'ACH', 'BQ': 'BQ1', 'AN': 'RAN'}),
    # EBP : tabulation, comptes 6 chiffres, numéro global, tiers en CompAuxNum
    'ebp/999999990FEC20251231.txt': dict(aux=coll),
    # Pennylane : UTF-8, LF, numéros alphanumériques par journal, devise renseignée
    'pennylane/999999990FEC20251231.txt': dict(enc='utf-8', eol='\n', devise=True,
        aux=lambda c, cl, t: (c, cl, ('FOU_' if c.startswith('401') else 'CLI_') + t[1], t[2]),
        num=lambda jc, n, g, e: f'{jc}{e["date"]:%Y%m}-{n:05d}', journ={'AC': 'HA', 'BQ': 'BQ1'}),
    # Cegid Quadra : tiers directement dans CompteNum (0xxx fournisseurs, 9xxx clients), comptes 8 car.
    'quadra/999999990FEC20251231.txt': dict(compte=pad8,
        aux=lambda c, cl, t: (('0' if c.startswith('401') else '9') + t[1], t[2], '', '')),
    # Sage Génération Expert / Coala : à-nouveaux datés à la date de saisie, pas au 1er jour
    'coala/999999990FEC20251231.txt': dict(sep='|', aux=coll, an_date=dt.date(2025, 2, 14)),
    # Fichier repassé par Excel : point décimal et dates JJ/MM/AAAA
    'excel_retouche/999999990FEC20251231.txt': dict(aux=coll, dec='.', datefmt=lambda d: d.strftime('%d/%m/%Y')),
    # Export UTF-8 avec BOM et sans ValidDate (certains logiciels en ligne)
    'bom_sans_validdate/999999990FEC20251231.txt': dict(enc='utf-8', bom=True, aux=coll, valid=False),
}
for n, kw in P.items():
    print(n, render(n, E, L, **kw), 'lignes')
