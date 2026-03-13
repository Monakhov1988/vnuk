#!/bin/bash
set -e
npm install --legacy-peer-deps < /dev/null
npm run build
