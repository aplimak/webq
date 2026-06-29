#!/usr/bin/env python3
import subprocess
import os
import sys
from PIL import Image
import shutil
import json

# ------------------------------------------------------------
# 1. CONFIGURATION
# ------------------------------------------------------------
SOURCE_IMAGE = sys.argv[1]
OUTPUT_DIR = sys.argv[2] if len(sys.argv) > 2 else "generated_icons"
TEMP_DIR = os.path.join(OUTPUT_DIR, "temp")

os.makedirs(OUTPUT_DIR, exist_ok=True)
os.makedirs(TEMP_DIR, exist_ok=True)


# ------------------------------------------------------------
# 2. DETECT BACKGROUND COLOR (from 4 corners)
# ------------------------------------------------------------
def get_corner_color(image_path):
    img = Image.open(image_path).convert("RGB")
    w, h = img.size
    corners = [
        img.getpixel((0, 0)),  # top-left
        img.getpixel((w - 1, 0)),  # top-right
        img.getpixel((0, h - 1)),  # bottom-left
        img.getpixel((w - 1, h - 1)),  # bottom-right
    ]
    # Find the most frequent corner color (handles anti-aliasing edge cases)
    from collections import Counter

    color_hex = "#{:02x}{:02x}{:02x}".format(*Counter(corners).most_common(1)[0][0])
    return color_hex


print(f"[1] Detecting background color from corners...")
BG_COLOR = get_corner_color(SOURCE_IMAGE)
print(f"    -> Found: {BG_COLOR}")

# ------------------------------------------------------------
# 3. EXTRACT BARE FOREGROUND (remove bg, trim empty space)
# ------------------------------------------------------------
print(f"[2] Extracting foreground (removing {BG_COLOR})...")
FOREGROUND_PNG = os.path.join(TEMP_DIR, "foreground.png")
subprocess.run(
    [
        "convert",
        SOURCE_IMAGE,
        "-fuzz",
        "15%",  # Allows slight gradients/anti-aliasing
        "-transparent",
        BG_COLOR,
        "-trim",
        "+repage",  # Crop to the actual shape
        FOREGROUND_PNG,
    ],
    check=True,
    capture_output=True,
)

# Get trimmed foreground dimensions
fg_img = Image.open(FOREGROUND_PNG)
print(f"    -> Extracted shape: {fg_img.size[0]}x{fg_img.size[1]} pixels")

# ------------------------------------------------------------
# 4. GENERATE STANDARD PNG SIZES
# ------------------------------------------------------------
print(f"[3] Generating standard PNG sizes...")
SIZES = [16, 24, 32, 48, 64, 96, 128, 180, 192, 256, 384, 512, 1024]
for size in SIZES:
    out_path = os.path.join(OUTPUT_DIR, f"icon_{size}.png")
    subprocess.run(
        [
            "convert",
            FOREGROUND_PNG,
            "-resize",
            f"{size}x{size}",
            "-background",
            "none",
            "-gravity",
            "center",
            "-extent",
            f"{size}x{size}",  # Pad to square
            out_path,
        ],
        check=True,
        capture_output=True,
    )

# ------------------------------------------------------------
# 5. GENERATE WINDOWS .ICO FILE
# ------------------------------------------------------------
print(f"[4] Generating Windows .ico...")
ICO_SIZES = [16, 24, 32, 48, 64, 128, 256]
ico_inputs = [os.path.join(OUTPUT_DIR, f"icon_{s}.png") for s in ICO_SIZES]
subprocess.run(
    ["convert"] + ico_inputs + [os.path.join(OUTPUT_DIR, "favicon.ico")],
    check=True,
    capture_output=True,
)

# ------------------------------------------------------------
# 6. WEB FAVICONS (prefer favipack, fallback to manual)
# ------------------------------------------------------------
print(f"[5] Generating Web Favicons...")
if (
    shutil.which("favipack")
    and subprocess.run(["favipack", "--version"], capture_output=True).returncode == 0
):
    subprocess.run(
        [
            "favipack",
            "pack",
            SOURCE_IMAGE,
            os.path.join(OUTPUT_DIR, "web"),
            "--app-name",
            "MyApp",
            "--background",
            BG_COLOR,
        ],
        check=True,
        capture_output=True,
    )
    print("    -> Used favipack")
