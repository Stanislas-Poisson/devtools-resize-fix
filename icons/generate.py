"""
Regenerate the extension icons (icons/icon16.png, icon48.png, icon128.png).

Simple double-arrow glyph on a rounded square background, evoking the
"width nudge" the extension performs. No external assets, no network —
just Pillow primitives, so anyone can rebuild the icons deterministically.

Usage: python3 icons/generate.py
"""

from pathlib import Path

from PIL import Image, ImageDraw

BACKGROUND = (37, 99, 235, 255)  # #2563EB
FOREGROUND = (255, 255, 255, 255)
SIZES = (16, 48, 128)
SUPERSAMPLE = 8


def draw_icon(size: int) -> Image.Image:
    canvas_size = size * SUPERSAMPLE
    img = Image.new("RGBA", (canvas_size, canvas_size), (0, 0, 0, 0))
    draw = ImageDraw.Draw(img)

    radius = int(canvas_size * 0.22)
    draw.rounded_rectangle(
        [(0, 0), (canvas_size - 1, canvas_size - 1)],
        radius=radius,
        fill=BACKGROUND,
    )

    mid_y = canvas_size * 0.5
    shaft_half_width = canvas_size * 0.05
    draw.rectangle(
        [
            (canvas_size * 0.30, mid_y - shaft_half_width),
            (canvas_size * 0.70, mid_y + shaft_half_width),
        ],
        fill=FOREGROUND,
    )

    head_half_height = canvas_size * 0.12
    # Left arrowhead.
    draw.polygon(
        [
            (canvas_size * 0.18, mid_y),
            (canvas_size * 0.32, mid_y - head_half_height),
            (canvas_size * 0.32, mid_y + head_half_height),
        ],
        fill=FOREGROUND,
    )
    # Right arrowhead.
    draw.polygon(
        [
            (canvas_size * 0.82, mid_y),
            (canvas_size * 0.68, mid_y - head_half_height),
            (canvas_size * 0.68, mid_y + head_half_height),
        ],
        fill=FOREGROUND,
    )

    return img.resize((size, size), Image.LANCZOS)


def main() -> None:
    out_dir = Path(__file__).parent
    for size in SIZES:
        icon = draw_icon(size)
        out_path = out_dir / f"icon{size}.png"
        icon.save(out_path)
        print(f"wrote {out_path}")


if __name__ == "__main__":
    main()
