#!/bin/sh
set -e

# 호스팅이 붙여 주는 볼륨은 root 소유인 경우가 많아, root로 시작했다면 권한만 넘기고 node 사용자로 내려가서 실행한다
if [ "$(id -u)" = "0" ]; then
  mkdir -p "$DATA_DIR"
  chown -R node:node "$DATA_DIR"
  exec su-exec node "$@"
fi

exec "$@"
