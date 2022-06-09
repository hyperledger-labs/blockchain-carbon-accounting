#!/bin/bash

# Dependancies
# python 3.6+
# pip3
# pip3 install slither-analyzer or https://github.com/crytic/slither
npm install
pip3 install slither-analyzer
rm -f slitherlog.json
python3 runSlither.py
