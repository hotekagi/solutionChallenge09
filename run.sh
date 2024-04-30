#!/bin/bash -ve

pnpm install
livekit-server --dev --bind 0.0.0.0 &
pnpm start &
