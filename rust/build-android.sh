#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

. common.sh

cargo ndk \
  -t aarch64-linux-android \
  -t armv7-linux-androideabi \
  -t x86_64-linux-android \
  -t i686-linux-android \
  -o ../android/app/src/main/jniLibs \
  build --release

uniffi-bindgen generate --library target/aarch64-linux-android/release/libwebq_rs.so --language kotlin --out-dir ../android/app/src/main/java
