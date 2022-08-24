#!/bin/bash

MAILTO=""
MAIL="/usr/sbin/sendmail"
MAILFROM=""

REPORT_DIR="/home/opentaps/blockchain-carbon-accounting/app/reports"
REPORT_FILE="/tmp/pending_emissions_report.txt"

export PGPASSWORD=""
DB_USERNAME=""

# require parameter
# $1 Email subject
mailmessage() {
  (
    echo "To: $MAILTO"
    echo "From: $MAILFROM"
    echo "Content-Type: text/plain; "
    echo "Subject: $1"
    echo
    cat ${REPORT_FILE}
  ) | ${MAIL} -t
}

# require two parameters
# $1 database name
# $2 Email subject
runreport() {
  pcount=`psql $1 -w -U ${DB_USERNAME} -h 127.0.0.1 -X -q -P format=unaligned -P t -c "select count(*) from emissions_request er where status = 'PENDING'"`
  if [[ "$pcount" -gt 0 ]]; then
    echo "`date`" > ${REPORT_FILE}
    echo "" >> ${REPORT_FILE}
    psql $1 -w -U ${DB_USERNAME} -h 127.0.0.1 < ${REPORT_DIR}/pending_emissions_requests.sql >> ${REPORT_FILE}
    if [ -e ${REPORT_FILE} ] ; then
      mailmessage "$2"
    fi
  fi
}

runreport "blockchain-carbon-accounting" "Pending emissions audit requests on emissions-test instance"

