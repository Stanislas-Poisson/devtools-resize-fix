"""
Generate the marketing images needed for the Chrome Web Store listing
(and GitHub's social preview), since the extension itself has no visible
UI to screenshot.

Outputs (all flat RGB, no alpha channel — required by the Web Store for
screenshots and promo tiles):
- screenshot.png          1280x800  (store listing screenshot, required)
- small_promo_tile.png     440x280  (store listing, optional)
- marquee_promo.png       1400x560  (store listing, optional)
- github_social_preview.png 1280x640 (GitHub repo Settings > Social preview)

Usage: python3 store-assets/generate.py
"""

from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

BLUE = (37, 99, 235)
DARK_SLATE = (15, 23, 42)
SLATE = (100, 116, 139)
LIGHT_BG = (248, 250, 252)
PANEL_DARK = (30, 41, 59)
PANEL_LINE = (71, 85, 105)
RED = (220, 38, 38)
GREEN = (22, 163, 74)
WHITE = (255, 255, 255)

FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")
SUPERSAMPLE = 2


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont:
    name = "DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf"
    return ImageFont.truetype(str(FONT_DIR / name), size * SUPERSAMPLE)


def centered_text(draw, cx, y, text, f, fill):
    bbox = draw.textbbox((0, 0), text, font=f)
    w = bbox[2] - bbox[0]
    draw.text((cx - w / 2, y), text, font=f, fill=fill)


def draw_arrow_icon(draw, cx, cy, scale, color=WHITE):
    shaft_half = 5 * scale
    draw.rectangle(
        [(cx - 20 * scale, cy - shaft_half), (cx + 20 * scale, cy + shaft_half)],
        fill=color,
    )
    head_half = 12 * scale
    draw.polygon(
        [
            (cx - 32 * scale, cy),
            (cx - 18 * scale, cy - head_half),
            (cx - 18 * scale, cy + head_half),
        ],
        fill=color,
    )
    draw.polygon(
        [
            (cx + 32 * scale, cy),
            (cx + 18 * scale, cy - head_half),
            (cx + 18 * scale, cy + head_half),
        ],
        fill=color,
    )


