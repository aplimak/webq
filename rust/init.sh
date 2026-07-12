#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

cargo install uniffi --features cli --root .bin
cargo install cargo-ndk --root .bin
