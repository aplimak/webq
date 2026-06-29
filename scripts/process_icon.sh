#!/usr/bin/env bash

set -eu

if [ $# -ne 2 ]; then
  echo "Usage: $0 <input_image> <output_dir>"
  exit 1
fi

ICON_PATH="$(realpath "$1")"

mkdir -p "$2"
cd "$2"

echo "Converting to png"
magick "$ICON_PATH" icon.png

echo "Creating round icon"
min_size=$(identify -format "%[fx:min(w,h)]" icon.png)
magick icon.png -resize "${min_size}x${min_size}^" -gravity center -extent "${min_size}x${min_size}" \( +clone -threshold -1 -draw "circle $((min_size / 2)),$((min_size / 2)) $((min_size / 2)),0" -negate \) -alpha off -compose copy_opacity -composite icon_round.png

echo "Extracting background and foreground"
# shellcheck disable=SC2046
read -r W H <<<$(identify -format "%w %h" icon.png)

# Sample a corner pixel to determine the background colour (use 10% from edges)
# This avoids possible border effects.
x=$((W / 10))
y=$((H / 10))
fuzz="5%"
bgcolor=$(magick icon.png -format "%[pixel:p{$x,$y}]" info:-)

magick icon.png -fuzz "$fuzz" -transparent "$bgcolor" "icon_foreground.png"

cx=$((W / 2))
cy=$((H / 2))
# Draw a circle from center to the top edge (radius = W/2)
magick -size "${W}x${H}" xc:none -fill "$bgcolor" \
  -draw "circle $cx,$cy $cx,0" \
  "icon_background.png"
