#!/bin/bash -ve

tempfile=$(mktemp)
cat ./src/hostname.js > $tempfile
cat ./src/hostname.js.bak > ./src/hostname.js
cat $tempfile > ./src/hostname.js.bak
rm $tempfile

pnpm webpack
