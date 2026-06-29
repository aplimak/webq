#!/usr/bin/env bash

set -eu

if [ $# -ne 2 ]; then
  echo "Usage: $0 <input_image> <output_dir>"
  exit 1
fi

readonly BASE_ICON="icon.png"
readonly FOREGROUND="icon_foreground.png"
readonly BACKGROUND="icon_background.png"

ICON_PATH="$(realpath "$1")"

mkdir -p "$2"
cd "$2"

readonly ANDROID_OUT_DIR="android"
mkdir -p "$ANDROID_OUT_DIR"

echo "Converting to png"
magick "$ICON_PATH" "$BASE_ICON"

echo "Creating round icon"
min_size=$(identify -format "%[fx:min(w,h)]" "$BASE_ICON")
magick "$BASE_ICON" -resize "${min_size}x${min_size}^" -resize 125% -gravity center -extent "${min_size}x${min_size}" \( +clone -threshold -1 -draw "circle $((min_size / 2)),$((min_size / 2)) $((min_size / 2)),0" -negate \) -alpha off -compose copy_opacity -composite icon_round.png

echo "Extracting background and foreground"
# shellcheck disable=SC2046
read -r W H <<<$(identify -format "%w %h" "$BASE_ICON")

# Sample a corner pixel to determine the background colour (use 10% from edges)
# This avoids possible border effects.
x=$((W / 10))
y=$((H / 10))
fuzz="15%"
bgcolor=$(magick "$BASE_ICON" -format "%[pixel:p{$x,$y}]" info:-)

magick "$BASE_ICON" -fuzz "$fuzz" -transparent "$bgcolor" "$FOREGROUND"

cx=$((W / 2))
cy=$((H / 2))
# Draw a circle from center to the top edge (radius = W/2)
magick -size "${W}x${H}" xc:none -fill "$bgcolor" \
  -draw "circle $cx,$cy $cx,0" \
  "$BACKGROUND"

echo "Generating Android icons"

# Density scale factors (relative to mdpi)
declare -A SCALE
SCALE["ldpi"]="0.75"
SCALE["mdpi"]="1"
SCALE["hdpi"]="1.5"
SCALE["xhdpi"]="2"
SCALE["xxhdpi"]="3"
SCALE["xxxhdpi"]="4"

# Legacy icon sizes (non‑adaptive)
declare -A LEGACY_SIZE
LEGACY_SIZE["ldpi"]="36"
LEGACY_SIZE["mdpi"]="48"
LEGACY_SIZE["hdpi"]="72"
LEGACY_SIZE["xhdpi"]="96"
LEGACY_SIZE["xxhdpi"]="144"
LEGACY_SIZE["xxxhdpi"]="192"

# Adaptive icon base size in dp (Android standard)
ADAPTIVE_DP=108

for density in "${!SCALE[@]}"; do
  scale=${SCALE[$density]}
  # Calculate adaptive pixel size (108 dp × scale factor)
  size_px=$(echo "$ADAPTIVE_DP * $scale" | bc)
  size_rounded=$(printf "%.0f" "$size_px")

  echo "Generating $density (${size_rounded}px)..."

  # Foreground
  magick "$FOREGROUND" -resize "${size_rounded}x${size_rounded}" \
    -resize 75% -background none -gravity center -extent "${size_rounded}x${size_rounded}" \
    "$ANDROID_OUT_DIR/${density}-foreground.png"

  # Background
  magick "$BACKGROUND" -resize "${size_rounded}x${size_rounded}" \
    "$ANDROID_OUT_DIR/${density}-background.png"

  # Monochrome (white foreground on transparent background)
  magick "$FOREGROUND" -fill white -colorize 100% \
    -resize "${size_rounded}x${size_rounded}" \
    "$ANDROID_OUT_DIR/${density}-monochrome.png"

  # Legacy icon (old‑style square)
  legacy=${LEGACY_SIZE[$density]}
  magick "$BASE_ICON" -resize "${legacy}x${legacy}" \
    "$ANDROID_OUT_DIR/icon-${density}.png"
done

echo "All icons generated successfully"
