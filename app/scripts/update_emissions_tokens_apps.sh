#!/bin/bash

# send report email to, provide MAILTO as environment variable
# to enable this, else will just print to the terminal
# MAILTO="email@example.com"

LOGFILE="/tmp/update_emissions_tokens_apps.log"
LOGFILEBUILD="/tmp/update_emissions_tokens_apps_build.log"

SOURCE_DIR="/home/opentaps/blockchain-carbon-accounting"

APP_DIR="/var/www/html/emissions-test.opentaps.org"

FORCE_UPDATE=${1}

mailerror() {
  # if MAILTO is set
  if [ -n "$MAILTO" ]; then
    echo "Sending error email to $MAILTO"
    (
    echo "To: ${MAILTO}"
    echo "From: admin@opentaps.com"
    echo "Subject: ALERT Update emissions tokens apps `date`"
    echo "MIME-Version: 1.0"
    echo "Content-Type: text/html"
    echo
    echo "Please check emissions tokens apps update. See ${LOGFILE}"
    echo
    tail -n 80 ${LOGFILEBUILD}
    ) | /usr/sbin/sendmail -t
  else
    echo "See ${LOGFILEBUILD} for error details"
    echo "-------------------------------------"
    echo ""
    tail -n 80 ${LOGFILEBUILD}
  fi
}

die() {
    echo "ERROR: $*"
    echo "ERROR: $*" >> ${LOGFILEBUILD}
    echo "ERROR: $*" >> ${LOGFILE}
    mailerror
    exit 1
}

echo "" >> ${LOGFILE}
date +%Y-%m-%dT%H:%M:%S >> ${LOGFILE}

cd ${SOURCE_DIR} || die "Can't cd to ${SOURCE_DIR}"
source /home/opentaps/.bashrc

git checkout -- app/frontend/contracts/src/addresses.ts
git checkout -- open-offsets-directory/react/package-lock.json
git checkout -- open-offsets-directory/node-server/package-lock.json

echo "Pulling Git changes ..."
git pull > ${LOGFILEBUILD}  2>&1
echo "Done"
cat ${LOGFILEBUILD} >> ${LOGFILE}

RES=`cat ${LOGFILEBUILD} | grep "Aborting"`
if [ -z "$RES" ]
then
    RES1=`cat ${LOGFILEBUILD} | grep "Already up to date"`
    if [ -z "$RES1" ] || [ "$FORCE_UPDATE" == "force_update" ]
    then
        echo " - restoring avalanchetestnet settings"
        # avalanchetestnet setup for the frontend connection
        sed -i -e 's!const addresses =.*!const addresses = networksAndAddresses.avalanchetestnet;!g' app/frontend/contracts/src/addresses.ts

        echo " - installing all dependencies"
        npm install >> ${LOGFILEBUILD}  2>&1
        echo " - dependencies install done"

        cd app/frontend/react-app || die "Can't cd to frontend react-app"
        # build the frontend
        echo " - building react-app"
        npm run build >> ${LOGFILEBUILD}  2>&1
        echo " - build done"

        cat ${LOGFILEBUILD} >> ${LOGFILE}

        RES2=`cat ${LOGFILEBUILD} | grep "The build folder is ready to be deployed"`

        if [ -z "$RES2" ]
        then
            die "!!! ERROR during build."
        else
            # copy app to destination
            echo " - deploying build to ${APP_DIR}"
            rm -Rf ${APP_DIR:?}/*
            cd ${APP_DIR} || die "Can't cd to ${APP_DIR}"
            cp -r ${SOURCE_DIR}/app/frontend/react-app/build/* .

            # restart the backend
            echo " - restarting api-server process"
            pm2 restart bca-api-server --update-env

            echo "App deployed to ${APP_DIR}" | tee --append ${LOGFILE} ${LOGFILEBUILD}
        fi
    else
        echo "Code was already up-to-date, to force a rebuild add the argument \"force_update\""
    fi
else
    die "!!! ERROR during git pull."
fi
