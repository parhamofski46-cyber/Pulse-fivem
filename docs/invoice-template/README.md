# قالب فاکتور فروش طلا و جواهر

قالب فاکتور A4 تک‌صفحه‌ای (فارسی/RTL) برای طلا و جواهر. خروجی PDF کاملاً برداری است
و فونت‌ها داخل فایل جاسازی می‌شوند، بنابراین در هر بزرگ‌نمایی و در هر چاپی شارپ می‌ماند.

## فایل‌ها
- `template.html` — قالب و تمام استایل‌ها (متن، رنگ‌ها، چیدمان اینجا ویرایش می‌شود)
- `build.py` — داده‌های فاکتور (نرخ طلا، اقلام، اجرت، سود، مالیات) و تولید HTML نهایی
- `fanum.py` — اعداد فارسی، جداکننده هزارگان و تبدیل مبلغ به حروف
- `Gold-Jewelry-Invoice-A4.pdf` — نمونه خروجی

## ساخت مجدد
```bash
# ۱) فونت‌ها (Vazirmatn + Cormorant Garamond)
curl -sSL -o vazirmatn.tgz https://registry.npmjs.org/vazirmatn/-/vazirmatn-33.0.3.tgz
tar xzf vazirmatn.tgz --wildcards 'package/fonts/webfonts/*'
curl -sSL -o cg.tgz https://registry.npmjs.org/@fontsource/cormorant-garamond/-/cormorant-garamond-5.2.5.tgz
mkdir -p cg && tar xzf cg.tgz -C cg --wildcards 'package/files/cormorant-garamond-latin-*-normal.woff2'

# ۲) تولید HTML  (INVOICE_BASE = پوشه‌ای که package/ و cg/ در آن است)
INVOICE_BASE="$PWD" python3 build.py

# ۳) تبدیل به PDF
chromium --headless --no-pdf-header-footer \
  --run-all-compositor-stages-before-draw --virtual-time-budget=8000 \
  --print-to-pdf=Gold-Jewelry-Invoice-A4.pdf "file://$PWD/invoice.html"
```

## فرمول محاسبه هر ردیف
```
ارزش طلا      = وزن (گرم) × نرخ هر گرم
اجرت ساخت     = ارزش طلا × درصد اجرت
سود فروشنده   = (ارزش طلا + اجرت) × ۷٪
مالیات ارزش افزوده = (اجرت + سود) × ۱۰٪      ← فقط بر اجرت و سود، نه بر خود طلا
مبلغ ردیف     = ارزش طلا + اجرت + سود + سنگ و نگین + مالیات
```
درصد سود، نرخ مالیات و نرخ روز طلا در بالای `build.py` قابل تغییر است.
