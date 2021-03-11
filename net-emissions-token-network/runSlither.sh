#!/bin/bash
pip3 install slither-analyzer
rm -f slitherlog.json
slither . --config-file slither.config.json