"""Run with python3 test/max-icon-check.py (Pillow)."""
from pathlib import Path
from PIL import Image

image = Image.open(Path(__file__).parents[1] / 'public/images/max-icon.webp')
assert image.size == (128, 128)
assert image.mode == 'RGBA', 'Use the supplied transparent icon, not an opaque backdrop'
assert image.getpixel((0, 0))[3] == 0
left, top, right, bottom = image.getchannel('A').point(lambda a: 255 if a > 128 else 0).getbbox()
assert 124 <= right - left <= 128 and 124 <= bottom - top <= 128, 'Visible ring must fill the shared 32px button'
print('MAX icon: transparent, visible diameter matches 32px Telegram button')
