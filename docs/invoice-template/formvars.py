# -*- coding: utf-8 -*-
"""Values for the fill-in-the-browser variant (build.py --form)."""

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
        "EXTRACSS": CSS,
        "EXTRAJS": JS.replace("__ROWS__", str(ROWS)),
    }
    return V


TOOLBAR = """
<div class="toolbar noprint">
  <button class="btn primary" onclick="window.print()">🖨 چاپ / ذخیره PDF</button>
  <button class="btn" onclick="newInvoice()">فرم جدید</button>
  <span class="sep"></span>
  <label>سود پیش‌فرض <input id="soodDef" class="tin" value="۷" inputmode="decimal">٪</label>
  <label>مالیات <input id="vatp" class="tin" value="۱۰" inputmode="decimal">٪</label>
  <span class="sep"></span>
  <span class="profit">سود شما در این فاکتور: <b id="myprofit">۰</b> تومان</span>
  <span class="note">این نوار و درصدها فقط برای شماست و چاپ نمی‌شود · ورودی‌ها خودکار در همین مرورگر ذخیره می‌شوند · هنگام چاپ: Margins=None و Background graphics روشن</span>
</div>
"""

CSS = """
/* ---------- fill-in-the-browser variant ---------- */
@media screen{
  body{background:#E7E3DB;padding:0 0 12mm}
  .page{margin:6mm auto;box-shadow:0 2mm 10mm rgba(0,0,0,.22)}
}
@media print{
  .toolbar,.noprint{display:none!important}
  body{background:#fff;padding:0}
  .page{margin:0;box-shadow:none}
}
body{-webkit-print-color-adjust:exact;print-color-adjust:exact}
.toolbar{position:sticky;top:0;z-index:60;background:#1E1913;color:#EFE6D0;
  padding:2.4mm 5mm;display:flex;flex-wrap:wrap;gap:4mm;align-items:center;
  font-family:'Vazirmatn',sans-serif;font-size:9pt;box-shadow:0 1mm 4mm rgba(0,0,0,.3)}
.toolbar label{display:flex;align-items:center;gap:1.2mm;color:#D8CCAE}
.toolbar .sep{width:0.4pt;height:5mm;background:#4A4033}
.toolbar .note{color:#9A8E75;font-size:7.6pt;margin-inline-start:auto;text-align:left;max-width:70mm;line-height:1.4}
.toolbar .profit b{color:#E5C267;font-size:10pt}
.tin{width:11mm;font:inherit;font-size:9pt;background:#2E272 0;background:#2B241B;color:#F3EAD4;
  border:0.5pt solid #4A4033;border-radius:1mm;padding:.6mm 1mm;text-align:center;font-family:inherit}
.btn{font:inherit;font-family:'Vazirmatn',sans-serif;font-size:9pt;cursor:pointer;
  background:#2B241B;color:#EFE6D0;border:0.5pt solid #4A4033;border-radius:1.4mm;padding:1.4mm 3.5mm}
.btn:hover{background:#3A3126}
.btn.primary{background:#A07C36;border-color:#C6A455;color:#1A1409;font-weight:700}
.btn.primary:hover{background:#B98F3E}

.i{font:inherit;font-family:inherit;color:inherit;background:transparent;border:0;outline:0;
   padding:0;margin:0;width:100%;text-align:inherit;line-height:inherit;min-width:0}
.i::placeholder{color:#CBBFA8}
.i.u{border-bottom:0.4pt dotted #C4B79E}
.i:focus{background:#FFF4D2;border-radius:.7mm}
.i.ctr{text-align:center}
.i.ltr{direction:ltr;text-align:left}
.i.dsc{font-size:7.2pt;font-weight:700;text-align:right}
.i.hdr{font-size:7.4pt;font-weight:700;color:var(--ink)}
.metabar .i{font-size:8.6pt;font-weight:700}
.rates .v{display:flex;gap:1.2mm;align-items:baseline}
.rates .v .i{flex:1;min-width:0;font-size:8.2pt;font-weight:700}
.rates .v i{flex:0 0 auto}
.f .val .i{font-size:7.4pt;font-weight:600}
.tc .i,.pc .i{width:24mm;font-size:6.8pt;font-weight:700}
.tc .v,.pc .v{flex:0 0 auto}
.nl .i{border:0;font-size:6.6pt;height:100%}
td .i{font-size:7pt;font-weight:600}
.frow td{vertical-align:middle}
.chip.noprint{background:#F4EEE0;color:#8A7442;font-size:5.2pt;font-weight:600;
  padding:.3mm 1.2mm;margin-top:.7mm;white-space:nowrap;display:flex;gap:.8mm;align-items:center;
  justify-content:center;width:fit-content}
.ci{width:5.5mm;font-size:5.6pt;font-weight:700;text-align:center;border-bottom:0.4pt dotted #B9A87F;
  background:#fff;border-radius:.5mm}
.o{display:inline-block}
.words .o{min-height:4mm}
.grand .o-payable:empty::before{content:"—";opacity:.35}
"""