def mock_browser_window(draw, x, y, w, h, *, glitched: bool):
    # Window chrome.
    draw.rounded_rectangle([(x, y), (x + w, y + h)], radius=14, fill=WHITE, outline=(226, 232, 240), width=2)
    bar_h = 40
    draw.rounded_rectangle([(x, y), (x + w, y + bar_h + 14)], radius=14, fill=(241, 245, 249))
    draw.rectangle([(x, y + bar_h - 14), (x + w, y + bar_h)], fill=(241, 245, 249))
    for i, c in enumerate([RED, (245, 158, 11), GREEN]):
        draw.ellipse(
            [(x + 20 + i * 24, y + bar_h / 2 - 7), (x + 20 + i * 24 + 14, y + bar_h / 2 + 7)],
            fill=c,
        )

    content_y = y + bar_h + 14
    content_h = h - bar_h - 14
    devtools_w = w * 0.32
    main_w = w - devtools_w
    overrun = devtools_w * 0.45 if glitched else 0

    # Main content area — in the glitched version, content still thinks it
    # has the pre-DevTools width and overruns into the panel's territory.
    draw.rectangle([(x, content_y), (x + main_w, y + h)], fill=WHITE)
    for i in range(4):
        ly = content_y + 24 + i * 22
        draw.rectangle([(x + 20, ly), (x + main_w - 24 + overrun, ly + 10)], fill=(191, 219, 254))
    draw.rectangle(
        [(x + 20, content_y + 130), (x + main_w - 24 + overrun, content_y + 190)],
        fill=BLUE,
    )

    # Docked DevTools panel, drawn on top — clips whatever overruns into it.
    draw.rectangle([(x + main_w, content_y), (x + w, y + h)], fill=PANEL_DARK)
    for i in range(6):
        ly = content_y + 20 + i * 18
        draw.rectangle([(x + main_w + 16, ly), (x + w - 16, ly + 6)], fill=PANEL_LINE)

    if glitched:
        # Jagged seam + warning badge: content is visibly torn/clipped by the panel.
        tooth = 10
        n_teeth = int(content_h // tooth)
        zigzag = []
        for i in range(n_teeth + 1):
            zy = content_y + i * tooth
            zx = x + main_w + (6 if i % 2 == 0 else -6)
            zigzag.append((zx, zy))
        draw.line(zigzag, fill=RED, width=4)

        badge_r = 22
        bx, by = x + w - badge_r - 14, y + bar_h + 14 + badge_r + 6
        draw.ellipse([(bx - badge_r, by - badge_r), (bx + badge_r, by + badge_r)], fill=RED)
        draw.polygon(
            [(bx, by - 11), (bx - 10, by + 8), (bx + 10, by + 8)],
            fill=WHITE,
        )
        draw.rectangle([(bx - 2, by - 3), (bx + 2, by + 2)], fill=RED)
        draw.ellipse([(bx - 2, by + 4), (bx + 2, by + 8)], fill=RED)
    else:
        badge_r = 22
        bx, by = x + w - badge_r - 14, y + bar_h + 14 + badge_r + 6
        draw.ellipse([(bx - badge_r, by - badge_r), (bx + badge_r, by + badge_r)], fill=GREEN)
        draw.line([(bx - 10, by), (bx - 3, by + 9), (bx + 12, by - 10)], fill=WHITE, width=5, joint="curve")


def build_screenshot() -> Image.Image:
    w, h = 1280 * SUPERSAMPLE, 800 * SUPERSAMPLE
    img = Image.new("RGB", (w, h), LIGHT_BG)
    draw = ImageDraw.Draw(img)

    centered_text(draw, w / 2, 48 * SUPERSAMPLE, "DevTools Resize Fix", font(40, bold=True), DARK_SLATE)
    centered_text(
        draw,
        w / 2,
        104 * SUPERSAMPLE,
        "Fixes page layout breaking under a docked DevTools panel after reload",
        font(20),
        SLATE,
    )

    win_w, win_h = 520 * SUPERSAMPLE, 460 * SUPERSAMPLE
    gap = 60 * SUPERSAMPLE
    total_w = win_w * 2 + gap
    left_x = (w - total_w) / 2
    top_y = 190 * SUPERSAMPLE

    mock_browser_window(draw, left_x, top_y, win_w, win_h, glitched=True)
    mock_browser_window(draw, left_x + win_w + gap, top_y, win_w, win_h, glitched=False)

    label_y = top_y - 44 * SUPERSAMPLE
    before_cx = left_x + win_w / 2
    after_cx = left_x + win_w + gap + win_w / 2

    draw.rounded_rectangle(
        [(before_cx - 70 * SUPERSAMPLE, label_y), (before_cx + 70 * SUPERSAMPLE, label_y + 34 * SUPERSAMPLE)],
        radius=17 * SUPERSAMPLE,
        fill=RED,
    )
    centered_text(draw, before_cx, label_y + 5 * SUPERSAMPLE, "BEFORE", font(16, bold=True), WHITE)

    draw.rounded_rectangle(
        [(after_cx - 70 * SUPERSAMPLE, label_y), (after_cx + 70 * SUPERSAMPLE, label_y + 34 * SUPERSAMPLE)],
        radius=17 * SUPERSAMPLE,
        fill=GREEN,
    )
    centered_text(draw, after_cx, label_y + 5 * SUPERSAMPLE, "AFTER", font(16, bold=True), WHITE)

    caption_y = top_y + win_h + 30 * SUPERSAMPLE
    centered_text(
        draw,
        w / 2,
        caption_y,
        "Active only while DevTools is open — no host permissions, works on any site",
        font(18),
        SLATE,
    )

    return img.resize((1280, 800), Image.LANCZOS)


def build_promo(
    width: int,
    height: int,
    *,
    title_size: int,
    subtitle_size: int,
    icon_scale: float,
    subtitle: str,
) -> Image.Image:
    w, h = width * SUPERSAMPLE, height * SUPERSAMPLE
    img = Image.new("RGB", (w, h), BLUE)
    draw = ImageDraw.Draw(img)

    icon_cx = w * 0.16
    draw_arrow_icon(draw, icon_cx, h / 2, icon_scale * SUPERSAMPLE)

    text_x = w * 0.28
    centered_block_y = h / 2
    title_f = font(title_size, bold=True)
    subtitle_f = font(subtitle_size)

    title = "DevTools Resize Fix"

    title_bbox = draw.textbbox((0, 0), title, font=title_f)
    title_h = title_bbox[3] - title_bbox[1]
    subtitle_bbox = draw.textbbox((0, 0), subtitle, font=subtitle_f)
    gap = 14 * SUPERSAMPLE

    block_h = title_h + gap + (subtitle_bbox[3] - subtitle_bbox[1])
    start_y = centered_block_y - block_h / 2

    draw.text((text_x, start_y), title, font=title_f, fill=WHITE)
    draw.text((text_x, start_y + title_h + gap), subtitle, font=subtitle_f, fill=(219, 234, 254))

    return img.resize((width, height), Image.LANCZOS)


def main() -> None:
    out_dir = Path(__file__).parent

    full_subtitle = "Fixes docked-DevTools layout glitches after reload"
    short_subtitle = "Fixes docked-DevTools glitches"

    build_screenshot().save(out_dir / "screenshot.png")
    build_promo(
        440, 280, title_size=24, subtitle_size=13, icon_scale=1.3, subtitle=short_subtitle
    ).save(out_dir / "small_promo_tile.png")
    build_promo(
        1400, 560, title_size=52, subtitle_size=26, icon_scale=2.6, subtitle=full_subtitle
    ).save(out_dir / "marquee_promo.png")
    build_promo(
        1280, 640, title_size=48, subtitle_size=24, icon_scale=2.4, subtitle=full_subtitle
    ).save(out_dir / "github_social_preview.png")

    for name in ("screenshot.png", "small_promo_tile.png", "marquee_promo.png", "github_social_preview.png"):
        print(f"wrote {out_dir / name}")


if __name__ == "__main__":
    main()
