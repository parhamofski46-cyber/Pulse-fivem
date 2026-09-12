# -*- coding: utf-8 -*-
"""Independent reference for the invoice engine — pure integers, no floats.
Mirrors the documented formulas, written without looking at form.js internals."""
import json, random, sys, os
from decimal import Decimal, ROUND_HALF_UP
sys.path.insert(0, os.path.join(os.path.dirname(os.path.abspath(__file__)), "build"))
from fanum import to_words

COIN_MG = {"emami": 8136, "bahar": 8136, "nim": 4068, "rob": 2034, "gerami": 1017}
COIN_AYAR = "۹۰۰"

def s2i(v, dec):
    """text -> integer scaled by 10^dec, half up, never negative"""
    s = str(v).strip()
    if s == "":
        return 0
    try:
        d = Decimal(s)
    except Exception:
        return 0
    if d < 0:
        return 0
    return int((d * (10 ** dec)).quantize(Decimal(1), rounding=ROUND_HALF_UP))

def divr(a, b):
    return (a + b // 2) // b

def purity(v):
    x = s2i(v, 3)
    if x <= 0:
        return None
    return (x, 24000) if x < 100000 else (x, 1000000)

def compute(c):
    rate  = s2i(c["rate"], 0)
    vatBp = s2i(c["vat"], 2)
    base  = purity(c["baseAyar"]) or (18000, 24000)
    coinSoodBp = s2i(c["coinSood"], 2)
    rows, T = [], dict(mg=0, qty=0, gold=0, ojrat=0, sood=0, mk=0,
                       stone=0, vat=0, tot=0, goldJewel=0)
    for r in c["rows"]:
        stone = s2i(r.get("stone", ""), 0)
        qty   = max(0, int(s2i(r.get("qty", ""), 0)))
        coin  = r.get("coin", "")
        if coin:
            used = qty > 0 or r.get("desc", "").strip() != ""
            unit = s2i(c["coinPrice"][coin], 0)
            mg    = COIN_MG[coin] * qty
            gold  = unit * qty
            ojrat = 0
            sood  = divr(gold * coinSoodBp, 10000)
        else:
            mg   = s2i(r.get("w", ""), 3)
            used = mg > 0 or stone > 0 or r.get("desc", "").strip() != ""
            pi   = purity(r.get("ayar", "")) or base
            gold = divr(mg * rate * pi[0] * base[1], 1000 * pi[1] * base[0])
            ojrat = divr(gold * s2i(r.get("op", ""), 2), 10000)
            sood  = divr((gold + ojrat) * s2i(r.get("sp", ""), 2), 10000)
        mk  = ojrat + sood
        vat = divr(mk * vatBp, 10000)
        tot = gold + mk + stone + vat
        rows.append(dict(used=used, gold=gold, mk=mk, vat=vat, tot=tot))
        if used:
            T["mg"] += mg; T["qty"] += qty; T["gold"] += gold; T["ojrat"] += ojrat
            T["sood"] += sood; T["mk"] += mk; T["stone"] += stone
            T["vat"] += vat; T["tot"] += tot
            if not coin:
                T["goldJewel"] += gold
    disc = s2i(c["disc"], 0)
    net  = max(0, T["tot"] - disc)
    pay  = divr(net, 1000) * 1000 if net > 0 else 0
    rnd  = pay - net
    paid = s2i(c["pos"], 0) + s2i(c["trf"], 0)
    rem  = max(0, pay - paid)
    return dict(rows=rows, tw=T["mg"], tgold=T["gold"], tmk=T["mk"],
                tstone=T["stone"], tvat=T["vat"], subtotal=T["tot"],
                payable=pay, rnd=rnd, rem=rem if T["tot"] > 0 else None,
                profit=T["sood"],
                words=(to_words(pay) + " تومان") if pay > 0 else "")

# ---------------------------------------------------------------- generator
def gen(rng):
    def dec(lo, hi, places):
        return str(round(rng.uniform(lo, hi), places))
    c = dict(
        rate=str(rng.randint(1, 10 ** 9)),
        vat=rng.choice(["10", "9", "0", "25", dec(0, 25, 2)]),
        baseAyar=rng.choice(["18", "24", "21", "750", "1000", "18"]),
        coinSood=rng.choice(["3", "0", dec(0, 50, 2), "7.5"]),
        coinPrice={k: str(rng.randint(1, 10 ** 10)) for k in COIN_MG},
        disc=rng.choice(["", "0", str(rng.randint(0, 10 ** 10))]),
        pos=rng.choice(["", str(rng.randint(0, 10 ** 12))]),
        trf=rng.choice(["", str(rng.randint(0, 10 ** 11))]),
        rows=[])
    for _ in range(rng.randint(1, 6)):
        if rng.random() < 0.35:
            c["rows"].append(dict(coin=rng.choice(list(COIN_MG)),
                                  qty=str(rng.randint(1, 999)),
                                  desc="سکه", stone=rng.choice(["", "0"])))
        else:
            c["rows"].append(dict(
                coin="",
                w=rng.choice([dec(0.001, 9999, rng.randint(0, 4)), "0", ""]),
                ayar=rng.choice(["18", "24", "21", "22", "14", "9", "750", "875",
                                 "916", "1000", "585", "", dec(6, 24, 2)]),
                op=rng.choice(["0", "18", dec(0, 99.99, 2), "100"]),
                sp=rng.choice(["7", "0", dec(0, 49.99, 2)]),
                qty=str(rng.randint(1, 99)),
                stone=rng.choice(["", "0", str(rng.randint(0, 10 ** 11))]),
                desc=rng.choice(["کالا", ""])))
    while len(c["rows"]) < 6:
        c["rows"].append(dict(coin="", w="", ayar="", op="", sp="", qty="",
                              stone="", desc=""))
    return c

EDGE = [
  dict(rate="0", vat="10", baseAyar="18", coinSood="3", disc="", pos="", trf="",
       coinPrice={k: "0" for k in COIN_MG},
       rows=[dict(coin="", w="", ayar="", op="", sp="", qty="", stone="", desc="")]),
  dict(rate="24000000", vat="10", baseAyar="18", coinSood="3", disc="999999999999",
       pos="", trf="", coinPrice={k: "1" for k in COIN_MG},
       rows=[dict(coin="", w="12", ayar="18", op="10", sp="7", qty="1", stone="", desc="د")]),
  dict(rate="1", vat="0", baseAyar="1000", coinSood="0", disc="0", pos="0", trf="0",
       coinPrice={k: "1" for k in COIN_MG},
       rows=[dict(coin="", w="0.0005", ayar="9", op="0.01", sp="0.01", qty="1",
                  stone="", desc="ریز")]),
  dict(rate="999999999", vat="10", baseAyar="18", coinSood="50", disc="",
       pos="", trf="", coinPrice={k: "9999999999" for k in COIN_MG},
       rows=[dict(coin="emami", qty="999", desc="س", stone="")] * 1 +
            [dict(coin="", w="9999", ayar="24", op="99.99", sp="49.99", qty="99",
                  stone="99999999999", desc="بزرگ")]),
  dict(rate="24000000", vat="10", baseAyar="18", coinSood="3", disc="-5000",
       pos="-100", trf="", coinPrice={k: "1" for k in COIN_MG},
       rows=[dict(coin="", w="-4.35", ayar="18", op="-18", sp="7", qty="1",
                  stone="", desc="منفی")]),
  dict(rate="24000000", vat="10.005", baseAyar="18", coinSood="3", disc="",
       pos="", trf="", coinPrice={k: "1" for k in COIN_MG},
       rows=[dict(coin="", w="12.7255", ayar="18.005", op="17.555", sp="6.555",
                  qty="1", stone="", desc="گرد")]),
]
for e in EDGE:
    while len(e["rows"]) < 6:
        e["rows"].append(dict(coin="", w="", ayar="", op="", sp="", qty="",
                              stone="", desc=""))

if __name__ == "__main__":
    rng = random.Random(20260912)
    cases = EDGE + [gen(rng) for _ in range(600)]
    out = [dict(case=c, exp=compute(c)) for c in cases]
    json.dump(out, open("/tmp/stress.json", "w"), ensure_ascii=False)
    print("cases:", len(out))
