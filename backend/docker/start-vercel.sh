#!/bin/sh
set -eu

PORT="${PORT:-80}"

case "$PORT" in
    ''|*[!0-9]*)
        echo "PORT must be a number between 1 and 65535." >&2
        exit 1
        ;;
esac

if [ "$PORT" -lt 1 ] || [ "$PORT" -gt 65535 ]; then
    echo "PORT must be a number between 1 and 65535." >&2
    exit 1
fi

export SERVER_NAME=":$PORT"
exec frankenphp php-server -r public/
