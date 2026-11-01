import cv2, numpy as np, os, sys
from PIL import Image, ImageDraw, ImageFont
from simple_lama_inpainting import SimpleLama

SRC = 'public/imported'
FONTB = 'C:/Windows/Fonts/arialbd.ttf'
FONT = 'C:/Windows/Fonts/arial.ttf'
SITE = 'dubaicigeretteshop.ae'

lama = SimpleLama()

def lama_inpaint(bgr, mask):
    ys, xs = np.where(mask > 0)
    h0, w0 = bgr.shape[:2]
    x0, x1 = max(xs.min()-60,0), min(xs.max()+60,w0)
    y0, y1 = max(ys.min()-60,0), min(ys.max()+60,h0)
    crop = Image.fromarray(cv2.cvtColor(bgr[y0:y1, x0:x1], cv2.COLOR_BGR2RGB))
    cm = Image.fromarray(mask[y0:y1, x0:x1])
    out = np.array(lama(crop, cm))[: y1-y0, : x1-x0]
    res = bgr.copy(); res[y0:y1, x0:x1] = cv2.cvtColor(out, cv2.COLOR_RGB2BGR)
    return res

def detect_gray_wm(bgr):
    """translucent light strokes = watermark: thin structures lighter than local bg,
    clustered into the densest horizontal band in the image's lower area."""
    g = cv2.cvtColor(bgr, cv2.COLOR_BGR2GRAY)
    H, W = g.shape
    med = cv2.medianBlur(g, 61)
    d = cv2.subtract(g, med)
    cand = cv2.inRange(d, 13, 85)
    cand[med > 190] = 0
    cand[:int(H*0.30)] = 0
    cand[int(H*0.93):] = 0
    cand[int(H*0.55):int(H*0.68)] = 0   # our own diagonal watermark zone
    thin = cv2.subtract(cand, cv2.erode(cand, np.ones((3,3),np.uint8), iterations=2))
    rows = (thin>0).sum(1)
    sm = np.convolve(rows, np.ones(30)/30, 'same')
    base = np.median(sm[sm>0]) if (sm>0).any() else 0
    pk = sm.max()
    if pk < max(base*1.8, 90): return None
    pk_y = int(sm.argmax())
    y0, y1 = max(pk_y-70,0), min(pk_y+80,H)
    win = thin[y0:y1]
    xs = np.where((win>0).sum(0) > 1)[0]
    if not len(xs) or (xs.max()-xs.min()) < W*0.10: return None
    m = np.zeros((H,W),np.uint8)
    x0, x1 = max(int(xs.min())-15,0), min(int(xs.max())+15,W)
    # SAFETY: only inpaint if the band region is low-detail (uniform area);
    # busy text/product regions get skipped rather than damaged
    edges = cv2.Canny(g[y0:y1, x0:x1], 40, 120)
    if (edges>0).mean() > 0.055:
        return None
    m[y0:y1, x0:x1] = thin[y0:y1, x0:x1]
    m = cv2.dilate(m, np.ones((9,9),np.uint8), iterations=2)
    return m

def add_wm(pil):
    w, h = pil.size
    ov = Image.new('RGBA', pil.size, (0,0,0,0)); d = ImageDraw.Draw(ov)
    fs = max(13, int(w*0.042)); f = ImageFont.truetype(FONTB, fs)
    tw = d.textlength(SITE, font=f)
    lay = Image.new('RGBA', (int(tw+20), fs+14), (0,0,0,0))
    ImageDraw.Draw(lay).text((10,5), SITE, font=f, fill=(255,255,255,140))
    rot = lay.rotate(-28, expand=True, resample=Image.BICUBIC)
    ov.alpha_composite(rot, (int(w/2-rot.width/2), int(h*0.62)))
    fs2 = max(9, int(w*0.026)); f2 = ImageFont.truetype(FONT, fs2)
    t2 = 'DUBAI CIGARETTE SHOP.AE'; tw2 = d.textlength(t2, font=f2)
    pad = int(fs2*0.7); bx, by = w-tw2-pad*3, h-fs2-pad*2.4
    d.rounded_rectangle([bx,by,bx+tw2+pad*2,by+fs2+pad*1.6], radius=fs2, fill=(6,24,35,205))
    d.text((bx+pad, by+pad*0.5), t2, font=f2, fill=(244,177,67,235))
    out = pil.convert('RGBA'); out.alpha_composite(ov)
    return out.convert('RGB')

files = sys.argv[1:] or [os.path.join(SRC,f) for f in sorted(os.listdir(SRC)) if f.lower().endswith(('.webp','.png','.jpg','.jpeg'))]
done = skipped = 0
for p in files:
    try:
        bgr = cv2.imread(p, cv2.IMREAD_COLOR)
        if bgr is None: continue
        mask = detect_gray_wm(bgr)
        if mask is None or (mask>0).sum() < 800:
            skipped += 1; continue
        bgr = lama_inpaint(bgr, mask)
        add_wm(Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))).save(p, quality=92)
        done += 1
    except Exception as e:
        print('ERR', p, e, file=sys.stderr)
print('cleaned:', done, '| skipped:', skipped)
