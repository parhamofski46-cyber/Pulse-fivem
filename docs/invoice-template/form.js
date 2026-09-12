(function(){
  "use strict";
  var N = __ROWS__;
  var FA = "۰۱۲۳۴۵۶۷۸۹", AR = "٠١٢٣٤٥٦٧٨٩";

  /* ---------- digits ---------- */
  function en(s){
    s = String(s == null ? "" : s);
    var o = "";
    for (var i = 0; i < s.length; i++){
      var c = s[i], k = FA.indexOf(c);
      if (k < 0) k = AR.indexOf(c);
      if (k >= 0) o += k;
      else if (c >= "0" && c <= "9") o += c;
      else if (c === "." || c === "-") o += c;
    }
    return o;
  }
  function fa(s){ return String(s).replace(/[0-9]/g, function(d){ return FA[+d]; }); }
  function faDigits(s){ return String(s == null ? "" : s).replace(/[0-9]/g, function(d){ return FA[+d]; }); }
  function grp(s){ return String(s).replace(/\B(?=(\d{3})+(?!\d))/g, ","); }

  /* ---------- exact integer arithmetic ----------
     Every amount is a BigInt in whole toman, so nothing is ever held as a
     binary float. Weights are kept in milligrams and rates in basis points,
     which keeps 12.725 g or 17.5٪ exact no matter how large the numbers get. */
  var ZERO = BigInt(0), TEN = BigInt(10);
  function pow10(n){ var r = BigInt(1); for (var i = 0; i < n; i++) r *= TEN; return r; }
  var K1000 = pow10(3), K10000 = pow10(4);

  function scaled(v, dec){            // "12.725" , 3  ->  12725n
    var s = en(v).trim();
    if (!s) return ZERO;
    var neg = s.charAt(0) === "-";
    if (neg) s = s.slice(1);
    var p = s.split("."), ip = p[0] || "0", fp = p[1] || "";
    while (fp.length < dec) fp += "0";
    fp = fp.slice(0, dec);
    if (!/^\d*$/.test(ip) || !/^\d*$/.test(fp)) return ZERO;
    var r = BigInt(ip || "0") * pow10(dec) + BigInt(fp || "0");
    return neg ? -r : r;
  }
  function divRound(a, b){            // round half away from zero
    if (a < ZERO) return -divRound(-a, b);
    return (a + b / BigInt(2)) / b;
  }
  function money(n){ return n && n !== ZERO ? fa(grp(n.toString())) : ""; }
  function money0(n){ return money(n) || "۰"; }
  function weight(mg){                // 12725n -> "۱۲.۷۲۵"
    if (!mg || mg === ZERO) return "";
    var ip = mg / K1000, fp = (mg % K1000).toString();
    while (fp.length < 3) fp = "0" + fp;
    return fa(grp(ip.toString()) + "." + fp);
  }
  function pct(bp){                   // 1750n -> "۱۷.۵"
    var whole = bp / pow10(2), frac = bp % pow10(2);
    var s = whole.toString();
    if (frac !== ZERO){
      var f = frac.toString();
      while (f.length < 2) f = "0" + f;
      s += "." + f.replace(/0+$/, "");
    }
    return fa(s);
  }
  /* عیار: قبول هم به مقیاس عیار (۱۸، ۲۱، ۲۴) و هم به مقیاس هزارم (۷۵۰، ۸۷۵، ۱۰۰۰).
     به‌صورت کسر دقیق نگه داشته می‌شود تا ۲۲ عیار (۰.۹۱۶۶…) گرد نشود. */
  var K100 = pow10(2), K24000 = BigInt(24000), K1000000 = pow10(6);
  function purity(v){
    var x = scaled(v, 3);                       // milli-units of whatever was typed
    if (x <= ZERO) return null;
    return x < K100 * K1000 ? { n: x, d: K24000 }   // 6..99  -> karat scale
                            : { n: x, d: K1000000 }; // 100+   -> per-mille scale
  }
  function ayarNum(v){
    var p = purity(v);
    return p ? pct(divRound(p.n * K100, K1000)) : "";
  }
  function ayarUnit(v){
    var p = purity(v);
    return !p || p.d === K24000 ? "عیار" : "هزارم";
  }
  function ayarText(v){
    return purity(v) ? ayarNum(v) + " " + ayarUnit(v) : "";
  }
  function ayarRatio(item, base){          // compact when both share a scale
    if (ayarUnit(item) === ayarUnit(base))
      return "(" + ayarNum(item) + " ÷ " + ayarNum(base) + " " + ayarUnit(base) + ")";
    return "(" + ayarText(item) + " ÷ " + ayarText(base) + ")";
  }

  function ratio(part, whole){        // two decimals, exact
    if (!whole || whole === ZERO) return "۰";
    var bp = divRound(part * K10000, whole);
    return pct(bp);
  }

  /* ---------- amount in words ---------- */
  var ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"];
  var TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"];
  var TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"];
  var HUND = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"];
  var SCALE = ["", " هزار", " میلیون", " میلیارد", " بیلیون", " تریلیون"];
  var AND = " و ";
  function three(n){
    var p = [], h = Math.floor(n / 100), r = n % 100;
    if (h) p.push(HUND[h]);
    if (r >= 10 && r < 20) p.push(TEENS[r - 10]);
    else {
      var t = Math.floor(r / 10), o = r % 10;
      if (t) p.push(TENS[t]);
      if (o) p.push(ONES[o]);
    }
    return p.join(AND);
  }
  function words(n){
    if (!n || n === ZERO) return "";
    var g = [], i = 0;
    while (n > ZERO && i < SCALE.length){
      var q = Number(n % K1000);
      n = n / K1000;
      if (q) g.push(three(q) + SCALE[i]);
      i++;
    }
    if (n > ZERO) return "";          // beyond the named scales
    return g.reverse().join(AND) + " تومان";
  }

  /* ---------- dom ---------- */
  var $ = function(id){ return document.getElementById(id); };
  function set(name, txt){
    var els = document.querySelectorAll(".o-" + name);
    for (var i = 0; i < els.length; i++) els[i].textContent = txt;
  }
  function esc(s){
    return String(s).replace(/[&<>]/g, function(c){
      return c === "&" ? "&amp;" : c === "<" ? "&lt;" : "&gt;";
    });
  }
  function rowUsed(i){
    return scaled($("w" + i).value, 3) > ZERO ||
           scaled($("st" + i).value, 0) > ZERO ||
           ($("d" + i).value || "").trim() !== "";
  }

  /* ---------- the one calculation ---------- */
  function calc(){
    var rate  = scaled($("rate").value, 0);
    var vatBp = scaled($("vatp").value, 2);
    var base  = purity($("baseAyar").value) || { n: BigInt(18000), d: K24000 };
    set("baseayar", ayarText($("baseAyar").value).replace(" عیار", "").replace(" هزارم", ""));
    var T = { mg: ZERO, qty: 0, gold: ZERO, ojrat: ZERO, sood: ZERO,
              mk: ZERO, stone: ZERO, vat: ZERO, tot: ZERO };
    var steps = [];

    for (var i = 1; i <= N; i++){
      var mg    = scaled($("w" + i).value, 3);
      var opBp  = scaled($("op" + i).value, 2);
      var spBp  = scaled($("sp" + i).value, 2);
      var stone = scaled($("st" + i).value, 0);
      var qty   = parseInt(en($("q" + i).value), 10) || 0;
      var used  = rowUsed(i);

      // ارزش طلا = وزن × نرخ × (عیار کالا ÷ عیار مبنای نرخ) — یک بار گرد می‌شود
      var pi = purity($("k" + i).value) || base;
      var gold = divRound(mg * rate * pi.n * base.d, K1000 * pi.d * base.n);
      var ojrat = divRound(gold * opBp, K10000);
      var sood  = divRound((gold + ojrat) * spBp, K10000);
      var mk    = ojrat + sood;
      var vat   = divRound(mk * vatBp, K10000);
      var tot   = gold + mk + stone + vat;

      set("g" + i,  used ? money(gold) : "");
      set("mk" + i, used ? money(mk)   : "");
      set("v" + i,  used ? money(vat)  : "");
      set("t" + i,  used ? money(tot)  : "");

      if (used){
        T.mg += mg; T.qty += qty; T.gold += gold; T.ojrat += ojrat;
        T.sood += sood; T.mk += mk; T.stone += stone; T.vat += vat; T.tot += tot;
        steps.push({ i: i, name: ($("d" + i).value || "").trim(), mg: mg, rate: rate,
                     ayar: $("k" + i).value, sameAyar: pi.n * base.d === base.n * pi.d,
                     opBp: opBp, spBp: spBp, vatBp: vatBp, gold: gold, ojrat: ojrat,
                     sood: sood, mk: mk, stone: stone, vat: vat, tot: tot });
      }
    }

    set("tw",       weight(T.mg));
    set("tqty",     T.qty ? fa(T.qty) : "");
    set("tgold",    money(T.gold));
    set("tmk",      money(T.mk));
    set("tstone",   money(T.stone));
    set("tvat",     money(T.vat));
    set("subtotal", money(T.tot));

    var disc = scaled($("disc").value, 0);
    var net  = T.tot - disc;
    if (net < ZERO) net = ZERO;
    var pay  = net > ZERO ? divRound(net, K1000) * K1000 : ZERO;
    var rnd  = pay - net;

    set("round", T.tot > ZERO ? (rnd === ZERO ? "۰" : (rnd < ZERO ? "−" : "+") + money(rnd < ZERO ? -rnd : rnd)) : "");
    set("payable", money(pay));
    set("words", words(pay));

    var paid = scaled($("pos").value, 0) + scaled($("trf").value, 0);
    var rem = pay - paid;
    if (rem < ZERO) rem = ZERO;
    set("rem", T.tot > ZERO ? money0(rem) : "");

    $("myprofit").textContent = money0(T.sood);
    renderPanel(steps, T, disc, pay, rnd);
  }

  /* ---------- the seller's worksheet ---------- */
  function renderPanel(steps, T, disc, pay, rnd){
    var box = $("cpbody");
    if (!box) return;
    if (!steps.length){
      box.innerHTML = '<p class="cp-empty">وزن و نرخ را وارد کنید تا ریاضی کامل هر ردیف اینجا نوشته شود.</p>';
      return;
    }
    var h = '<div class="cp-rows">';
    for (var k = 0; k < steps.length; k++){
      var s = steps[k];
      h += '<div class="cp-row"><div class="cp-rh"><b>ردیف ' + fa(s.i) + '</b>' +
           (s.name ? '<span>' + esc(s.name) + '</span>' : '') + '</div><table class="cp-t">' +
        line("ارزش طلا", weight(s.mg) + " گرم × " + money(s.rate) +
             (s.sameAyar ? "" : " × " + ayarRatio(s.ayar, $("baseAyar").value)),
             money0(s.gold)) +
        line("اجرت " + pct(s.opBp) + "٪", money0(s.gold) + " × " + pct(s.opBp) + "٪", money0(s.ojrat)) +
        line("سود " + pct(s.spBp) + "٪", "(" + money0(s.gold) + " + " + money0(s.ojrat) + ") × " + pct(s.spBp) + "٪", money0(s.sood), "hot") +
        line("اجرت و کارمزد", money0(s.ojrat) + " + " + money0(s.sood), money0(s.mk)) +
        (s.stone > ZERO ? line("سنگ و نگین", "مقطوع", money0(s.stone)) : "") +
        line("مالیات " + pct(s.vatBp) + "٪", money0(s.mk) + " × " + pct(s.vatBp) + "٪", money0(s.vat)) +
        line("مبلغ ردیف", money0(s.gold) + " + " + money0(s.mk) + (s.stone > ZERO ? " + " + money0(s.stone) : "") + " + " + money0(s.vat), money0(s.tot), "tot") +
        '</table></div>';
    }
    h += '</div>';

    var buyBp = scaled($("buyOjrat").value, 2);
    var paidOjrat = divRound(T.gold * buyBp, K10000);
    var diff = T.ojrat - paidOjrat;
    var netProfit = T.sood + diff;

    h += '<div class="cp-sum"><div class="cp-sh">جمع‌بندی</div><table class="cp-t">' +
      line("جمع ارزش طلا", weight(T.mg) + " گرم", money0(T.gold)) +
      line("جمع اجرت دریافتی", "", money0(T.ojrat)) +
      line("جمع سود شما", "", money0(T.sood), "hot") +
      (T.stone > ZERO ? line("جمع سنگ و نگین", "", money0(T.stone)) : "") +
      line("مالیات — سهم دولت", "این مبلغ درآمد شما نیست", money0(T.vat), "warn") +
      line("جمع فاکتور", "", money0(T.tot)) +
      (disc > ZERO ? line("تخفیف", "", "− " + money0(disc)) : "") +
      (rnd !== ZERO ? line("گرد کردن", "", (rnd < ZERO ? "− " : "+ ") + money(rnd < ZERO ? -rnd : rnd)) : "") +
      line("مبلغ قابل پرداخت", "", money0(pay), "tot") +
      line("سود نسبت به ارزش طلا", "", ratio(T.sood, T.gold) + "٪") +
      line("سود نسبت به کل فاکتور", "", ratio(T.sood, T.tot) + "٪") +
      '</table>';

    if (buyBp > ZERO){
      h += '<div class="cp-sh">سود خالص با احتساب اجرت خرید</div><table class="cp-t">' +
        line("اجرت پرداختی شما " + pct(buyBp) + "٪", money0(T.gold) + " × " + pct(buyBp) + "٪", money0(paidOjrat)) +
        line("مابه‌التفاوت اجرت", money0(T.ojrat) + " − " + money0(paidOjrat),
             (diff < ZERO ? "− " : "") + money0(diff < ZERO ? -diff : diff)) +
        line("سود خالص شما", money0(T.sood) + (diff < ZERO ? " − " : " + ") + money0(diff < ZERO ? -diff : diff),
             (netProfit < ZERO ? "− " : "") + money0(netProfit < ZERO ? -netProfit : netProfit), "tot") +
        '</table>';
    } else {
      h += '<p class="cp-hint">اگر درصد اجرتی که خودتان موقع خرید کالا پرداخت کرده‌اید را در نوار بالا وارد کنید، سود خالص واقعی هم اینجا حساب می‌شود.</p>';
    }
    h += '</div>';
    box.innerHTML = h;
  }
  function line(label, work, result, cls){
    return '<tr class="' + (cls || "") + '"><td class="cp-l">' + label + '</td>' +
           '<td class="cp-w">' + (work || "") + '</td>' +
           '<td class="cp-v">' + result + '</td></tr>';
  }

  /* ---------- input formatting ---------- */
  function fmt(el){
    var t = el.getAttribute("data-fmt");
    if (!t){ el.value = faDigits(el.value); return; }
    if (t === "money"){ var v = scaled(el.value, 0); el.value = v > ZERO ? money(v) : ""; }
    else if (t === "dec"){ var mg = scaled(el.value, 3); el.value = weight(mg); }
    else el.value = faDigits(en(el.value));
  }
  function fmtAll(){
    var f = document.querySelectorAll("input.i");
    for (var i = 0; i < f.length; i++) if (f[i].value) fmt(f[i]);
  }

  /* ---------- storage ---------- */
  var KEY = "jewelry-invoice-v1";
  function fields(){ return document.querySelectorAll("input.i,input.tin"); }
  function save(){
    var o = {}, f = fields();
    for (var i = 0; i < f.length; i++) if (f[i].id) o[f[i].id] = f[i].value;
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  function load(){
    var o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    if (!o) return;
    for (var k in o){ var el = $(k); if (el) el.value = o[k]; }
  }
  window.newInvoice = function(){
    if (!confirm("تمام فیلدها پاک شود؟")) return;
    var f = fields();
    for (var i = 0; i < f.length; i++)
      if (f[i].id !== "vatp" && f[i].id !== "soodDef" && f[i].id !== "buyOjrat") f[i].value = "";
    try { localStorage.removeItem(KEY); } catch (e) {}
    defaults(); calc();
  };
  function defaults(){
    var sd = $("soodDef").value || "۷";
    for (var i = 1; i <= N; i++){
      if (i === 1 || rowUsed(i)){
        if (!$("k" + i).value) $("k" + i).value = "۱۸";
        if (!$("q" + i).value) $("q" + i).value = "۱";
        if (!$("sp" + i).value) $("sp" + i).value = sd;
      }
    }
  }

  /* روی نمایشگر باریک (گوشی) کل برگه A4 را کوچک می‌کند تا در عرض صفحه جا شود.
     هنگام چاپ به اندازه واقعی برمی‌گردد. */
  function fitToScreen(){
    var page = document.querySelector(".page");
    if (!page) return;
    page.style.zoom = "";
    var avail = document.documentElement.clientWidth, w = page.offsetWidth;
    if (avail && w && avail < w) page.style.zoom = Math.max(0.3, avail / w).toFixed(4);
  }
  function fullSize(){
    var page = document.querySelector(".page");
    if (page) page.style.zoom = "";
  }

  document.addEventListener("DOMContentLoaded", function(){
    if (typeof BigInt === "undefined"){
      var w = document.createElement("div");
      w.className = "noprint";
      w.style.cssText = "background:#7A2E2E;color:#fff;padding:3mm 5mm;font:12px Vazirmatn,sans-serif";
      w.textContent = "مرورگر شما قدیمی است و محاسبه دقیق را پشتیبانی نمی‌کند. لطفاً با Chrome یا Edge به‌روز باز کنید.";
      document.body.insertBefore(w, document.body.firstChild);
      return;
    }
    load(); fmtAll(); defaults(); calc();

    document.addEventListener("input", function(e){
      if (e.target.id === "soodDef")
        for (var i = 1; i <= N; i++) if (i === 1 || rowUsed(i)) $("sp" + i).value = e.target.value;
      defaults(); calc(); save();
    });
    document.addEventListener("blur", function(e){
      if (!e.target || !e.target.classList) return;
      if (e.target.classList.contains("i")){ fmt(e.target); calc(); save(); }
      else if (e.target.classList.contains("tin")){
        e.target.value = faDigits(en(e.target.value)); calc(); save();
      }
    }, true);
    fitToScreen();
    window.addEventListener("resize", fitToScreen);
    window.addEventListener("beforeprint", function(){ fullSize(); fmtAll(); calc(); });
    window.addEventListener("afterprint", fitToScreen);

    $("idate").addEventListener("focus", function(){
      if (!this.value) try {
        this.value = new Intl.DateTimeFormat("fa-IR-u-nu-arabext",
          { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date());
      } catch (e) {}
    });
    $("itime").addEventListener("focus", function(){
      if (!this.value){
        var n = new Date();
        this.value = fa(("0" + n.getHours()).slice(-2) + ":" + ("0" + n.getMinutes()).slice(-2));
      }
    });
  });
})();
