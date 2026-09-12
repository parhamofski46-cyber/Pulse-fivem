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

ROWTYPE = ('<span class="rowtype noprint"><select id="ty%d" class="tysel">'
           '<option value="">طلا</option>%s</select></span>')

COINS = [("emami", "تمام سکه امامی"), ("bahar", "تمام بهار آزادی"),
         ("nim", "نیم‌سکه"), ("rob", "ربع‌سکه"), ("gerami", "سکه گرمی")]
COIN_OPTIONS = "".join('<option value="%s">%s</option>' % (k, n) for k, n in COINS)


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
            inp("d%d" % i, "u dsc") + ROWTYPE % (i, COIN_OPTIONS),
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
        "ROWH": "7.6mm",
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
        "BASEAYAR": '<span class="o o-baseayar">۱۸</span>',
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
  <label title="نرخ هر گرمی که وارد می‌کنید مربوط به کدام عیار است">نرخ برای عیار <input id="baseAyar" class="tin" value="۱۸" inputmode="decimal"></label>
  <label title="درصد اجرتی که خودتان موقع خرید کالا پرداخت کرده‌اید">اجرت خرید <input id="buyOjrat" class="tin" placeholder="—" inputmode="decimal">٪</label>
  <span class="sep"></span>
  <label class="chk"><input type="checkbox" id="showCalc"><span>نمایش محاسبات</span></label>
  <label class="chk"><input type="checkbox" id="coinMode"><span>فروش سکه</span></label>
  <span class="sep"></span>
  <span class="profit">سود شما در این فاکتور: <b id="myprofit">۰</b> تومان</span>
  <span class="note">این نوار فقط برای شماست و چاپ نمی‌شود · ورودی‌ها خودکار ذخیره می‌شوند · هنگام چاپ: Margins=None و Background graphics روشن</span>
</div>

<div class="livebar noprint">
  <span class="lb-h">نرخ‌های زنده</span>
  <span class="lb-status" id="lbStatus">آماده</span>
  <button class="btn sm" id="lbNow" type="button">به‌روزرسانی</button>
  <label class="chk"><input type="checkbox" id="lbAuto" class="cfgf" checked><span>خودکار</span></label>
  <button class="btn sm lock" id="lbLock" type="button" hidden></button>
  <label class="chk" title="اگر منبع اجازه خواندن مستقیم ندهد، از یک واسطه عمومی رد می‌شود"><input type="checkbox" id="lbProxy" class="cfgf" checked><span>واسطه در صورت نیاز</span></label>
  <button class="btn sm" id="lbWhy" type="button" hidden>جزئیات</button>
  <button class="btn sm" id="lbCfgBtn" type="button">تنظیم منبع</button>
  <span class="lb-note">هر نرخی که دستی تایپ کنید قفل می‌شود و به‌روزرسانی خودکار آن را عوض نمی‌کند</span>
</div>
<div class="lb-flag noprint" id="lbFlag" hidden></div>
<div class="lb-diag noprint" id="lbDiag" hidden></div>
<div class="livecfg noprint" id="livecfg" hidden>
  <label>منبع
    <select id="lbPreset" class="cfgf">
      <option value="github">فید خودتان روی GitHub — مطمئن‌ترین</option>
      <option value="tgju">TGJU — بدون کلید</option>
      <option value="navasan">نوسان — نیازمند کلید</option>
      <option value="brsapi">BrsApi — نیازمند کلید</option>
      <option value="custom">سفارشی</option>
    </select>
  </label>
  <label>کلید API <input id="lbKey" class="tin wide cfgf" placeholder="اگر منبع کلید می‌خواهد"></label>
  <label>واحد منبع
    <select id="lbUnit" class="cfgf"><option value="rial">ریال</option><option value="toman">تومان</option></select>
  </label>
  <label class="grow">آدرس (خالی بگذارید تا پیش‌فرض منبع استفاده شود)
    <input id="lbUrl" class="tin url cfgf" spellcheck="false"></label>
  <label class="grow">نگاشت فیلدها — JSON (خالی = نگاشت پیش‌فرض منبع)
    <textarea id="lbMap" class="cfgf" rows="3" spellcheck="false"></textarea></label>
  <div class="lb-actions">
    <button class="btn sm" id="lbTest" type="button">آزمایش اتصال</button>
    <span id="lbTestOut" class="lb-testout"></span>
  </div>
</div>

<div class="coinbar noprint">
  <span class="cb-h">نرخ روز سکه</span>
  <label>تمام امامی <input id="pc_emami" class="tin wide" inputmode="numeric" data-fmt="money"></label>
  <label>تمام بهار آزادی <input id="pc_bahar" class="tin wide" inputmode="numeric" data-fmt="money"></label>
  <label>نیم‌سکه <input id="pc_nim" class="tin wide" inputmode="numeric" data-fmt="money"></label>
  <label>ربع‌سکه <input id="pc_rob" class="tin wide" inputmode="numeric" data-fmt="money"></label>
  <label>سکه گرمی <input id="pc_gerami" class="tin wide" inputmode="numeric" data-fmt="money"></label>
  <span class="sep"></span>
  <label title="سود شما روی هر سکه — روی فاکتور به‌صورت «اجرت و کارمزد» نوشته می‌شود">سود روی سکه <input id="coinSood" class="tin" value="۳" inputmode="decimal">٪</label>
  <span class="cb-note">در هر ردیف، زیر شرح کالا، نوع سکه را انتخاب کنید؛ وزن و عیار خودکار پر می‌شود</span>
</div>

<section class="calcpanel noprint" id="calcpanel">
  <div class="cp-head">کاربرگ محاسبه <span>— ریاضی کامل هر ردیف، فقط برای شما · روی فاکتور چاپ نمی‌شود</span></div>
  <div class="cp-body" id="cpbody"></div>
</section>
"""