JS = """
<script>
(function(){
  var N = __ROWS__;
  var FA="\\u06F0\\u06F1\\u06F2\\u06F3\\u06F4\\u06F5\\u06F6\\u06F7\\u06F8\\u06F9";
  var AR="\\u0660\\u0661\\u0662\\u0663\\u0664\\u0665\\u0666\\u0667\\u0668\\u0669";
  function en(s){
    s=String(s==null?"":s);
    var o="";
    for(var i=0;i<s.length;i++){
      var c=s[i], k=FA.indexOf(c);
      if(k<0) k=AR.indexOf(c);
      if(k>=0) o+=k;
      else if(c>="0"&&c<="9") o+=c;
      else if(c==="."||c==="-") o+=c;
    }
    return o;
  }
  function num(v){var x=parseFloat(en(v));return isFinite(x)?x:0;}
  function fa(s){return String(s).replace(/[0-9]/g,function(d){return FA[+d];});}
  function grp(n){return String(n).replace(/\\B(?=(\\d{3})+(?!\\d))/g,",");}
  function money(n){n=Math.round(n);return n?fa(grp(n)):"";}
  function faDigits(s){return String(s==null?"":s).replace(/[0-9]/g,function(d){return FA[+d];});}
  function dec3(n){
    if(!n) return "";
    var i=Math.floor(n), f=Math.round((n-i)*1000);
    if(f===1000){i++;f=0;}
    return fa(grp(i)+"."+("00"+f).slice(-3));
  }
  var ONES=["","\\u06CC\\u06A9","\\u062F\\u0648","\\u0633\\u0647","\\u0686\\u0647\\u0627\\u0631","\\u067E\\u0646\\u062C","\\u0634\\u0634","\\u0647\\u0641\\u062A","\\u0647\\u0634\\u062A","\\u0646\\u0647"];
  var TEENS=["\\u062F\\u0647","\\u06CC\\u0627\\u0632\\u062F\\u0647","\\u062F\\u0648\\u0627\\u0632\\u062F\\u0647","\\u0633\\u06CC\\u0632\\u062F\\u0647","\\u0686\\u0647\\u0627\\u0631\\u062F\\u0647","\\u067E\\u0627\\u0646\\u0632\\u062F\\u0647","\\u0634\\u0627\\u0646\\u0632\\u062F\\u0647","\\u0647\\u0641\\u062F\\u0647","\\u0647\\u062C\\u062F\\u0647","\\u0646\\u0648\\u0632\\u062F\\u0647"];
  var TENS=["","","\\u0628\\u06CC\\u0633\\u062A","\\u0633\\u06CC","\\u0686\\u0647\\u0644","\\u067E\\u0646\\u062C\\u0627\\u0647","\\u0634\\u0635\\u062A","\\u0647\\u0641\\u062A\\u0627\\u062F","\\u0647\\u0634\\u062A\\u0627\\u062F","\\u0646\\u0648\\u062F"];
  var HUND=["","\\u0635\\u062F","\\u062F\\u0648\\u06CC\\u0633\\u062A","\\u0633\\u06CC\\u0635\\u062F","\\u0686\\u0647\\u0627\\u0631\\u0635\\u062F","\\u067E\\u0627\\u0646\\u0635\\u062F","\\u0634\\u0634\\u0635\\u062F","\\u0647\\u0641\\u062A\\u0635\\u062F","\\u0647\\u0634\\u062A\\u0635\\u062F","\\u0646\\u0647\\u0635\\u062F"];
  var SCALE=[""," \\u0647\\u0632\\u0627\\u0631"," \\u0645\\u06CC\\u0644\\u06CC\\u0648\\u0646"," \\u0645\\u06CC\\u0644\\u06CC\\u0627\\u0631\\u062F"," \\u0628\\u06CC\\u0644\\u06CC\\u0648\\u0646"];
  var AND=" \\u0648 ";
  function three(n){
    var p=[], h=Math.floor(n/100), r=n%100;
    if(h) p.push(HUND[h]);
    if(r>=10&&r<20) p.push(TEENS[r-10]);
    else{var t=Math.floor(r/10), o=r%10; if(t) p.push(TENS[t]); if(o) p.push(ONES[o]);}
    return p.join(AND);
  }
  function words(n){
    n=Math.round(n);
    if(!n) return "";
    var g=[], i=0;
    while(n>0){var q=n%1000; n=Math.floor(n/1000); if(q) g.push(three(q)+SCALE[i]); i++;}
    return g.reverse().join(AND)+" \\u062A\\u0648\\u0645\\u0627\\u0646";
  }

  var $=function(id){return document.getElementById(id);};
  function set(name,txt){
    var els=document.querySelectorAll(".o-"+name);
    for(var i=0;i<els.length;i++) els[i].textContent=txt;
  }
  function calc(){
    var rate=num($("rate").value), vatp=num($("vatp").value);
    var TW=0,TQ=0,TG=0,TM=0,TS=0,TV=0,TT=0,TP=0;
    for(var i=1;i<=N;i++){
      var w=num($("w"+i).value), q=num($("q"+i).value),
          op=num($("op"+i).value), sp=num($("sp"+i).value),
          stone=num($("st"+i).value),
          used = w>0 || stone>0 || ($("d"+i).value||"").trim()!=="";
      var gold=Math.round(w*rate),
          ojrat=Math.round(gold*op/100),
          sood=Math.round((gold+ojrat)*sp/100),
          mk=ojrat+sood,
          vat=Math.round(mk*vatp/100),
          tot=gold+mk+stone+vat;
      set("g"+i, used?money(gold):"");
      set("mk"+i, used?money(mk):"");
      set("v"+i, used?money(vat):"");
      set("t"+i, used?money(tot):"");
      if(used){TW+=w;TQ+=q;TG+=gold;TM+=mk;TS+=stone;TV+=vat;TT+=tot;TP+=sood;}
    }
    set("tw", TW?dec3(TW):""); set("tqty", TQ?fa(TQ):"");
    set("tgold", money(TG)); set("tmk", money(TM));
    set("tstone", money(TS)); set("tvat", money(TV)); set("subtotal", money(TT));
    var disc=num($("disc").value), net=TT-disc;
    var pay=net>0?Math.round(net/1000)*1000:0, rnd=pay-net;
    set("round", TT? (rnd? (rnd<0?"\\u2212":"+")+money(Math.abs(rnd)) : "\\u06F0") : "");
    set("payable", money(pay));
    set("words", words(pay));
    var paid=num($("pos").value)+num($("trf").value);
    set("rem", TT? (money(Math.max(pay-paid,0))||"\\u06F0") : "");
    $("myprofit").textContent = TP?money(TP):"\\u06F0";
  }

  function fmt(el){
    var t=el.getAttribute("data-fmt");
    if(!t){ el.value=faDigits(el.value); return; }
    var v=num(el.value);
    if(t==="money") el.value = v? fa(grp(Math.round(v))) : "";
    else if(t==="dec") el.value = v? dec3(v) : "";
    else el.value = faDigits(en(el.value));
  }
  function fmtAll(){
    var f=document.querySelectorAll("input.i");
    for(var i=0;i<f.length;i++) if(f[i].value) fmt(f[i]);
  }
  var KEY="jewelry-invoice-v1";
  function fields(){return document.querySelectorAll("input.i,input.tin");}
  function save(){
    var o={}, f=fields();
    for(var i=0;i<f.length;i++) if(f[i].id) o[f[i].id]=f[i].value;
    try{localStorage.setItem(KEY,JSON.stringify(o));}catch(e){}
  }
  function load(){
    var o=null;
    try{o=JSON.parse(localStorage.getItem(KEY)||"null");}catch(e){}
    if(!o) return false;
    for(var k in o){var el=$(k); if(el) el.value=o[k];}
    return true;
  }
  window.newInvoice=function(){
    if(!confirm("\\u062A\\u0645\\u0627\\u0645 \\u0641\\u06CC\\u0644\\u062F\\u0647\\u0627 \\u067E\\u0627\\u06A9 \\u0634\\u0648\\u062F\\u061F")) return;
    var f=fields();
    for(var i=0;i<f.length;i++) if(f[i].id!=="vatp"&&f[i].id!=="soodDef") f[i].value="";
    try{localStorage.removeItem(KEY);}catch(e){}
    defaults(); calc();
  };
  function rowUsed(i){
    return num($("w"+i).value)>0 || num($("st"+i).value)>0 || ($("d"+i).value||"").trim()!=="";
  }
  function defaults(){
    var sd=$("soodDef").value||"\\u06F7";
    for(var i=1;i<=N;i++){
      if(i===1 || rowUsed(i)){
        if(!$("k"+i).value) $("k"+i).value="\\u06F1\\u06F8";
        if(!$("q"+i).value) $("q"+i).value="\\u06F1";
        if(!$("sp"+i).value) $("sp"+i).value=sd;
      }
    }
  }
  document.addEventListener("DOMContentLoaded",function(){
    load(); fmtAll(); defaults(); calc();
    document.addEventListener("input",function(e){
      if(e.target.id==="soodDef"){
        for(var i=1;i<=N;i++) if(i===1||rowUsed(i)) $("sp"+i).value=e.target.value;
      }
      defaults(); calc(); save();
    });
    document.addEventListener("blur",function(e){
      if(e.target && e.target.classList && e.target.classList.contains("i")){
        fmt(e.target); calc(); save();
      }
    }, true);
    window.addEventListener("beforeprint",function(){fmtAll();calc();});
    $("idate").addEventListener("focus",function(){
      if(!this.value){
        try{
          var d=new Intl.DateTimeFormat("fa-IR-u-nu-arabext",{year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
          this.value=d.replace(/\\//g,"/");
        }catch(e){}
      }
    });
    $("itime").addEventListener("focus",function(){
      if(!this.value){var n=new Date();
        this.value=fa(("0"+n.getHours()).slice(-2)+":"+("0"+n.getMinutes()).slice(-2));}
    });
  });
})();
</script>
"""
