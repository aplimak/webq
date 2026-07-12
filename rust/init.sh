#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

. common.sh

if [ -z "$ANDROID_NDK_HOME" ]; then
  echo "ANDROID_NDK_HOME is not set. Please set it to the path of your Android NDK."
  exit 1
fi

rustup target add \
  aarch64-linux-android \
  armv7-linux-androideabi \
  x86_64-linux-android \
  i686-linux-android

cargo install uniffi --version 0.31.0 --features cli --root .bin
cargo install cargo-ndk --root .bin
