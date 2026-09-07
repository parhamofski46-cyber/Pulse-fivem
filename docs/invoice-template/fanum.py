# -*- coding: utf-8 -*-
ONES = ["", "یک", "دو", "سه", "چهار", "پنج", "شش", "هفت", "هشت", "نه"]
TEENS = ["ده", "یازده", "دوازده", "سیزده", "چهارده", "پانزده", "شانزده", "هفده", "هجده", "نوزده"]
TENS = ["", "", "بیست", "سی", "چهل", "پنجاه", "شصت", "هفتاد", "هشتاد", "نود"]
HUNDREDS = ["", "صد", "دویست", "سیصد", "چهارصد", "پانصد", "ششصد", "هفتصد", "هشتصد", "نهصد"]
SCALES = ["", " هزار", " میلیون", " میلیارد", " بیلیون"]

def three(n):
    parts = []
    h, r = divmod(n, 100)
    if h:
        parts.append(HUNDREDS[h])
    if r >= 10 and r < 20:
        parts.append(TEENS[r - 10])
    else:
        t, o = divmod(r, 10)
        if t:
            parts.append(TENS[t])
        if o:
            parts.append(ONES[o])
    return " و ".join(parts)

def to_words(n):
    if n == 0:
        return "صفر"
    groups = []
    i = 0
    while n > 0:
        n, g = divmod(n, 1000)
        if g:
            groups.append(three(g) + SCALES[i])
        i += 1
    return " و ".join(reversed(groups))

FA = "۰۱۲۳۴۵۶۷۸۹"

def fa(s):
    return "".join(FA[int(c)] if c.isdigit() else c for c in str(s))

def money(n):
    return fa("{:,}".format(int(round(n))))

def dec(x, places=3):
    s = ("{:." + str(places) + "f}").format(x)
    a, b = s.split(".")
    return fa("{:,}".format(int(a)) + "." + b)
