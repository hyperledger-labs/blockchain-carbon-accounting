#!/bin/bash
pip3 install slither-analyzer
rm -f slitherlog.json
slither . --json slitherlog.json --print human-summary 