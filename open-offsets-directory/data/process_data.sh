#!/bin/bash
# Dealing with CSV can be tediduous, here we use XSV (https://github.com/BurntSushi/xsv) for basic manipulations

D="./projects-v3"

# common number fixing commands
FN1='s/"[[:space:]]*\*(-?[0-9,]+)\*[[:space:]]*"/"\1"/g'
FN2='s/"[[:space:]]*(-?[0-9]+),([0-9,]+)[[:space:]]*"/"\1\2"/g'
FN3='s/"(-?[0-9]+)"/\1/g'

# projects: Process the projects CSV
#  - FIRST: make sure you drop columns in an excel like editor first: 
#    * the ones between date added to database and first issuance yr
#    * the trailing empty columns after that
#  - remove the first 3 lines
#  - merge the first lines that are part of the CSV header, here we merge until the line containing 'first issuance yr'
#  - rename year fields, here note that 1996 is the start year, the first group is for
#    "Credits issued by vintage year (when reduction/removals occurred)", -> Issued by Reporting
#    then Retired,
#    then Remaining,
#    then "Credits issued by issuance year (when the registry issued the credits)" -> Issued
#  - converts numeric columns (note the number can be negative, we repeat the substitution to handle big numbers with multiple separators)
#  - converts Date added tp database from "v1 4-2021" as month-year to a standard YYYYMM eg: 202104
#  - delete the broken last line due the awk scripts
cat "$D/PROJECTS-Table 1.csv" | sed '1,3d' | awk 'e{print $0} /first issuance yr/ && p{print p $0;e=1} !e{p=p $0}' | awk 'BEGIN{ORS=",";RS=","; s=0;e=0} /first issuance yr/ {e=1} !e{ if ($0 == "1996") {s=s+1} if ($0 ~ /^[0-9]+$/ && s==1) {print "Issued by Reporting",$0} else if ($0 ~ /^[0-9]+$/ && s==2) {print "Retired",$0} else if ($0 ~ /^[0-9]+$/ && s==3) {print "Remaining",$0} else if ($0 ~ /^[0-9]+$/ && s==4) {print "Issued",$0} else {print $0}} e{print $0}' | sed -r 's/"(-?[0-9]+),([0-9,]+)"/"\1\2"/g' | sed -r 's/"(-?[0-9]+),([0-9,]+)"/"\1\2"/g' | sed -r 's/"(-?[0-9]+),([0-9,]+)"/"\1\2"/g' | sed -r 's/"(-?[0-9]+),([0-9,]+)"/"\1\2"/g' | sed -r 's/"(-?[0-9]+)"/\1/g' | sed -r 's/,v[0-9] ([0-9])-([0-9]{4}),/,\20\1,/g' | sed -r 's/,v[0-9] ([0-9]{2})-([0-9]{4}),/,\2\1,/g' | sed '$d' | sed '$s/$/\r\n/' | sed '$d' > projects.csv

# then note that column order changed a bit, also have new columns for Remaining (year)
# - Registry and ARB no longer exists
# - added Voluntary Status

# ACR_issuances: just delete the unused columns after Project Website
xsv select '1-19' data/projects-v3/ACR\ Issuances-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/ACR_issuances.csv

# CAR_issuances: just delete the unused columns after Project Website
xsv select '1-24' data/projects-v3/CAR\ Issuances-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/CAR_issuances.csv

# GOLD_issuances: just delete the unused columns after Eligible for CORSIA?
#  - this has new columns after Product Type: Country	Methodology	Programme of Activities	POA GSID
#  - this has a new colum after Serial Number: Eligible for CORSIA?
#  - then to format the credits numbers (note this has one broken row where the number is *500*):
xsv select '1-19' data/projects-v3/Gold\ Issuances-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/GOLD_issuances.csv

# VCS_issuances: from VCS Vintage Issuances, remove the unused columns after Credits Issued
#  - then to format the credits issued:
xsv select '1-8' data/projects-v3/VCS\ Vintage\ Issuances-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/VCS_issuances.csv

# GOLD_retriements: 
#  - Notes and Retirement Year columns got swapped
#  - remove unused columns after Retirement Year
#  - added two columns at the end: one seem like issuance serial number base so naming it Issuance, the other is Issuance Serial Number
xsv select '!20-28,31,32' data/projects-v3/Gold\ Retirements-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/GOLD_retirements.csv

# VCS_retirements: use VCS Issuances and Retirements, remove all columns after Date Format
#  - note that columns order changed at the end after Retirement Details: from Retirement Year	Credits Retired	Date Format	Vintage Year -> Vintage Year 	Credits Issued	Retirement Year	Credits Retired	Date Format
xsv select '1-21' data/projects-v3/VCS\ Issuances\ \&\ Retirements-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/VCS_retirements.csv


# ACR_CAR_retirements: 
#  - this is now split into ACR_retirements and CAR_retirements, remove unused columns after Retirement Year
xsv select '1-18' data/projects-v3/ACR\ Retirements-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/ACR_retirements.csv
#  - CAR retirements has an additional column CAR Retirement Data at the end but does not have Date Issued before Retirement Date
xsv select '1-18' data/projects-v3/CAR\ Retirements-Table\ 1.csv | xsv fmt --quote-always | sed -r $FN1  | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN2 | sed -r $FN3 | xsv fmt > data/CAR_retirements.csv

