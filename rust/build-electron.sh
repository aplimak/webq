#!/usr/bin/env bash

set -e

cd "$(dirname "$0")"

. common.sh

cargo build --release
npx ubrn generate napi bindings target/release/libwebq_rs.so --library --ts-dir ../src/shell/bridges/electron/main/webq_rs --lib-colocated
cp target/release/libwebq_rs.so ../src/shell/bridges/electron/main/webq_rs
