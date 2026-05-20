#!/usr/bin/env python3
"""Generate placeholder images for Shamse Swim website using Pillow."""

import os
import math
import random
from PIL import Image, ImageDraw, ImageFont, ImageFilter

random.seed(42)
OUT = "/home/user/shamse-swim/images"
os.makedirs(OUT, exist_ok=True)

# ── colour palette ──────────────────────────────────────────────────────────
PEACH   = (237, 213, 181)
GOLD    = (212, 165, 53)
GOLD_L  = (240, 200, 100)
TEAL    = (45, 191, 191)
PURPLE  = (130, 80, 170)
CRIMSON = (176, 48, 48)
SAGE    = (122, 158, 106)
DARK    = (30, 26, 46)
SAND    = (210, 185, 145)
SKY     = (135, 196, 220)
SEA     = (40, 130, 160)
WHITE   = (255, 255, 255)
BLACK   = (10, 10, 10)
DARK_BG = (20, 15, 35)


def lerp_color(c1, c2, t):
    return tuple(int(c1[i] + (c2[i] - c1[i]) * t) for i in range(3))


def gradient(img, top, bottom):
    w, h = img.size
    draw = ImageDraw.Draw(img)
    for y in range(h):
        c = lerp_color(top, bottom, y / h)
        draw.line([(0, y), (w, y)], fill=c)
    return img


def noise_overlay(img, strength=18):
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            d = random.randint(-strength, strength)
            r, g, b = px[x, y][:3]
            px[x, y] = (
                max(0, min(255, r + d)),
                max(0, min(255, g + d)),
                max(0, min(255, b + d)),
            )
    return img


def draw_shamse(draw, cx, cy, r, color, rays=8):
    """Draw an 8-pointed star (shamse)."""
    points = []
    for i in range(rays * 2):
        angle = math.pi * i / rays - math.pi / 2
        radius = r if i % 2 == 0 else r * 0.45
        points.append((cx + radius * math.cos(angle), cy + radius * math.sin(angle)))
    draw.polygon(points, fill=color)


