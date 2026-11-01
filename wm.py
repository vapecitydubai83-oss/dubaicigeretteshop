import cv2, numpy as np, os, sys
from PIL import Image, ImageDraw, ImageFont
from simple_lama_inpainting import SimpleLama

SRC = 'public/imported'
FONTB = 'C:/Windows/Fonts/arialbd.ttf'
FONT = 'C:/Windows/Fonts/arial.ttf'
SITE = 'dubaicigeretteshop.ae'

lama = SimpleLama()

def lama_inpaint(bgr, mask):
    # crop masked bbox + margin, inpaint with LaMa, paste back
    ys, xs = np.where(mask > 0)
    h0, w0 = bgr.shape[:2]
    x0, x1 = max(xs.min()-80,0), min(xs.max()+80,w0)
    y0, y1 = max(ys.min()-80,0), min(ys.max()+80,h0)
    crop = Image.fromarray(cv2.cvtColor(bgr[y0:y1, x0:x1], cv2.COLOR_BGR2RGB))
    cm = Image.fromarray(mask[y0:y1, x0:x1])
    out = np.array(lama(crop, cm))[: y1-y0, : x1-x0]
    res = bgr.copy()
    res[y0:y1, x0:x1] = cv2.cvtColor(out, cv2.COLOR_RGB2BGR)
    return res

def watermark_mask(bgr):
    hsv = cv2.cvtColor(bgr, cv2.COLOR_BGR2HSV)
    m1 = cv2.inRange(hsv, (128, 25, 40), (175, 255, 255))
    m2 = cv2.inRange(hsv, (128, 8, 170), (175, 90, 255))
    mask = cv2.bitwise_or(m1, m2)
    mask = cv2.morphologyEx(mask, cv2.MORPH_CLOSE, np.ones((5,5),np.uint8))
    mask = cv2.dilate(mask, np.ones((5,5),np.uint8), iterations=2)
    return mask

def add_wm(pil):
    w, h = pil.size
    ov = Image.new('RGBA', pil.size, (0,0,0,0))
    d = ImageDraw.Draw(ov)
    fs = max(13, int(w*0.042))
    f = ImageFont.truetype(FONTB, fs)
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
done = err = 0
for p in files:
    try:
        bgr = cv2.imread(p, cv2.IMREAD_COLOR)
        if bgr is None: continue
        mask = watermark_mask(bgr)
        if (mask>0).sum() > 50:
            bgr = lama_inpaint(bgr, mask)
        pil = Image.fromarray(cv2.cvtColor(bgr, cv2.COLOR_BGR2RGB))
        add_wm(pil).save(p, quality=92)
        done += 1
    except Exception as e:
        err += 1
        print('ERR', p, e, file=sys.stderr)
print('done:', done, 'err:', err)
