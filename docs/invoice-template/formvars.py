# -*- coding: utf-8 -*-
"""Values for the fill-in-the-browser variant (build.py --form).

Styles live in form.css and the calculation engine in form.js, so both can be
edited as real CSS/JS instead of as escaped Python strings.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))


def _read(name):
    with open(os.path.join(HERE, name), encoding="utf-8") as f:
        return f.read()

ROWS = 6

def inp(i, cls="", extra=""):
    return '<input id="%s" class="i %s" autocomplete="off" spellcheck="false" %s>' % (i, cls, extra)

def out(name, cls=""):
    return '<span class="o o-%s %s"></span>' % (name, cls)

def build(fa):
    rows = []
    for i in range(1, ROWS + 1):
        rows.append("""
    <tr class="frow">
      <td class="c num">%s</td>
      <td class="desc">%s</td>
      <td class="c">%s</td>
      <td class="c">%s</td>
      <td class="c">%s</td>
      <td class="m">%s</td>
      <td class="m">%s<span class="chip noprint">اجرت%s٪ · سود%s٪</span></td>
      <td class="m">%s</td>
      <td class="m">%s</td>
      <td class="m total">%s</td>
    </tr>""" % (
            fa(i),
            inp("d%d" % i, "u dsc"),
            inp("k%d" % i, "u ctr", 'data-fmt="int"'),
            inp("q%d" % i, "u ctr", 'data-fmt="int"'),
            inp("w%d" % i, "u ctr", 'inputmode="decimal" data-fmt="dec"'),
            out("g%d" % i),
            out("mk%d" % i),
            inp("op%d" % i, "ci", 'inputmode="decimal" data-fmt="int"'),
            inp("sp%d" % i, "ci", 'inputmode="decimal" data-fmt="int"'),
            inp("st%d" % i, "u ctr", 'inputmode="numeric" data-fmt="money"'),
            out("v%d" % i),
            out("t%d" % i)))

    V = {
        "BODYCLASS": "form",
        "ROWS": "".join(rows),
        "ROWH": "8.4mm",
        "SHOPNAME": inp("shop", "hdr", 'style="padding-right:19mm"'),
        "SHOPADDR": inp("shopaddr", "hdr", 'style="padding-right:12mm"'),
        "INVNO": inp("invno", "u"), "IDATE": inp("idate", "u"),
        "ITIME": inp("itime", "u"), "TAXID": inp("taxid", "u"),
        "S_NAME": inp("sname"), "S_LIC": inp("slic"), "S_NID": inp("snid"),
        "S_ADDR": inp("saddr"), "S_TEL": inp("stel"), "S_ZIP": inp("szip"),
        "B_NAME": inp("bname"), "B_NID": inp("bnid"), "B_TEL": inp("btel"),
        "B_ADDR": inp("baddr"), "B_ZIP": inp("bzip"), "B_ECON": inp("becon"),
        "RATE": inp("rate", "u", 'inputmode="numeric" data-fmt="money"'), "U1": "تومان",
        "MESGHAL": inp("mes", "u", 'inputmode="numeric" data-fmt="money"'), "U2": "تومان",
        "OUNCE": inp("ounce", "u", 'inputmode="numeric" data-fmt="money"'), "U3": "دلار",
        "RVALID": inp("rvalid", "u"),
        "TQTY": out("tqty"), "TW": out("tw"), "TGOLD": out("tgold"),
        "TOJRAT": out("tmk"), "TSOOD": "", "TSTONE": out("tstone"),
        "TVAT": out("tvat"), "SUBTOTAL": out("subtotal"),
        "DISCOUNT": inp("disc", "u ltr", 'inputmode="numeric" data-fmt="money"'),
        "ROUND": out("round"), "PAYABLE": out("payable"), "WORDS": out("words"),
        "POS": inp("pos", "u ltr", 'inputmode="numeric" data-fmt="money"'),
        "TRANSFER": inp("trf", "u ltr", 'inputmode="numeric" data-fmt="money"'),
        "REMAIN": out("rem"),
        "NOTES": "".join('<div class="nl">%s</div>' % inp("n%d" % i, "nli")
                         for i in range(1, 4)),
        "TOOLBAR": TOOLBAR,
        "EXTRACSS": "\n" + _read("form.css"),
        "EXTRAJS": "<script>\n" + _read("form.js").replace("__ROWS__", str(ROWS)) + "\n</script>",
    }
    return V


TOOLBAR = """
<div class="toolbar noprint">
  <button class="btn primary" onclick="window.print()">🖨 چاپ / ذخیره PDF</button>
  <button class="btn" onclick="newInvoice()">فرم جدید</button>
  <span class="sep"></span>
  <label>سود پیش‌فرض <input id="soodDef" class="tin" value="۷" inputmode="decimal">٪</label>
  <label>مالیات <input id="vatp" class="tin" value="۱۰" inputmode="decimal">٪</label>
  <label title="درصد اجرتی که خودتان موقع خرید کالا پرداخت کرده‌اید">اجرت خرید <input id="buyOjrat" class="tin" placeholder="—" inputmode="decimal">٪</label>
  <span class="sep"></span>
  <span class="profit">سود شما در این فاکتور: <b id="myprofit">۰</b> تومان</span>
  <span class="note">این نوار و درصدها فقط برای شماست و چاپ نمی‌شود · ورودی‌ها خودکار در همین مرورگر ذخیره می‌شوند · هنگام چاپ: Margins=None و Background graphics روشن</span>
</div>
<details class="calcpanel noprint" open>
  <summary>کاربرگ محاسبه <span>— ریاضی کامل هر ردیف، فقط برای شما · روی فاکتور چاپ نمی‌شود</span></summary>
  <div class="cp-body" id="cpbody"></div>
</details>
"""
