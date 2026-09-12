# -*- coding: utf-8 -*-
"""Renders the jewelry invoice HTML.

    python3 build.py            -> invoice.html        (نمونه پرشده)
    python3 build.py --blank    -> invoice-blank.html  (نسخه کاملاً خالی)
"""
import base64, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from fanum import fa, money, dec, to_words

HERE = os.path.dirname(os.path.abspath(__file__))
BASE = os.environ.get("INVOICE_BASE", os.path.dirname(HERE))
VZ = os.path.join(BASE, "package/fonts/webfonts")
CG = os.path.join(BASE, "cg/package/files")
BLANK = "--blank" in sys.argv
FORM  = "--form" in sys.argv

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

# ------------------------------------------------------------------ data
RATE     = 11_250_000   # تومان — هر گرم طلای ۱۸ عیار
SOOD     = 0.07         # سود فروشنده
VAT      = 0.10         # مالیات بر ارزش افزوده (بر اجرت + سود)
DISCOUNT = 2_000_000
BLANK_ROWS = 6

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
         spec="برلیان ۰.۲۵ قیراط • رنگ F • کلاریتی VS۱ • شناسنامه GIA",
         ayar="۱۸ (۷۵۰)", qty=1, w=3.200, ojrat=0.35, stone=58_000_000),
]

if FORM:
    import formvars
    V = formvars.build(fa)
elif BLANK:
    V = {k: "" for k in ("INVNO IDATE ITIME TAXID B_NAME B_NID B_TEL B_ADDR B_ZIP B_ECON "
                         "RATE MESGHAL OUNCE RVALID U1 U2 U3 TQTY TW TGOLD TOJRAT TSOOD "
                         "TSTONE TVAT SUBTOTAL WORDS POS TRANSFER REMAIN DISCOUNT ROUND "
                         "PAYABLE").split()}
    V["BODYCLASS"] = "blank"
    V["ROWS"] = "".join(
        '<tr class="blank"><td class="c num">%s</td><td class="desc"></td><td></td><td></td>'
        '<td></td><td></td><td></td><td></td><td></td><td></td></tr>' % fa(i)
        for i in range(1, BLANK_ROWS + 1))
    V["ROWH"] = "8mm"
else:
    rows = []
    T = dict(w=0, gold=0, ojrat=0, sood=0, stone=0, vat=0, total=0, qty=0)
    for i, it in enumerate(items, 1):
        # round every component so the printed figures add up exactly
        gold   = round(it["w"] * RATE)
        ojrat  = round(gold * it["ojrat"])
        sood   = round((gold + ojrat) * SOOD)
        making = ojrat + sood          # اجرت و کارمزد ساخت (سود داخل آن ادغام شده)
        vat    = round(making * VAT)
        total  = gold + making + it["stone"] + vat
        T["w"] += it["w"]; T["gold"] += gold; T["ojrat"] += ojrat; T["sood"] += sood
        T["stone"] += it["stone"]; T["vat"] += vat; T["total"] += total; T["qty"] += it["qty"]
        rows.append("""
    <tr>
      <td class="c num">%s</td>
      <td class="desc">
        <div class="d-name">%s</div>
        <div class="d-spec">%s <span class="d-code">• کد کالا: %s</span></div>
      </td>
      <td class="c">%s</td>
      <td class="c num">%s</td>
      <td class="c num strong">%s</td>
      <td class="m">%s</td>
      <td class="m">%s</td>
      <td class="m">%s</td>
      <td class="m">%s</td>
      <td class="m total">%s</td>
    </tr>""" % (
            fa(i), it["name"], it["spec"], it["code"], it["ayar"], fa(it["qty"]),
            dec(it["w"]), money(gold), money(making),
            (money(it["stone"]) if it["stone"] else "—"), money(vat), money(total)))

    grand    = T["total"] - DISCOUNT
    payable  = int(round(grand / 1000.0)) * 1000
    rounding = payable - grand
    paid_pos = 300_000_000

    V = {
      "ROWS": "".join(rows), "ROWH": "auto", "BODYCLASS": "",
      "INVNO": "۱۴۰۵/۰۴-۰۸۷۳", "IDATE": "۱۴۰۵/۰۶/۱۶", "ITIME": "۱۷:۴۲",
      "TAXID": "A۱B۲-۰۸۷۳-۱۴۰۵",
      "B_NAME": "سرکار خانم سارا محمدی", "B_NID": "۰۰۲۳۴۵۶۷۸۹",
      "B_TEL": '<bdi dir="ltr">۰۹۱۲ ۳۴۵ ۶۷۸۹</bdi>',
      "B_ADDR": "تهران، خیابان ولیعصر، کوچه بهار، پلاک ۲۴، واحد ۷",
      "B_ZIP": "۱۴۳۴۶۷۸۹۱۰", "B_ECON": "—",
      "RATE": money(RATE), "U1": "تومان",
      "MESGHAL": money(48_730_000), "U2": "تومان",
      "OUNCE": fa("۳,۴۸۵"), "U3": "دلار",
      "RVALID": "۱۴۰۵/۰۶/۱۶ <i>ساعت ۱۷:۰۰</i>",
      "TQTY": fa(T["qty"]), "TW": dec(T["w"]),
      "TGOLD": money(T["gold"]), "TOJRAT": money(T["ojrat"] + T["sood"]), "TSOOD": "",
      "TSTONE": money(T["stone"]), "TVAT": money(T["vat"]), "SUBTOTAL": money(T["total"]),
      "DISCOUNT": "−" + money(DISCOUNT),
      "ROUND": ("−" if rounding < 0 else "+") + money(abs(rounding)),
      "PAYABLE": money(payable), "WORDS": to_words(payable) + " تومان",
      "POS": money(paid_pos), "TRANSFER": money(payable - paid_pos), "REMAIN": money(0),
    }

V.setdefault("BASEAYAR", "۱۸")
V.setdefault("TOOLBAR", "")
V.setdefault("EXTRACSS", "")
V.setdefault("EXTRAJS", "")
for _k in "S_NAME S_LIC S_NID S_ADDR S_TEL S_ZIP".split():
    V.setdefault(_k, "")
V.setdefault("NOTES", '<div class="nl"></div><div class="nl"></div><div class="nl"></div>')
V.setdefault("SHOPNAME", "")
V.setdefault("SHOPADDR", "")
V["FONTS"] = FONTS
html = open(os.path.join(HERE, "template.html"), encoding="utf-8").read()
for k, v in V.items():
    html = html.replace("{{%s}}" % k, str(v))

out = os.path.join(BASE, "invoice-form.html" if FORM else "invoice-blank.html" if BLANK else "invoice.html")
open(out, "w", encoding="utf-8").write(html)
print("written", out)