else:
    print("    -> favipack not found, using fallback (ImageMagick)")
    # Generate standard web sizes manually
    for s in [16, 32, 96, 180, 192]:
        shutil.copy(
            os.path.join(OUTPUT_DIR, f"icon_{s}.png"),
            os.path.join(OUTPUT_DIR, f"web_icon_{s}.png"),
        )
    # Create a basic manifest
    manifest = {
        "name": "MyApp",
        "icons": [
            {"src": f"/icon_{s}.png", "sizes": f"{s}x{s}", "type": "image/png"}
            for s in [192, 512]
        ],
    }
    with open(os.path.join(OUTPUT_DIR, "site.webmanifest"), "w") as f:
        json.dump(manifest, f)

# ------------------------------------------------------------
# 7. ANDROID ADAPTIVE ICONS (SPLIT FOREGROUND/BACKGROUND)
# ------------------------------------------------------------
print(f"[6] Generating Android Adaptive Icons...")
ANDROID_DIR = os.path.join(OUTPUT_DIR, "android")
os.makedirs(ANDROID_DIR, exist_ok=True)

# 7a. Foreground drawable (sized for adaptive: 108x108 dp scale)
foreground_adaptive = os.path.join(ANDROID_DIR, "ic_launcher_foreground.png")
subprocess.run(
    [
        "convert",
        FOREGROUND_PNG,
        "-resize",
        "432x432",  # 108dp * 4 (for xxxhdpi base), android scales it
        "-background",
        "none",
        "-gravity",
        "center",
        "-extent",
        "432x432",
        foreground_adaptive,
    ],
    check=True,
    capture_output=True,
)

# 7b. Background XML
bg_xml_path = os.path.join(ANDROID_DIR, "ic_launcher_background.xml")
with open(bg_xml_path, "w") as f:
    f.write(f'''<?xml version="1.0" encoding="utf-8"?>
<shape xmlns:android="http://schemas.android.com/apk/res/android"
       android:shape="rectangle">
    <solid android:color="{BG_COLOR}" />
</shape>
''')

# 7c. Adaptive Icon XML
adaptive_xml_path = os.path.join(ANDROID_DIR, "ic_launcher.xml")
with open(adaptive_xml_path, "w") as f:
    f.write("""<?xml version="1.0" encoding="utf-8"?>
<adaptive-icon xmlns:android="http://schemas.android.com/apk/res/android">
    <background android:drawable="@drawable/ic_launcher_background" />
    <foreground android:drawable="@drawable/ic_launcher_foreground" />
</adaptive-icon>
""")

# 7d. Legacy icons (baked background + foreground) for pre-Android 8
print(f"    -> Generating legacy mipmap PNGs...")
DPI_FOLDERS = {
    "mipmap-hdpi": 72,
    "mipmap-xhdpi": 96,
    "mipmap-xxhdpi": 144,
    "mipmap-xxxhdpi": 192,
}
for folder, size in DPI_FOLDERS.items():
    folder_path = os.path.join(ANDROID_DIR, folder)
    os.makedirs(folder_path, exist_ok=True)
    # Composite: solid bg + foreground centered
    out_png = os.path.join(folder_path, "ic_launcher.png")
    subprocess.run(
        [
            "convert",
            "-size",
            f"{size}x{size}",
            "xc:" + BG_COLOR,
            FOREGROUND_PNG,
            "-resize",
            f"{int(size * 0.7)}x{int(size * 0.7)}",
            "-gravity",
            "center",
            "-composite",
            out_png,
        ],
        check=True,
        capture_output=True,
    )

print("    -> Android adaptive icons ready")

# ------------------------------------------------------------
# 8. CLEANUP
# ------------------------------------------------------------
shutil.rmtree(TEMP_DIR)
print(f"\n✅ ALL DONE! Output in: {OUTPUT_DIR}/")
print(f"   - Standard PNGs: icon_*.png")
print(f"   - Windows .ico: favicon.ico")
print(f"   - Web files: web/ folder + site.webmanifest")
print(
    f"   - Android Adaptive: android/ (copy 'drawable' and 'mipmap-*' into your project)"
)
