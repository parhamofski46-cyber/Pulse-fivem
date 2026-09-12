#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""نرخ روز طلا و سکه را از چند منبع می‌گیرد و در prices.json می‌نویسد.

روی سرور GitHub اجرا می‌شود، بنابراین محدودیت CORS مرورگر را ندارد. خروجی از
raw.githubusercontent.com با هدر Access-Control-Allow-Origin: * سرو می‌شود و
فرم فاکتور می‌تواند مستقیم بخواندش.
"""
import json, os, re, sys, urllib.request, datetime

TIMEOUT = 20
UA = {"User-Agent": "Mozilla/5.0 (compatible; gold-price-bot/1.0)"}
FIELDS = ["rate", "mes", "ounce", "pc_emami", "pc_bahar", "pc_nim", "pc_rob", "pc_gerami"]

def get(url):
    req = urllib.request.Request(url, headers=UA)
    with urllib.request.urlopen(req, timeout=TIMEOUT) as r:
        return json.loads(r.read().decode("utf-8", "replace"))

def num(v):
    if v is None:
        return 0
    t = re.sub(r"[^\d.]", "", str(v).translate(str.maketrans("۰۱۲۳۴۵۶۷۸۹", "0123456789")))
    try:
        x = float(t)
    except ValueError:
        return 0
    return x if x > 0 else 0

def sane(field, toman):
    if not toman:
        return False
    if field == "ounce":
        return toman < 1e7                     # انس دلاری است
    return 1e4 < toman < 1e13

def normalise(raw, unit):
    out, div = {}, (10 if unit == "rial" else 1)
    for f in FIELDS:
        v = num(raw.get(f))
        if not v:
            continue
        t = round(v if f == "ounce" else v / div)
        if sane(f, t):
            out[f] = t
    return out

# ---------------------------------------------------------------- sources
def from_tgju():
    paths = {"rate": ("geram18",), "mes": ("mesghal",), "ounce": ("ons",),
             "pc_emami": ("sekee",), "pc_bahar": ("sekeb",), "pc_nim": ("nim",),
             "pc_rob": ("rob",), "pc_gerami": ("gerami",)}
    last = None
    for host in ("call1", "call3", "call5", "call2"):
        try:
            j = get("https://%s.tgju.org/ajax.json" % host)
            cur = j.get("current") or {}
            raw = {f: (cur.get(k[0]) or {}).get("p") for f, k in paths.items()}
            vals = normalise(raw, "rial")
            if len(vals) >= 4:
                return vals, "tgju/" + host
        except Exception as e:                 # به منبع بعدی
            last = e
    if last:
        print("tgju failed:", last, file=sys.stderr)
    return None, None

def from_navasan():
    key = os.environ.get("NAVASAN_KEY", "").strip()
    if not key:
        return None, None
    try:
        j = get("https://api.navasan.tech/latest/?api_key=" + key)
        raw = {"rate": (j.get("18ayar") or {}).get("value"),
               "mes": (j.get("mesghal") or {}).get("value"),
               "ounce": (j.get("ons") or {}).get("value"),
               "pc_emami": (j.get("sekee") or {}).get("value"),
               "pc_bahar": (j.get("sekeb") or {}).get("value"),
               "pc_nim": (j.get("nim") or {}).get("value"),
               "pc_rob": (j.get("rob") or {}).get("value"),
               "pc_gerami": (j.get("gerami") or {}).get("value")}
        vals = normalise(raw, "rial")
        if len(vals) >= 4:
            return vals, "navasan"
    except Exception as e:
        print("navasan failed:", e, file=sys.stderr)
    return None, None

def from_brsapi():
    key = os.environ.get("BRSAPI_KEY", "").strip()
    if not key:
        return None, None
    names = {"rate": "طلای 18 عیار", "mes": "مثقال طلا", "ounce": "انس طلا",
             "pc_emami": "سکه امامی", "pc_bahar": "سکه بهار آزادی",
             "pc_nim": "نیم سکه", "pc_rob": "ربع سکه", "pc_gerami": "سکه گرمی"}
    try:
        j = get("https://brsapi.ir/Api/Market/Gold_Currency.php?key=" + key)
        items = j.get("gold") or []
        idx = {re.sub(r"\s+", " ", str(i.get("name", "")).strip()): i.get("price") for i in items}
        raw = {f: idx.get(n) for f, n in names.items()}
        vals = normalise(raw, "toman")
        if len(vals) >= 4:
            return vals, "brsapi"
    except Exception as e:
        print("brsapi failed:", e, file=sys.stderr)
    return None, None

def main():
    here = os.path.dirname(os.path.abspath(__file__))
    target = os.path.join(here, "prices.json")
    for src in (from_brsapi, from_navasan, from_tgju):
        vals, name = src()
        if vals:
            doc = {"t": datetime.datetime.now(datetime.timezone.utc)
                          .replace(microsecond=0).isoformat().replace("+00:00", "Z"),
                   "src": name, "unit": "toman"}
            doc.update(vals)
            with open(target, "w", encoding="utf-8") as f:
                json.dump(doc, f, ensure_ascii=False, indent=1)
                f.write("\n")
            print("wrote", target, "from", name, "fields:", len(vals))
            return 0
    print("همه منابع ناموفق بودند؛ فایل قبلی دست‌نخورده ماند.", file=sys.stderr)
    return 1 if not os.path.exists(target) else 0

if __name__ == "__main__":
    sys.exit(main())