def draw_cross_stitch(draw, x, y, size, color):
    """Draw a small cross stitch X."""
    s = size // 2
    draw.line([(x - s, y - s), (x + s, y + s)], fill=color, width=max(1, size // 6))
    draw.line([(x + s, y - s), (x - s, y + s)], fill=color, width=max(1, size // 6))


def tatreez_border(draw, w, h, color, thickness=28, spacing=22):
    """Draw a geometric tatreez-style border."""
    # horizontal bands top and bottom
    for band_y in [thickness // 2, h - thickness // 2]:
        for x in range(0, w, spacing):
            draw_shamse(draw, x, band_y, thickness // 2 - 2, color)
    for band_x in [thickness // 2, w - thickness // 2]:
        for y in range(0, h, spacing):
            draw_shamse(draw, band_x, y, thickness // 2 - 2, color)


def save(img, name):
    path = os.path.join(OUT, name)
    img.save(path, quality=90)
    print(f"  ✓ {name}")


# ── 1. shamse-letters.jpg ───────────────────────────────────────────────────
def make_shamse_letters():
    w, h = 1600, 700
    img = Image.new("RGB", (w, h), DARK_BG)
    draw = ImageDraw.Draw(img)
    # subtle radial glow
    for r in range(300, 0, -10):
        alpha = int(60 * (1 - r / 300))
        c = lerp_color(DARK_BG, (80, 60, 120), r / 300)
        draw.ellipse([w // 2 - r, h // 2 - r // 2, w // 2 + r, h // 2 + r // 2], fill=c)

    letters = "SHAMSE"
    bead_palette = [
        (220, 80, 80), (80, 180, 220), (200, 160, 60),
        (160, 80, 200), (80, 190, 130), (220, 130, 60),
        (200, 200, 80), (180, 80, 160), (100, 200, 200),
    ]
    letter_width = w // (len(letters) + 1)
    letter_start_x = letter_width // 2

    for i, letter in enumerate(letters):
        cx = letter_start_x + i * letter_width
        cy = h // 2
        # draw letter outline from bead circles
        # simulate letter with bead clusters
        cols = bead_palette[i % len(bead_palette)]
        cols2 = bead_palette[(i + 3) % len(bead_palette)]

        # Large iridescent letter shape via layered ellipses
        for layer in range(5, 0, -1):
            t = layer / 5
            c = lerp_color(cols, cols2, t)
            # shimmer
            shimmer = (
                min(255, c[0] + 60),
                min(255, c[1] + 60),
                min(255, c[2] + 60),
            )
            draw.ellipse(
                [cx - 55 + layer * 2, cy - 140 + layer * 4,
                 cx + 55 - layer * 2, cy + 140 - layer * 4],
                fill=lerp_color(c, shimmer, 0.5),
                outline=shimmer,
                width=2,
            )

        # bead dots around the letter
        for angle_i in range(30):
            angle = 2 * math.pi * angle_i / 30
            for radius in [48, 72, 95]:
                bx = cx + int(radius * math.cos(angle))
                by = cy + int(radius * math.sin(angle) * 1.6)
                br = random.randint(5, 9)
                bc = bead_palette[random.randint(0, len(bead_palette) - 1)]
                highlight = (min(255, bc[0] + 80), min(255, bc[1] + 80), min(255, bc[2] + 80))
                draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bc, outline=highlight, width=1)

        # letter text approximation with bold dots
        try:
            font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 180)
        except Exception:
            font = ImageFont.load_default()
        draw.text((cx, cy), letter, font=font, fill=WHITE, anchor="mm", stroke_width=3, stroke_fill=cols)

    # scatter extra beads
    for _ in range(300):
        bx = random.randint(0, w)
        by = random.randint(0, h)
        br = random.randint(2, 7)
        bc = bead_palette[random.randint(0, len(bead_palette) - 1)]
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bc)

    save(img, "shamse-letters.jpg")


# ── 2. red-bodychain.jpg ────────────────────────────────────────────────────
def make_red_bodychain():
    w, h = 900, 1200
    img = Image.new("RGB", (w, h))
    gradient(img, (200, 170, 140), (160, 130, 100))
    draw = ImageDraw.Draw(img)

    # body shape - simple silhouette area
    body_color = (180, 100, 90)
    draw.ellipse([w // 2 - 120, 80, w // 2 + 120, 320], fill=(220, 190, 160))  # shoulders area
    draw.rectangle([w // 2 - 110, 200, w // 2 + 110, h - 80], fill=(220, 190, 160))

    # red bikini top
    top_color = CRIMSON
    draw.polygon([
        (w // 2 - 110, 220), (w // 2, 340), (w // 2 + 110, 220),
        (w // 2 + 90, 280), (w // 2, 380), (w // 2 - 90, 280),
    ], fill=top_color)

    # tatreez embroidery on top
    emb_color = GOLD
    for i in range(5):
        ex = w // 2 - 80 + i * 40
        ey = 270
        draw_shamse(draw, ex, ey, 10, emb_color)
        draw_cross_stitch(draw, ex, ey + 30, 8, emb_color)

    # body chain - gold diagonal lines
    chain_color = GOLD_L
    for i in range(8):
        y_start = 380 + i * 40
        draw.line([(w // 2 - 80 + i * 10, y_start), (w // 2 + 80 - i * 5, y_start + 20)],
                  fill=chain_color, width=2)
        # sun charms
        if i % 2 == 0:
            cx = w // 2 + 60 - i * 5
            draw_shamse(draw, cx, y_start + 30, 12, GOLD)

    # red bikini bottom
    draw.polygon([
        (w // 2 - 100, 720), (w // 2 + 100, 720),
        (w // 2 + 80, 880), (w // 2, 920), (w // 2 - 80, 880),
    ], fill=top_color)
    for i in range(3):
        draw_shamse(draw, w // 2 - 40 + i * 40, 780, 8, emb_color)

    # decorative background swirls
    for _ in range(20):
        sx = random.randint(0, w)
        sy = random.randint(0, h)
        draw_shamse(draw, sx, sy, random.randint(5, 15), (*GOLD, 80))

    noise_overlay(img, 12)
    save(img, "red-bodychain.jpg")


# ── 3. green-beach.jpg ──────────────────────────────────────────────────────
def make_green_beach():
    w, h = 900, 1200
    img = Image.new("RGB", (w, h))
    # sky + sea + sand
    gradient(img, (135, 196, 220), (40, 130, 160))
    draw = ImageDraw.Draw(img)
    # sea band
    draw.rectangle([0, h // 3, w, h // 2], fill=(30, 110, 140))
    # sand
    for y in range(h // 2, h):
        t = (y - h // 2) / (h // 2)
        c = lerp_color((200, 180, 150), (180, 155, 120), t)
        draw.line([(0, y), (w, y)], fill=c)

    # figure
    skin = (220, 190, 160)
    draw.ellipse([w // 2 - 60, 60, w // 2 + 60, 180], fill=skin)  # head
    draw.rectangle([w // 2 - 70, 180, w // 2 + 70, h // 2 + 50], fill=skin)

    # sage bikini
    sage = SAGE
    draw.polygon([
        (w // 2 - 70, 190), (w // 2, 290), (w // 2 + 70, 190),
        (w // 2 + 55, 250), (w // 2, 310), (w // 2 - 55, 250),
    ], fill=sage)

    # millefiori bead strap
    bead_colors = [(80, 160, 200), (200, 80, 120), (220, 200, 60), (80, 200, 130)]
    for i in range(20):
        bx = w // 2 - 70 + i * 7
        by = 195
        bc = bead_colors[i % len(bead_colors)]
        draw.ellipse([bx - 5, by - 5, bx + 5, by + 5], fill=bc, outline=WHITE, width=1)

    # tatreez on top
    for i in range(5):
        draw_cross_stitch(draw, w // 2 - 50 + i * 25, 240, 8, GOLD)

    # bottom
    draw.polygon([
        (w // 2 - 65, h // 2 - 30), (w // 2 + 65, h // 2 - 30),
        (w // 2 + 50, h // 2 + 100), (w // 2, h // 2 + 130), (w // 2 - 50, h // 2 + 100),
    ], fill=sage)

    # water reflections
    for i in range(8):
        ry = h // 3 + 20 + i * 12
        draw.line([(random.randint(0, w // 3), ry), (random.randint(w // 2, w), ry)],
                  fill=(60, 140, 170), width=1)

    noise_overlay(img, 10)
    save(img, "green-beach.jpg")


# ── 4. purple-sun.jpg ───────────────────────────────────────────────────────
def make_purple_sun():
    w, h = 900, 1200
    img = Image.new("RGB", (w, h))
    gradient(img, (237, 213, 181), (220, 190, 155))
    draw = ImageDraw.Draw(img)

    # palm shadow overlay (dark lines)
    for i in range(12):
        angle = -60 + i * 8
        rad = math.radians(angle)
        x2 = w // 2 + int(math.cos(rad) * 600)
        y2 = -50 + int(math.sin(rad) * 600)
        draw.line([(w // 2, -50), (x2, y2)], fill=(180, 155, 120, 60), width=max(2, 8 - i // 2))

    # sun in upper area
    draw_shamse(draw, w - 100, 80, 55, GOLD)
    draw.ellipse([w - 130, 50, w - 70, 110], fill=GOLD_L)

    # figure
    skin = (220, 190, 160)
    draw.ellipse([w // 2 - 55, 80, w // 2 + 55, 190], fill=skin)
    draw.rectangle([w // 2 - 65, 190, w // 2 + 65, h - 100], fill=skin)

    # purple bikini top
    draw.polygon([
        (w // 2 - 65, 200), (w // 2, 300), (w // 2 + 65, 200),
        (w // 2 + 52, 260), (w // 2, 320), (w // 2 - 52, 260),
    ], fill=PURPLE)

    # gold bead strap
    for i in range(22):
        bx = w // 2 - 65 + i * 6
        by = 205
        draw.ellipse([bx - 5, by - 5, bx + 5, by + 5], fill=GOLD, outline=GOLD_L, width=1)

    # sun charms hanging
    for i in range(3):
        cx_charm = w // 2 - 40 + i * 40
        for j in range(3):
            draw.line([(cx_charm, 260 + j * 20), (cx_charm, 275 + j * 20)], fill=GOLD, width=1)
        draw_shamse(draw, cx_charm, 295, 10, GOLD)

    # tatreez
    for i in range(6):
        draw_cross_stitch(draw, w // 2 - 50 + i * 20, 250, 7, (200, 170, 230))

    noise_overlay(img, 10)
    save(img, "purple-sun.jpg")


# ── 5. black-turquoise.jpg ──────────────────────────────────────────────────
def make_black_turquoise():
    w, h = 900, 1200
    img = Image.new("RGB", (w, h))
    gradient(img, (100, 180, 210), (30, 100, 140))
    draw = ImageDraw.Draw(img)

    # sea
    draw.rectangle([0, h // 3, w, h], fill=(25, 90, 120))
    for i in range(15):
        wy = h // 3 + i * 20
        draw.line([(0, wy), (w, wy)], fill=(35, 110, 145), width=1)

    # figure
    skin = (215, 185, 155)
    draw.ellipse([w // 2 - 60, 50, w // 2 + 60, 170], fill=skin)
    draw.rectangle([w // 2 - 70, 170, w // 2 + 70, h // 3 + 80], fill=skin)

    # black bikini top with gold tatreez
    draw.polygon([
        (w // 2 - 70, 180), (w // 2, 285), (w // 2 + 70, 180),
        (w // 2 + 58, 240), (w // 2, 305), (w // 2 - 58, 240),
    ], fill=(20, 20, 25))

    # gold tatreez on top
    for i in range(6):
        ex = w // 2 - 55 + i * 22
        draw_shamse(draw, ex, 225, 8, GOLD)
        draw.line([(ex - 10, 238), (ex + 10, 238)], fill=GOLD, width=1)

    # prominent turquoise bead strap
    for i in range(24):
        bx = w // 2 - 70 + i * 6
        by = 185
        draw.ellipse([bx - 6, by - 6, bx + 6, by + 6], fill=TEAL, outline=(20, 200, 200), width=1)

    # black bottom
    draw.polygon([
        (w // 2 - 65, h // 3 - 10), (w // 2 + 65, h // 3 - 10),
        (w // 2 + 52, h // 3 + 100), (w // 2, h // 3 + 130), (w // 2 - 52, h // 3 + 100),
    ], fill=(20, 20, 25))
    for i in range(4):
        draw_shamse(draw, w // 2 - 45 + i * 30, h // 3 + 30, 7, GOLD)

    noise_overlay(img, 10)
    save(img, "black-turquoise.jpg")


# ── 6. beads.jpg ────────────────────────────────────────────────────────────
def make_beads():
    w, h = 1200, 800
    img = Image.new("RGB", (w, h), (15, 12, 25))
    draw = ImageDraw.Draw(img)

    bead_colors = [
        (220, 80, 80), (80, 200, 220), (212, 165, 53), (160, 80, 210),
        (80, 200, 120), (220, 140, 60), (200, 200, 80), (180, 80, 150),
        (100, 160, 220), (220, 180, 80), (120, 220, 180), (200, 100, 80),
    ]

    # draw strands of beads
    num_strands = 14
    for strand in range(num_strands):
        y_base = 60 + strand * 52
        x_start = random.randint(-30, 60)
        # slight curve
        for i in range(70):
            bx = x_start + i * 18
            by = y_base + int(math.sin(i * 0.4) * 8)
            br = random.randint(8, 14)
            bc = bead_colors[random.randint(0, len(bead_colors) - 1)]
            highlight = (min(255, bc[0] + 90), min(255, bc[1] + 90), min(255, bc[2] + 90))
            shadow = (max(0, bc[0] - 60), max(0, bc[1] - 60), max(0, bc[2] - 60))
            # bead body
            draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bc, outline=shadow, width=1)
            # highlight
            draw.ellipse([bx - br // 3, by - br // 2, bx + br // 4, by - br // 4],
                         fill=highlight)
            # millefiori pattern dot
            if random.random() < 0.4:
                dot_c = bead_colors[random.randint(0, len(bead_colors) - 1)]
                draw.ellipse([bx - 3, by - 3, bx + 3, by + 3], fill=dot_c)

    # scatter single decorative beads
    for _ in range(80):
        bx = random.randint(0, w)
        by = random.randint(0, h)
        br = random.randint(4, 10)
        bc = bead_colors[random.randint(0, len(bead_colors) - 1)]
        draw.ellipse([bx - br, by - br, bx + br, by + br], fill=bc)

    save(img, "beads.jpg")


# ── 7. purple-beads.jpg ─────────────────────────────────────────────────────
def make_purple_beads():
    w, h = 900, 1200
    img = Image.new("RGB", (w, h))
    gradient(img, (180, 160, 210), (100, 80, 150))
    draw = ImageDraw.Draw(img)

    # beach sand bottom
    for y in range(h * 2 // 3, h):
        t = (y - h * 2 // 3) / (h // 3)
        c = lerp_color((200, 185, 160), (175, 155, 130), t)
        draw.line([(0, y), (w, y)], fill=c)

    # water strip
    draw.rectangle([0, h // 2, w, h * 2 // 3], fill=(60, 120, 160))

    # figure
    skin = (215, 185, 155)
    draw.ellipse([w // 2 - 55, 50, w // 2 + 55, 165], fill=skin)
    draw.rectangle([w // 2 - 65, 165, w // 2 + 65, h // 2], fill=skin)

    # purple top
    draw.polygon([
        (w // 2 - 65, 175), (w // 2, 275), (w // 2 + 65, 175),
        (w // 2 + 52, 235), (w // 2, 295), (w // 2 - 52, 235),
    ], fill=PURPLE)

    # millefiori bead strap
    millefiori_colors = [(80, 180, 220), (220, 80, 80), (220, 200, 60), (160, 80, 200),
                         (80, 200, 130), (220, 130, 60)]
    for i in range(22):
        bx = w // 2 - 65 + i * 6
        by = 180
        bc = millefiori_colors[i % len(millefiori_colors)]
        draw.ellipse([bx - 6, by - 6, bx + 6, by + 6], fill=bc, outline=WHITE, width=1)
        # flower pattern
        draw.ellipse([bx - 2, by - 2, bx + 2, by + 2], fill=WHITE)

    # tatreez embroidery
    for i in range(6):
        draw_cross_stitch(draw, w // 2 - 50 + i * 20, 240, 7, (220, 180, 255))
        draw_shamse(draw, w // 2 - 45 + i * 18, 255, 5, (200, 160, 240))

    noise_overlay(img, 10)
    save(img, "purple-beads.jpg")


# ── 8. green-bikini.jpg ─────────────────────────────────────────────────────
def make_green_bikini():
    w, h = 900, 1200
    img = Image.new("RGB", (w, h))
    gradient(img, (120, 180, 100), (80, 140, 70))
    draw = ImageDraw.Draw(img)

    # grass texture
    for _ in range(400):
        gx = random.randint(0, w)
        gy = random.randint(h // 2, h)
        draw.line([(gx, gy), (gx + random.randint(-5, 5), gy - random.randint(20, 50))],
                  fill=(100, 160, 80), width=1)

    # figure
    skin = (215, 185, 155)
    draw.ellipse([w // 2 - 55, 60, w // 2 + 55, 175], fill=skin)
    draw.rectangle([w // 2 - 65, 175, w // 2 + 65, h // 2 + 20], fill=skin)

    # sage green top
    draw.polygon([
        (w // 2 - 65, 185), (w // 2, 285), (w // 2 + 65, 185),
        (w // 2 + 52, 245), (w // 2, 305), (w // 2 - 52, 245),
    ], fill=SAGE)

    # tatreez
    for i in range(7):
        draw_cross_stitch(draw, w // 2 - 55 + i * 18, 235, 8, GOLD)
        if i % 2 == 0:
            draw_shamse(draw, w // 2 - 50 + i * 18, 252, 5, GOLD)

    # sage bottom
    draw.polygon([
        (w // 2 - 62, h // 2 - 10), (w // 2 + 62, h // 2 - 10),
        (w // 2 + 50, h // 2 + 110), (w // 2, h // 2 + 140), (w // 2 - 50, h // 2 + 110),
    ], fill=SAGE)

    noise_overlay(img, 10)
    save(img, "green-bikini.jpg")


# ── 9. swimsuits-wall.jpg ───────────────────────────────────────────────────
def make_swimsuits_wall():
    w, h = 1400, 900
    img = Image.new("RGB", (w, h))
    gradient(img, (220, 200, 165), (195, 170, 135))
    draw = ImageDraw.Draw(img)

    # sandy wall texture
    for _ in range(2000):
        px = random.randint(0, w - 1)
        py = random.randint(0, h - 1)
        d = random.randint(-15, 15)
        bc = img.getpixel((px, py))
        draw.point((px, py), fill=(
            max(0, min(255, bc[0] + d)),
            max(0, min(255, bc[1] + d)),
            max(0, min(255, bc[2] + d)),
        ))

    # sunlight diagonal
    for i in range(5):
        x_start = w // 4 * i
        draw.polygon([
            (x_start, 0), (x_start + 200, 0),
            (x_start + 100, h), (x_start - 100, h),
        ], fill=(255, 245, 220, 15))

    # three hanging swimsuits
    colors_suits = [CRIMSON, (20, 20, 25), SAGE]
    emb_colors = [GOLD, GOLD, (180, 220, 140)]
    positions = [w // 4, w // 2, 3 * w // 4]

    for i, (sx, suit_color, emb_col) in enumerate(zip(positions, colors_suits, emb_colors)):
        # hanger rod
        draw.line([(sx - 80, 60), (sx + 80, 60)], fill=(180, 150, 110), width=4)
        draw.line([(sx, 60), (sx, 90)], fill=(180, 150, 110), width=3)

        # bikini top hanging
        draw.polygon([
            (sx - 75, 90), (sx, 200), (sx + 75, 90),
            (sx + 60, 155), (sx, 220), (sx - 60, 155),
        ], fill=suit_color)

        # strings
        draw.line([(sx - 75, 90), (sx - 75, 75)], fill=suit_color, width=2)
        draw.line([(sx + 75, 90), (sx + 75, 75)], fill=suit_color, width=2)

        # tatreez on top
        for j in range(4):
            draw_cross_stitch(draw, sx - 40 + j * 27, 155, 7, emb_col)
            draw_shamse(draw, sx - 38 + j * 26, 168, 5, emb_col)

        # bikini bottom hanging
        draw.polygon([
            (sx - 65, 280), (sx + 65, 280),
            (sx + 52, 420), (sx, 450), (sx - 52, 420),
        ], fill=suit_color)

        # bottom strings
        draw.line([(sx - 65, 280), (sx - 65, 265)], fill=suit_color, width=2)
        draw.line([(sx + 65, 280), (sx + 65, 265)], fill=suit_color, width=2)
        draw.line([(sx - 65, 265), (sx + 65, 265)], fill=suit_color, width=2)

        # sunlight on fabric
        draw.ellipse([sx - 30, 100, sx + 30, 160], fill=(*suit_color[:2], min(255, suit_color[2] + 30)))

    noise_overlay(img, 8)
    save(img, "swimsuits-wall.jpg")


# ── 10. product-teal.jpg ───────────────────────────────────────────────────
def make_product_teal():
    w, h = 800, 1000
    img = Image.new("RGB", (w, h))
    gradient(img, (180, 220, 220), (120, 190, 195))
    draw = ImageDraw.Draw(img)

    # figure base
    skin = (215, 185, 155)
    draw.ellipse([w // 2 - 55, 40, w // 2 + 55, 155], fill=skin)
    draw.rectangle([w // 2 - 65, 155, w // 2 + 65, h - 60], fill=skin)

    # teal suit
    draw.polygon([
        (w // 2 - 65, 165), (w // 2, 265), (w // 2 + 65, 165),
        (w // 2 + 52, 225), (w // 2, 285), (w // 2 - 52, 225),
    ], fill=TEAL)

    # tatreez
    for i in range(6):
        draw_cross_stitch(draw, w // 2 - 50 + i * 20, 220, 7, WHITE)
        draw_shamse(draw, w // 2 - 48 + i * 19, 235, 5, WHITE)

    # bead strap - turquoise
    for i in range(22):
        bx = w // 2 - 65 + i * 6
        draw.ellipse([bx - 5, 168, bx + 5, 178], fill=(20, 180, 180), outline=WHITE, width=1)

    draw.polygon([
        (w // 2 - 60, h // 2 - 20), (w // 2 + 60, h // 2 - 20),
        (w // 2 + 48, h // 2 + 90), (w // 2, h // 2 + 120), (w // 2 - 48, h // 2 + 90),
    ], fill=TEAL)

    noise_overlay(img, 10)
    save(img, "product-teal.jpg")


# ── 11. product-black.jpg ──────────────────────────────────────────────────
def make_product_black():
    w, h = 800, 1000
    img = Image.new("RGB", (w, h))
    gradient(img, (80, 70, 60), (50, 45, 38))
    draw = ImageDraw.Draw(img)

    skin = (215, 185, 155)
    draw.ellipse([w // 2 - 55, 40, w // 2 + 55, 155], fill=skin)
    draw.rectangle([w // 2 - 65, 155, w // 2 + 65, h - 60], fill=skin)

    # black + gold suit
    draw.polygon([
        (w // 2 - 65, 165), (w // 2, 265), (w // 2 + 65, 165),
        (w // 2 + 52, 225), (w // 2, 285), (w // 2 - 52, 225),
    ], fill=(20, 20, 25))

    for i in range(7):
        draw_shamse(draw, w // 2 - 55 + i * 18, 215, 7, GOLD)
        draw.line([(w // 2 - 55 + i * 18 - 8, 225), (w // 2 - 55 + i * 18 + 8, 225)], fill=GOLD, width=1)

    for i in range(22):
        bx = w // 2 - 65 + i * 6
        draw.ellipse([bx - 5, 168, bx + 5, 178], fill=GOLD, outline=GOLD_L, width=1)

    draw.polygon([
        (w // 2 - 60, h // 2 - 20), (w // 2 + 60, h // 2 - 20),
        (w // 2 + 48, h // 2 + 90), (w // 2, h // 2 + 120), (w // 2 - 48, h // 2 + 90),
    ], fill=(20, 20, 25))
    for i in range(4):
        draw_shamse(draw, w // 2 - 40 + i * 27, h // 2 + 30, 6, GOLD)

    noise_overlay(img, 10)
    save(img, "product-black.jpg")


# ── 12. product-red.jpg ────────────────────────────────────────────────────
def make_product_red():
    w, h = 800, 1000
    img = Image.new("RGB", (w, h))
    gradient(img, (210, 185, 155), (180, 155, 125))
    draw = ImageDraw.Draw(img)

    skin = (215, 185, 155)
    draw.ellipse([w // 2 - 55, 40, w // 2 + 55, 155], fill=skin)
    draw.rectangle([w // 2 - 65, 155, w // 2 + 65, h - 60], fill=skin)

    draw.polygon([
        (w // 2 - 65, 165), (w // 2, 265), (w // 2 + 65, 165),
        (w // 2 + 52, 225), (w // 2, 285), (w // 2 - 52, 225),
    ], fill=CRIMSON)

    for i in range(6):
        draw_cross_stitch(draw, w // 2 - 50 + i * 20, 220, 7, GOLD)

    # gold body chain
    for i in range(6):
        y_chain = 290 + i * 35
        draw.line([(w // 2 - 70 + i * 5, y_chain), (w // 2 + 70 - i * 5, y_chain)],
                  fill=GOLD, width=2)
        if i % 2 == 0:
            draw_shamse(draw, w // 2, y_chain + 18, 10, GOLD)

    draw.polygon([
        (w // 2 - 60, h // 2 + 40), (w // 2 + 60, h // 2 + 40),
        (w // 2 + 48, h // 2 + 150), (w // 2, h // 2 + 180), (w // 2 - 48, h // 2 + 150),
    ], fill=CRIMSON)

    noise_overlay(img, 10)
    save(img, "product-red.jpg")


# ── run all ─────────────────────────────────────────────────────────────────
if __name__ == "__main__":
    print("Generating images...")
    make_shamse_letters()
    make_red_bodychain()
    make_green_beach()
    make_purple_sun()
    make_black_turquoise()
    make_beads()
    make_purple_beads()
    make_green_bikini()
    make_swimsuits_wall()
    make_product_teal()
    make_product_black()
    make_product_red()
    print("Done!")
