#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

. common.sh

cargo install uniffi --version 0.31.0 --features cli --root .bin
cargo install cargo-ndk --root .bin
