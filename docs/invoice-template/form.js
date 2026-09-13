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

  function scaled(v, dec){            // "12.7255" , 3  ->  12726n  (نیم‌به‌بالا)
    var s = en(v).trim();
    if (!s) return ZERO;
    var neg = s.charAt(0) === "-";
    if (neg) s = s.slice(1);
    var p = s.split("."), ip = p[0] || "0", fp = p[1] || "";
    if (!/^\d*$/.test(ip) || !/^\d*$/.test(fp)) return ZERO;
    // یک رقم اضافه نگه می‌داریم تا به‌جای بریدن، گرد کنیم
    var keep = fp.slice(0, dec), extra = fp.charAt(dec);
    while (keep.length < dec) keep += "0";
    var r = BigInt(ip || "0") * pow10(dec) + BigInt(keep || "0");
    if (extra >= "5") r += BigInt(1);
    return neg ? -r : r;
  }
  function pos(x){ return x < ZERO ? ZERO : x; }   // هیچ ورودی منفی وارد محاسبه نشود
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
    var x = pos(scaled(v, 3));                  // milli-units of whatever was typed
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

  /* ---------- coins ----------
     وزن و عیار استاندارد سکه‌های بانک مرکزی؛ وزن به میلی‌گرم نگه داشته می‌شود. */
  var COINS = {
    emami:  { name: "تمام سکه امامی",    mg: 8136, ayar: "۹۰۰" },
    bahar:  { name: "تمام بهار آزادی",   mg: 8136, ayar: "۹۰۰" },
    nim:    { name: "نیم‌سکه",            mg: 4068, ayar: "۹۰۰" },
    rob:    { name: "ربع‌سکه",            mg: 2034, ayar: "۹۰۰" },
    gerami: { name: "سکه گرمی",           mg: 1017, ayar: "۹۰۰" }
  };
  function coinOf(i){
    var el = $("ty" + i);
    var v = el ? el.value : "";
    return v && COINS[v] ? v : "";
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
    var c = coinOf(i);
    if (c) return (parseInt(en($("q" + i).value), 10) || 0) > 0 ||
                  ($("d" + i).value || "").trim() !== "";
    return scaled($("w" + i).value, 3) > ZERO ||
           scaled($("st" + i).value, 0) > ZERO ||
           ($("d" + i).value || "").trim() !== "";
  }

  /* ---------- the one calculation ---------- */
  function calc(){
    var rate  = pos(scaled($("rate").value, 0));
    var vatBp = pos(scaled($("vatp").value, 2));
    var base  = purity($("baseAyar").value) || { n: BigInt(18000), d: K24000 };
    set("baseayar", ayarText($("baseAyar").value).replace(" عیار", "").replace(" هزارم", ""));
    var T = { mg: ZERO, qty: 0, gold: ZERO, ojrat: ZERO, sood: ZERO,
              mk: ZERO, stone: ZERO, vat: ZERO, tot: ZERO, coins: 0, goldJewel: ZERO };
    var steps = [];

    for (var i = 1; i <= N; i++){
      var coin  = coinOf(i);
      var stone = pos(scaled($("st" + i).value, 0));
      var qty   = Math.max(0, parseInt(en($("q" + i).value), 10) || 0);
      var used  = rowUsed(i);
      var row   = $("d" + i).closest("tr");
      if (row) row.classList.toggle("coin", !!coin);

      var mg, gold, ojrat, sood, mk, vat, tot, unit = ZERO, opBp, spBp;

      if (coin){
        /* سکه: قیمت هر قطعه ضربدر تعداد؛ اجرت ساخت ندارد و سود فروشنده
           به‌صورت درصدی روی ارزش سکه محاسبه و در «اجرت و کارمزد» ادغام می‌شود. */
        var C = COINS[coin];
        unit  = pos(scaled($("pc_" + coin).value, 0));
        var q = BigInt(qty);
        mg    = BigInt(C.mg) * q;
        gold  = unit * q;
        opBp  = ZERO;
        spBp  = pos(scaled($("coinSood").value, 2));
        ojrat = ZERO;
        sood  = divRound(gold * spBp, K10000);
        mk    = sood;
        vat   = divRound(mk * vatBp, K10000);
        tot   = gold + mk + stone + vat;
        // مشخصات استاندارد سکه پر می‌شود، ولی نه داخل فیلدی که در حال تایپ در آن هستید
        var busy = document.activeElement;
        if ($("d" + i) !== busy && $("d" + i).value.trim() === "" && qty > 0)
          $("d" + i).value = C.name;
        if ($("k" + i) !== busy) $("k" + i).value = C.ayar;
        if ($("w" + i) !== busy) $("w" + i).value = weight(mg);
      } else {
        mg    = pos(scaled($("w" + i).value, 3));
        opBp  = pos(scaled($("op" + i).value, 2));
        spBp  = pos(scaled($("sp" + i).value, 2));
        // ارزش طلا = وزن × نرخ × (عیار کالا ÷ عیار مبنای نرخ) — یک بار گرد می‌شود
        var pi = purity($("k" + i).value) || base;
        gold  = divRound(mg * rate * pi.n * base.d, K1000 * pi.d * base.n);
        ojrat = divRound(gold * opBp, K10000);
        sood  = divRound((gold + ojrat) * spBp, K10000);
        mk    = ojrat + sood;
        vat   = divRound(mk * vatBp, K10000);
        tot   = gold + mk + stone + vat;
      }

      set("g" + i,  used ? money0(gold) : "");
      set("mk" + i, used ? money0(mk)   : "");
      set("v" + i,  used ? money0(vat)  : "");
      set("t" + i,  used ? money0(tot)  : "");

      if (used){
        T.mg += mg; T.qty += qty; T.gold += gold; T.ojrat += ojrat;
        T.sood += sood; T.mk += mk; T.stone += stone; T.vat += vat; T.tot += tot;
        if (coin) T.coins++; else T.goldJewel += gold;
        steps.push({ i: i, name: ($("d" + i).value || "").trim(), mg: mg, rate: rate,
                     coin: coin, qty: qty, unit: unit,
                     ayar: $("k" + i).value,
                     sameAyar: coin ? true : (pi.n * base.d === base.n * pi.d),
                     opBp: opBp, spBp: spBp, vatBp: vatBp, gold: gold, ojrat: ojrat,
                     sood: sood, mk: mk, stone: stone, vat: vat, tot: tot });
      }
    }

    var any = steps.length > 0;
    var m = function(x){ return any ? money0(x) : ""; };
    set("tw",       weight(T.mg));
    set("tqty",     T.qty ? fa(T.qty) : "");
    set("tgold",    m(T.gold));
    set("tmk",      m(T.mk));
    set("tstone",   m(T.stone));
    set("tvat",     m(T.vat));
    set("subtotal", m(T.tot));

    var disc = pos(scaled($("disc").value, 0));
    var net  = T.tot - disc;
    if (net < ZERO) net = ZERO;
    var pay  = net > ZERO ? divRound(net, K1000) * K1000 : ZERO;
    var rnd  = pay - net;

    set("round", T.tot > ZERO ? (rnd === ZERO ? "۰" : (rnd < ZERO ? "−" : "+") + money(rnd < ZERO ? -rnd : rnd)) : "");
    set("payable", any ? money0(pay) : "");
    set("words", words(pay));

    var paid = pos(scaled($("pos").value, 0)) + pos(scaled($("trf").value, 0));
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
           (s.name ? '<span>' + esc(s.name) + '</span>' : '') +
           (s.coin ? '<span class="cp-tag">سکه</span>' : '') + '</div><table class="cp-t">' +
        (s.coin
          ? line("ارزش سکه", fa(s.qty) + " قطعه × " + money0(s.unit), money0(s.gold)) +
            line("سود " + pct(s.spBp) + "٪", money0(s.gold) + " × " + pct(s.spBp) + "٪", money0(s.sood), "hot") +
            line("وزن معادل", fa(s.qty) + " × " + weight(BigInt(COINS[s.coin].mg)) + " گرم", weight(s.mg) + " گرم")
          : line("ارزش طلا", weight(s.mg) + " گرم × " + money(s.rate) +
                 (s.sameAyar ? "" : " × " + ayarRatio(s.ayar, $("baseAyar").value)),
                 money0(s.gold)) +
            line("اجرت " + pct(s.opBp) + "٪", money0(s.gold) + " × " + pct(s.opBp) + "٪", money0(s.ojrat)) +
            line("سود " + pct(s.spBp) + "٪", "(" + money0(s.gold) + " + " + money0(s.ojrat) + ") × " + pct(s.spBp) + "٪", money0(s.sood), "hot") +
            line("اجرت و کارمزد", money0(s.ojrat) + " + " + money0(s.sood), money0(s.mk))) +
        (s.stone > ZERO ? line("سنگ و نگین", "مقطوع", money0(s.stone)) : "") +
        line("مالیات " + pct(s.vatBp) + "٪", money0(s.mk) + " × " + pct(s.vatBp) + "٪", money0(s.vat)) +
        line("مبلغ ردیف", money0(s.gold) + " + " + money0(s.mk) + (s.stone > ZERO ? " + " + money0(s.stone) : "") + " + " + money0(s.vat), money0(s.tot), "tot") +
        '</table></div>';
    }
    h += '</div>';

    var buyBp = pos(scaled($("buyOjrat").value, 2));
    var paidOjrat = divRound(T.goldJewel * buyBp, K10000);
    var diff = T.ojrat - paidOjrat;
    var netProfit = T.sood + diff;

    h += '<div class="cp-sum"><div class="cp-sh">جمع‌بندی</div><table class="cp-t">' +
      line(T.coins ? "جمع ارزش طلا و سکه" : "جمع ارزش طلا", weight(T.mg) + " گرم", money0(T.gold)) +
      line("جمع اجرت دریافتی", "", money0(T.ojrat)) +
      line("جمع سود شما", "", money0(T.sood), "hot") +
      (T.stone > ZERO ? line("جمع سنگ و نگین", "", money0(T.stone)) : "") +
      line("مالیات — سهم دولت", "این مبلغ درآمد شما نیست", money0(T.vat), "warn") +
      line("جمع فاکتور", "", money0(T.tot)) +
      (disc > ZERO ? line("تخفیف", "", signed(true, money0(disc)), "minus") : "") +
      (rnd !== ZERO ? line("گرد کردن", "", signed(rnd < ZERO, money(rnd < ZERO ? -rnd : rnd))) : "") +
      line("مبلغ قابل پرداخت", "", money0(pay), "tot") +
      line("سود نسبت به ارزش طلا", "", ratio(T.sood, T.gold) + "٪") +
      line("سود نسبت به کل فاکتور", "", ratio(T.sood, T.tot) + "٪") +
      '</table>';

    if (buyBp > ZERO){
      h += '<div class="cp-sh">سود خالص با احتساب اجرت خرید</div><table class="cp-t">' +
        line("اجرت پرداختی شما " + pct(buyBp) + "٪", money0(T.goldJewel) + " × " + pct(buyBp) + "٪", money0(paidOjrat)) +
        line("مابه‌التفاوت اجرت", money0(T.ojrat) + " − " + money0(paidOjrat),
             diff < ZERO ? signed(true, money0(-diff)) : money0(diff)) +
        line("سود خالص شما", money0(T.sood) + (diff < ZERO ? " − " : " + ") + money0(diff < ZERO ? -diff : diff),
             netProfit < ZERO ? signed(true, money0(-netProfit)) : money0(netProfit), "tot") +
        '</table>';
    } else {
      h += '<p class="cp-hint">اگر درصد اجرتی که خودتان موقع خرید کالا پرداخت کرده‌اید را در نوار بالا وارد کنید، سود خالص واقعی هم اینجا حساب می‌شود.</p>';
    }
    h += '</div>';
    box.innerHTML = h;
  }
  function signed(neg, v){        // «−۱,۰۰۰,۰۰۰» یکپارچه، نه علامت جدا افتاده
    return '<bdi dir="ltr">' + (neg ? "\u2212" : "+") + v + "</bdi>";
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
  function fields(){
    return document.querySelectorAll("input.i,input.tin,input[type=checkbox],select.tysel,.cfgf");
  }
  function save(){
    var o = {}, f = fields();
    for (var i = 0; i < f.length; i++)
      if (f[i].id) o[f[i].id] = f[i].type === "checkbox" ? (f[i].checked ? "1" : "") : f[i].value;
    var man = [];
    for (var j = 0; j < PRICE_FIELDS.length; j++){
      var pe = $(PRICE_FIELDS[j]);
      if (pe && pe.getAttribute("data-manual") === "1") man.push(PRICE_FIELDS[j]);
    }
    o.__manual = man.join(",");
    try { localStorage.setItem(KEY, JSON.stringify(o)); } catch (e) {}
  }
  function load(){
    var o = null;
    try { o = JSON.parse(localStorage.getItem(KEY) || "null"); } catch (e) {}
    if (!o) return;
    if (o.__manual)
      o.__manual.split(",").forEach(function(id){ if ($(id)) $(id).setAttribute("data-manual","1"); });
    for (var k in o){
      if (k === "__manual") continue;
      var el = $(k);
      if (!el) continue;
      if (el.type === "checkbox") el.checked = !!o[k]; else el.value = o[k];
    }
  }
  window.newInvoice = function(){
    if (!confirm("تمام فیلدها پاک شود؟")) return;
    var f = fields();
    for (var i = 0; i < f.length; i++){
      var id = f[i].id || "";
      var keep = f[i].type === "checkbox" || id.indexOf("lb") === 0 ||
                 id === "vatp" || id === "soodDef" || id === "buyOjrat" ||
                 id === "coinSood" || id.indexOf("pc_") === 0;
      if (!keep) f[i].value = "";
    }
    try { localStorage.removeItem(KEY); } catch (e) {}
    defaults(); calc();
  };
  function defaults(){
    var sd = $("soodDef").value || "۷";
    // هرگز داخل فیلدی که همین حالا در حال تایپ در آن هستید نوشته نمی‌شود؛
    // در غیر این صورت پاک‌کردن آخرین رقم بلافاصله با مقدار پیش‌فرض پر می‌شد.
    var busy = document.activeElement;
    function fill(el, v){ if (el && el !== busy && !el.value) el.value = v; }
    for (var i = 1; i <= N; i++){
      if (i === 1 || rowUsed(i)){
        // عیار پیش‌فرض هر ردیف = همان عیار مبنای نرخ، نه عدد ثابت ۱۸
        fill($("k" + i), faDigits(en($("baseAyar").value)) || "۱۸");
        fill($("q" + i), "۱");
        fill($("sp" + i), sd);
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

  function applyToggles(){
    var panel = $("calcpanel");
    if (panel) panel.hidden = !$("showCalc").checked;
    document.body.classList.toggle("coins", $("coinMode").checked);
    if (!$("coinMode").checked)
      for (var i = 1; i <= N; i++){ var t = $("ty" + i); if (t) t.value = ""; }
  }


  /* ================= نرخ‌های زنده =================
     سه لایه که نگذارند فرم هیچ‌وقت بی‌نرخ بماند:
       ۱) منبع انتخابی کاربر (با کلید خودش)
       ۲) منابع پشتیبان بدون کلید، یکی‌یکی
       ۳) آخرین نرخ موفق که در همین مرورگر ذخیره شده
     هر فیلدی که دستی تایپ شود قفل می‌شود و به‌روزرسانی خودکار آن را عوض نمی‌کند. */
  var PRICE_FIELDS = ["rate","mes","ounce","pc_emami","pc_bahar","pc_nim","pc_rob","pc_gerami"];
  var PRICE_KEY = "jewelry-prices-v1";
  var JUMP = 0.15;                       // پرش بیش از ۱۵٪ بدون تأیید اعمال نمی‌شود

  var GH_USER = "parhamofski46-cyber", GH_REPO = "Pulse-fivem", GH_REF = "main";
  var GH_DIR  = "docs/invoice-template";
  var GH_FEED = "https://raw.githubusercontent.com/" + GH_USER + "/" + GH_REPO + "/" +
                GH_REF + "/" + GH_DIR + "/prices.json?v={T}";
  var SAME_ORIGIN_FEED = "./prices.json?v={T}";   // وقتی خود فرم روی GitHub Pages میزبانی شود
  var JSDELIVR_JS = "https://cdn.jsdelivr.net/gh/" + GH_USER + "/" + GH_REPO + "@" + GH_REF +
                    "/" + GH_DIR + "/prices.js";
  var PRESETS = {
    github: { label: "فید خودتان روی GitHub", unit: "toman",
      urls: [SAME_ORIGIN_FEED, GH_FEED],
      map: { rate:"rate", mes:"mes", ounce:"ounce", pc_emami:"pc_emami",
             pc_bahar:"pc_bahar", pc_nim:"pc_nim", pc_rob:"pc_rob", pc_gerami:"pc_gerami" } },
    tgju: { label: "TGJU — بدون کلید", unit: "rial",
      urls: ["https://call1.tgju.org/ajax.json",
             "https://call3.tgju.org/ajax.json",
             "https://call5.tgju.org/ajax.json",
             "https://call2.tgju.org/ajax.json"],
      map: { rate:"current.geram18.p", mes:"current.mesghal.p", ounce:"current.ons.p",
             pc_emami:"current.sekee.p", pc_bahar:"current.sekeb.p",
             pc_nim:"current.nim.p", pc_rob:"current.rob.p", pc_gerami:"current.gerami.p" } },
    navasan: { label: "نوسان — نیازمند کلید", unit: "rial",
      urls: ["https://api.navasan.tech/latest/?api_key={KEY}"],
      map: { rate:"18ayar.value", mes:"mesghal.value", ounce:"ons.value",
             pc_emami:"sekee.value", pc_bahar:"sekeb.value",
             pc_nim:"nim.value", pc_rob:"rob.value", pc_gerami:"gerami.value" } },
    brsapi: { label: "BrsApi — نیازمند کلید", unit: "toman",
      urls: ["https://brsapi.ir/Api/Market/Gold_Currency.php?key={KEY}"],
      map: { rate:"gold[name=طلای 18 عیار].price", mes:"gold[name=مثقال طلا].price",
             ounce:"gold[name=انس طلا].price", pc_emami:"gold[name=سکه امامی].price",
             pc_bahar:"gold[name=سکه بهار آزادی].price", pc_nim:"gold[name=نیم سکه].price",
             pc_rob:"gold[name=ربع سکه].price", pc_gerami:"gold[name=سکه گرمی].price" } },
    custom: { label: "سفارشی", unit: "rial", urls: [], map: {} }
  };
  var FALLBACK_ORDER = ["github", "tgju"];         // منابع بدون کلید که خودکار امتحان می‌شوند

  function splitPath(path){              // "gold[name=طلای 18 عیار].price" -> اجزا
    var out = [], buf = "", depth = 0;
    for (var i = 0; i < path.length; i++){
      var c = path[i];
      if (c === "[") depth++;
      if (c === "]") depth--;
      if (c === "." && depth === 0){ out.push(buf); buf = ""; }
      else buf += c;
    }
    if (buf) out.push(buf);
    return out;
  }
  function dig(obj, path){
    if (!path) return undefined;
    var parts = splitPath(path), cur = obj;
    for (var i = 0; i < parts.length && cur != null; i++){
      var m = parts[i].match(/^([^\[]*)\[(.+)\]$/);
      if (!m){ cur = cur[parts[i]]; continue; }
      if (m[1]) cur = cur[m[1]];
      if (cur == null) return undefined;
      var sel = m[2];
      if (/^\d+$/.test(sel)) cur = cur[+sel];
      else {
        var eq = sel.indexOf("="), k = sel.slice(0, eq), v = sel.slice(eq + 1).trim();
        cur = (cur && cur.length != null)
          ? Array.prototype.filter.call(cur, function(o){
              return o && String(o[k]).replace(/\s+/g, " ").trim() === v;
            })[0]
          : undefined;
      }
    }
    return cur;
  }
  function toNumber(v){                  // "۱۲۳,۴۵۶" یا "123456.7" یا عدد
    if (v == null) return 0;
    var t = String(v).replace(/[۰-۹]/g, function(d){ return "۰۱۲۳۴۵۶۷۸۹".indexOf(d); })
                     .replace(/[^\d.]/g, "");
    var x = parseFloat(t);
    return isFinite(x) && x > 0 ? x : 0;
  }
  function sane(id, toman){              // مرز عقل: جلوی عدد پرت را می‌گیرد
    if (!(toman > 0)) return false;
    if (id === "ounce") return toman < 1e7;
    return toman > 1e4 && toman < 1e13;
  }

  /* واسطه‌های عمومی CORS: وقتی منبع اجازه خواندن مستقیم از مرورگر را نمی‌دهد،
     همان آدرس از این مسیرها خوانده می‌شود. فقط بعد از تلاش مستقیم امتحان می‌شوند. */
  var PROXIES = [
    function(u){ return "https://api.allorigins.win/raw?url=" + encodeURIComponent(u); },
    function(u){ return "https://api.codetabs.com/v1/proxy?quest=" + encodeURIComponent(u); },
    function(u){ return "https://corsproxy.io/?url=" + encodeURIComponent(u); }
  ];
  function withKey(u){
    return u.replace("{KEY}", encodeURIComponent($("lbKey").value.trim()))
            .replace("{T}", String(Math.floor(Date.now() / 60000)));
  }
  function cfg(){
    var pre = $("lbPreset").value, P = PRESETS[pre] || PRESETS.custom;
    var own = ($("lbUrl").value || "").trim();
    var urls = (own ? [own] : (P.urls || [])).map(withKey);
    var map = P.map;
    var raw = ($("lbMap").value || "").trim();
    if (raw) { try { map = JSON.parse(raw); } catch (e) {} }
    return { name: P.label, urls: urls, unit: $("lbUnit").value, map: map, preset: pre };
  }
  function fetchJSON(url, ms){
    var ctl = ("AbortController" in window) ? new AbortController() : null;
    var t = setTimeout(function(){ if (ctl) ctl.abort(); }, ms || 9000);
    return fetch(url, { signal: ctl ? ctl.signal : undefined, cache: "no-store",
                        credentials: "omit", mode: "cors" })
      .then(function(r){ if (!r.ok) throw new Error("HTTP " + r.status); return r.json(); })
      .then(function(j){ clearTimeout(t); return j; },
            function(e){ clearTimeout(t); throw e; });
  }
  function readVals(json, map, unit){
    var out = {}, hits = 0, div = unit === "rial" ? 10 : 1;
    for (var i = 0; i < PRICE_FIELDS.length; i++){
      var id = PRICE_FIELDS[i], raw = toNumber(dig(json, map[id]));
      if (!raw) continue;
      var v = Math.round(id === "ounce" ? raw : raw / div);   // انس همیشه دلاری است
      if (sane(id, v)) { out[id] = v; hits++; }
    }
    return hits ? out : null;
  }

  var lastFlagged = null;
  function applyVals(vals, srcName, when, fromCache){
    var applied = 0, locked = 0, flagged = {};
    for (var i = 0; i < PRICE_FIELDS.length; i++){
      var id = PRICE_FIELDS[i], v = vals[id], el = $(id);
      if (!v || !el) continue;
      if (el.getAttribute("data-manual") === "1"){ locked++; continue; }
      var prev = toNumber(el.value);
      if (prev > 0 && Math.abs(v - prev) / prev > JUMP){ flagged[id] = v; continue; }
      el.value = fa(grp(v)); applied++;
    }
    lastFlagged = Object.keys(flagged).length ? { vals: flagged, src: srcName } : null;
    var rv = $("rvalid");
    if (rv && rv.getAttribute("data-manual") !== "1" && applied)
      rv.value = faDigits(when.toLocaleDateString("fa-IR-u-nu-latn")) + " — " +
                 faDigits(("0" + when.getHours()).slice(-2) + ":" + ("0" + when.getMinutes()).slice(-2));
    status(srcName, when, fromCache, applied, locked);
    renderFlagged(); renderAttempts();
    calc(); save();
    return applied;
  }
  function renderFlagged(){
    var box = $("lbFlag");
    if (!box) return;
    if (!lastFlagged){ box.hidden = true; box.innerHTML = ""; return; }
    var names = { rate:"هر گرم", mes:"مثقال", ounce:"انس", pc_emami:"تمام امامی",
                  pc_bahar:"بهار آزادی", pc_nim:"نیم", pc_rob:"ربع", pc_gerami:"گرمی" };
    var parts = [];
    for (var id in lastFlagged.vals) parts.push(names[id] + " → " + fa(grp(lastFlagged.vals[id])));
    box.hidden = false;
    box.innerHTML = '<b>تفاوت زیاد با نرخ فعلی:</b> ' + parts.join(" · ") +
                    ' <button class="btn sm" id="lbOk">اعمال</button>' +
                    '<button class="btn sm" id="lbNo">رد</button>';
    $("lbOk").onclick = function(){
      for (var id in lastFlagged.vals) if ($(id)) $(id).value = fa(grp(lastFlagged.vals[id]));
      lastFlagged = null; renderFlagged(); calc(); save();
    };
    $("lbNo").onclick = function(){ lastFlagged = null; renderFlagged(); };
  }
  function ago(d){
    var m = Math.round((Date.now() - d.getTime()) / 60000);
    if (m < 1) return "همین الان";
    if (m < 60) return fa(m) + " دقیقه پیش";
    var h = Math.round(m / 60);
    if (h < 24) return fa(h) + " ساعت پیش";
    return fa(Math.round(h / 24)) + " روز پیش";
  }
  function status(src, when, fromCache, applied, locked){
    var el = $("lbStatus");
    if (!el) return;
    var stale = (Date.now() - when.getTime()) > 6 * 3600e3;
    el.className = "lb-status" + (fromCache || stale ? " warn" : " ok");
    el.textContent = (fromCache ? "آخرین نرخ ذخیره‌شده" : "به‌روز از " + src) +
      " · " + ago(when) + (applied ? " · " + fa(applied) + " نرخ پر شد" : "") +
      (locked ? " · " + fa(locked) + " فیلد دستی دست‌نخورده ماند" : "");
  }
  function saveCache(vals, src){
    try { localStorage.setItem(PRICE_KEY, JSON.stringify({ t: Date.now(), src: src, vals: vals })); }
    catch (e) {}
  }
  function loadCache(){
    try { return JSON.parse(localStorage.getItem(PRICE_KEY) || "null"); } catch (e) { return null; }
  }

  var gen = 0, attempts = [];  // هر تلاش تازه، تلاش قبلی را باطل می‌کند
  function refresh(byUser){
    var mine = ++gen;
    var c = cfg(), chain = [], direct = [];
    c.urls.forEach(function(u){ direct.push({ url: u, map: c.map, unit: c.unit, name: c.name }); });
    for (var i = 0; i < FALLBACK_ORDER.length; i++){
      var k = FALLBACK_ORDER[i], P = PRESETS[k];
      if (!P || k === c.preset) continue;
      (P.urls || []).forEach(function(u){
        if (u.indexOf("{KEY}") < 0)
          direct.push({ url: withKey(u), map: P.map, unit: P.unit, name: P.label + " (پشتیبان)" });
      });
    }
    chain = direct.slice();
    if (!$("lbProxy") || $("lbProxy").checked){
      var seen = {};
      direct.forEach(function(d){
        if (seen[d.name]) return;              // فقط یک آدرس از هر منبع را با واسطه امتحان کن
        seen[d.name] = 1;
        if (d.url.indexOf("raw.githubusercontent") >= 0) return;  // این یکی خودش CORS دارد
        PROXIES.forEach(function(mk, pi){
          chain.push({ url: mk(d.url), map: d.map, unit: d.unit,
                       name: d.name + " (واسطه " + fa(pi + 1) + ")" });
        });
      });
    }
    attempts = []; scriptTried = false;
    if (!chain.length){ useCache(true); return; }
    if ($("lbStatus")){
      $("lbStatus").className = "lb-status";
      $("lbStatus").textContent = "در حال گرفتن نرخ…";
    }
    (function step(n){
      if (mine !== gen) return;                 // تلاش تازه‌تری شروع شده
      if (n >= chain.length){
        tryScriptFeed(function(okFlag){ if (!okFlag && mine === gen) useCache(byUser); });
        return;
      }
      var s = chain[n];
      fetchJSON(s.url, 6000).then(function(json){
        if (mine !== gen) return;
        var vals = readVals(json, s.map, s.unit);
        if (!vals) throw new Error("پاسخ آمد ولی هیچ فیلدی با نگاشت جور نبود");
        attempts.push({ name: s.name, ok: true, n: Object.keys(vals).length });
        saveCache(vals, s.name);
        applyVals(vals, s.name, new Date(), false);
      }).catch(function(e){
        attempts.push({ name: s.name, ok: false,
                        err: (e && e.name === "AbortError") ? "زمان تمام شد"
                             : (e && e.message) ? e.message : "اتصال/CORS" });
        step(n + 1);
      });
    })(0);
  }
  /* بارگذاری فید از راه تگ script — این مسیر تابع CORS نیست و در صفحه‌هایی که
     اتصال معمولی‌شان بسته است هم کار می‌کند. جدیدترین نیست (کش تا ۱۲ ساعت). */
  var scriptTried = false;
  function tryScriptFeed(after){
    if (scriptTried){ after(false); return; }
    scriptTried = true;
    var el = document.createElement("script");
    var done = false;
    function finish(okFlag){
      if (done) return;
      done = true;
      if (el.parentNode) el.parentNode.removeChild(el);
      after(okFlag);
    }
    el.src = JSDELIVR_JS + "?v=" + Math.floor(Date.now() / 3600000);
    el.onload = function(){
      var d = window.__PRICES__;
      if (!d){ attempts.push({ name: "فید از راه script", ok: false, err: "فایل خالی بود" });
               finish(false); return; }
      var vals = readVals(d, PRESETS.github.map, d.unit || "toman");
      if (!vals){ attempts.push({ name: "فید از راه script", ok: false, err: "هنوز نرخی ندارد" });
                  finish(false); return; }
      attempts.push({ name: "فید از راه script (jsDelivr)", ok: true, n: Object.keys(vals).length });
      saveCache(vals, "فید GitHub");
      applyVals(vals, "فید GitHub (از راه script)", d.t ? new Date(d.t) : new Date(), false);
      finish(true);
    };
    el.onerror = function(){
      attempts.push({ name: "فید از راه script", ok: false, err: "مسدود یا در دسترس نبود" });
      finish(false);
    };
    document.head.appendChild(el);
    setTimeout(function(){ finish(false); }, 8000);
  }

  function useCache(explain){
    var c = loadCache();
    if (c && c.vals){ applyVals(c.vals, c.src, new Date(c.t), true); }
    else if ($("lbStatus")){
      $("lbStatus").className = "lb-status warn";
      $("lbStatus").textContent = explain ? failureHint() : "نرخ‌ها را وارد کنید — یا «به‌روزرسانی» را بزنید";
    }
    renderAttempts();
  }
  function allBlocked(){        // همه تلاش‌ها با خطای شبکه رد شدند، نه با پاسخ سرور
    return attempts.length > 2 && attempts.every(function(a){
      return !a.ok && /Failed to fetch|NetworkError|Load failed|مسدود/.test(a.err || "");
    });
  }
  function failureHint(){
    if (allBlocked())
      return "مرورگر اجازه هیچ اتصال بیرونی نداد — این صفحه را از لینک باز کرده‌اید؟ " +
             "نسخه میزبانی‌شده روی GitHub Pages یا فایل دانلودی این محدودیت را ندارد. " +
             "تا آن موقع نرخ‌ها را دستی وارد کنید.";
    return "هیچ منبعی جواب نداد — گزارش تلاش‌ها را ببینید؛ علت هر کدام آنجا نوشته شده";
  }
  var showDiag = false;
  function renderAttempts(){
    var box = $("lbDiag"), btn = $("lbWhy");
    if (!box) return;
    if (btn) btn.hidden = !attempts.length;
    if (!attempts.length || !showDiag){ box.hidden = true; box.innerHTML = ""; return; }
    box.hidden = false;
    box.innerHTML = "<b>گزارش تلاش‌ها:</b> " + attempts.map(function(a){
      return '<span class="' + (a.ok ? "d-ok" : "d-no") + '">' + esc(a.name) + " — " +
             (a.ok ? fa(a.n) + " نرخ" : esc(a.err)) + "</span>";
    }).join(" · ");
  }
  function lockManual(el){
    if (el && PRICE_FIELDS.concat(["rvalid"]).indexOf(el.id) >= 0)
      el.setAttribute("data-manual", "1");
    updateLockBadge();
  }
  function updateLockBadge(){
    var n = 0;
    for (var i = 0; i < PRICE_FIELDS.length; i++)
      if ($(PRICE_FIELDS[i]) && $(PRICE_FIELDS[i]).getAttribute("data-manual") === "1") n++;
    var b = $("lbLock");
    if (b){ b.hidden = !n; b.textContent = "🔒 " + fa(n) + " فیلد دستی — آزاد کردن"; }
  }
  window.releaseLocks = function(){
    PRICE_FIELDS.concat(["rvalid"]).forEach(function(id){
      if ($(id)) $(id).removeAttribute("data-manual");
    });
    updateLockBadge(); refresh(true);
  };
  function initLive(){
    var sel = $("lbPreset");
    if (!sel.options.length){
      for (var k in PRESETS){
        var o = document.createElement("option");
        o.value = k; o.textContent = PRESETS[k].label; sel.appendChild(o);
      }
    }
    if (!sel.value) sel.value = "tgju";
    function syncPreset(){
      var P = PRESETS[sel.value] || PRESETS.custom;
      $("lbUrl").placeholder = (P.urls && P.urls[0]) || "https://…";
      $("lbUnit").value = P.unit;
      $("lbMap").placeholder = JSON.stringify(P.map, null, 1);
    }
    sel.addEventListener("change", function(){ syncPreset(); save(); });
    syncPreset();
    $("lbNow").onclick = function(){ refresh(true); };
    $("lbCfgBtn").onclick = function(){ $("livecfg").hidden = !$("livecfg").hidden; };
    $("lbWhy").onclick = function(){ showDiag = !showDiag; renderAttempts(); };
    $("lbLock").onclick = window.releaseLocks;
    $("lbTest").onclick = function(){
      showDiag = true;
      $("lbTestOut").textContent = "در حال آزمایش همه منابع…" +
        "";
      refresh(true);
      setTimeout(function(){
        var okAny = attempts.some(function(a){ return a.ok; });
        $("lbTestOut").textContent = okAny ? "یک منبع جواب داد — گزارش کامل پایین نوار است"
                                           : failureHint();
      }, 30000);
    };
    var cached = loadCache();
    if (cached) applyVals(cached.vals, cached.src, new Date(cached.t), true);
    if ($("lbAuto").checked) refresh(false);
    setInterval(function(){ if ($("lbAuto").checked) refresh(false); }, 5 * 60000);
    window.addEventListener("online", function(){ if ($("lbAuto").checked) refresh(false); });
    document.addEventListener("visibilitychange", function(){
      if (!document.hidden && $("lbAuto").checked){
        var c2 = loadCache();
        if (!c2 || Date.now() - c2.t > 10 * 60000) refresh(false);
      }
    });
    updateLockBadge();
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
    load(); fmtAll(); applyToggles(); defaults(); calc();
    try { initLive(); } catch (e) {}

    document.addEventListener("input", function(e){
      if (e.target.id === "soodDef")
        for (var i = 1; i <= N; i++) if (i === 1 || rowUsed(i)) $("sp" + i).value = e.target.value;
      if (e.target.isTrusted) lockManual(e.target);
      if (e.target.id === "showCalc" || e.target.id === "coinMode") applyToggles();
      defaults(); calc(); save();
    });
    document.addEventListener("change", function(e){
      if (e.target && e.target.classList && e.target.classList.contains("tysel")){
        defaults(); calc(); save();
      }
    });
    document.addEventListener("blur", function(e){
      if (!e.target || !e.target.classList) return;
      if (e.target.classList.contains("i")){ fmt(e.target); calc(); save(); }
      else if (e.target.classList.contains("tin")){
        if (e.target.getAttribute("data-fmt")) fmt(e.target);
        else e.target.value = faDigits(en(e.target.value));
        calc(); save();
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
