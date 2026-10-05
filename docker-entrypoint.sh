#!/bin/sh
set -eu

npx --no-install prisma migrate deploy
npx --no-install prisma db seed
exec node dist/main.js
