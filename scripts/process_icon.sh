#!/usr/bin/env bash

set -eu

if [ $# -ne 2 ]; then
  echo "Usage: $0 <input_image> <output_dir>"
  exit 1
fi

readonly BASE_ICON="icon.png"
readonly FOREGROUND="icon_foreground.png"
readonly MONOCHROME="icon_monochrome.png"
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
magick "$FOREGROUND" -resize 75% -background none -gravity center -extent "${W}x${H}" "icon_foreground_small.png"
magick "$FOREGROUND" -fill white -colorize 100% "$MONOCHROME"

cx=$((W / 2))
cy=$((H / 2))
# Draw a circle from center to the top edge (radius = W/2)
magick -size "${W}x${H}" xc:none -fill "$bgcolor" \
  -draw "circle $cx,$cy $cx,0" \
  "$BACKGROUND"

magick -size 3000x3000 xc:"#2e2e2e" \( icon_round.png -resize 50% \) -gravity center -composite splash.png

echo "All icons generated successfully"
