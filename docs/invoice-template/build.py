# -*- coding: utf-8 -*-
import base64, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fanum import fa, money, dec, to_words

BASE = os.environ.get("INVOICE_BASE", os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VZ = os.path.join(BASE, "package/fonts/webfonts")
CG = os.path.join(BASE, "cg/package/files")

def b64(p):
    with open(p, "rb") as f:
        return base64.b64encode(f.read()).decode()

face = []
for name, w in [("Thin",100),("ExtraLight",200),("Light",300),("Regular",400),
                ("Medium",500),("SemiBold",600),("Bold",700),("ExtraBold",800),("Black",900)]:
    face.append("@font-face{font-family:'Vazirmatn';font-style:normal;font-weight:%d;"
                "src:url(data:font/woff2;base64,%s) format('woff2');}"
                % (w, b64(os.path.join(VZ, "Vazirmatn-%s.woff2" % name))))
for w in [300,400,500,600,700]:
    face.append("@font-face{font-family:'Cormorant';font-style:normal;font-weight:%d;"
                "src:url(data:font/woff2;base64,%s) format('woff2');}"
                % (w, b64(os.path.join(CG, "cormorant-garamond-latin-%d-normal.woff2" % w))))
FONTS = "\n".join(face)

# ---------------- data ----------------
RATE = 11_250_000          # tooman per gram, 18k
SOOD = 0.07                # seller profit
VAT  = 0.10                # VAT on (ojrat + sood)
DISCOUNT = 2_000_000

items = [
    dict(code="GR-۱۰۲۴۷", name="انگشتر زنانه طرح گل",
         spec="ساخت ایتالیا • رنگ زرد • سایز ۵۴ • انگ IR-۲۲۸۱",
         ayar="۱۸ (۷۵۰)", qty=1, w=4.350, ojrat=0.18, stone=0),
    dict(code="BR-۲۰۸۳۱", name="دستبند النگویی بافت حصیری",
         spec="ساخت ایران • رنگ زرد • طول ۱۸.۵ سانتی‌متر • قفل ایمنی",
         ayar="۱۸ (۷۵۰)", qty=1, w=12.720, ojrat=0.14, stone=0),
    dict(code="NL-۳۳۵۶۹", name="گردنبند کارتیه با پلاک اسم",
         spec="ساخت ترکیه • رنگ زرد و سفید • طول ۴۵ سانتی‌متر • حکاکی لیزری",
         ayar="۱۸ (۷۵۰)", qty=1, w=6.840, ojrat=0.22, stone=0),
    dict(code="DR-۴۷۱۰۲", name="حلقه جواهر تک‌نگین برلیان",
         spec="برلیان ۰.۲۵ قیراط • رنگ F • کلاریتی VS۱ • تراش Round • شناسنامه GIA",
         ayar="۱۸ (۷۵۰)", qty=1, w=3.200, ojrat=0.35, stone=58_000_000),
]

rows = []
T = dict(w=0, gold=0, ojrat=0, sood=0, stone=0, vat=0, total=0, qty=0)
for i, it in enumerate(items, 1):
    gold  = it["w"] * RATE
    ojrat = gold * it["ojrat"]
    sood  = (gold + ojrat) * SOOD
    vat   = (ojrat + sood) * VAT
    total = gold + ojrat + sood + it["stone"] + vat
    T["w"] += it["w"]; T["gold"] += gold; T["ojrat"] += ojrat; T["sood"] += sood
    T["stone"] += it["stone"]; T["vat"] += vat; T["total"] += total; T["qty"] += it["qty"]
    rows.append("""
    <tr>
      <td class="c num">%s</td>
      <td class="desc">
        <div class="d-name">%s</div>
        <div class="d-spec">%s</div>
        <div class="d-code">کد کالا: %s</div>
      </td>
      <td class="c">%s</td>
      <td class="c num">%s</td>
      <td class="c num strong">%s</td>
      <td class="m">%s</td>
      <td class="m">%s<span class="chip">%s٪</span></td>
      <td class="m">%s<span class="chip">%s٪</span></td>
      <td class="m">%s</td>
      <td class="m">%s</td>
      <td class="m total">%s</td>
    </tr>""" % (
        fa(i), it["name"], it["spec"], it["code"], it["ayar"], fa(it["qty"]),
        dec(it["w"]), money(gold), money(ojrat), fa(int(it["ojrat"]*100)),
        money(sood), fa(int(SOOD*100)),
        (money(it["stone"]) if it["stone"] else "—"), money(vat), money(total)))

grand = T["total"] - DISCOUNT
payable = int(round(grand / 1000.0)) * 1000
rounding = payable - grand
words = to_words(payable) + " تومان"
paid_pos = 300_000_000
paid_transfer = payable - paid_pos

V = {
  "FONTS": FONTS,
  "ROWS": "".join(rows),
  "RATE": money(RATE),
  "MESGHAL": money(48_730_000),
  "OUNCE": fa("۳,۴۸۵"),
  "TW": dec(T["w"]),
  "TQTY": fa(T["qty"]),
  "TGOLD": money(T["gold"]),
  "TOJRAT": money(T["ojrat"]),
  "TSOOD": money(T["sood"]),
  "TSTONE": money(T["stone"]),
  "TVAT": money(T["vat"]),
  "SUBTOTAL": money(T["total"]),
  "DISCOUNT": money(DISCOUNT),
  "ROUND": ("−" if rounding < 0 else "+") + money(abs(rounding)),
  "PAYABLE": money(payable),
  "WORDS": words,
  "POS": money(paid_pos),
  "TRANSFER": money(paid_transfer),
  "REMAIN": money(0),
}

TPL = open(os.path.join(os.path.dirname(os.path.abspath(__file__)), "template.html"), encoding="utf-8").read()
for k, v in V.items():
    TPL = TPL.replace("{{%s}}" % k, str(v))
out = os.path.join(BASE, "invoice.html")
open(out, "w", encoding="utf-8").write(TPL)
print("written", out, len(TPL))
print("payable:", money(payable), "|", words)
