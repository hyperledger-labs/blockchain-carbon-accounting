export SOFTHSM2_CONF=$PWD/softhsm2.conf
# create a softHSM token
softhsm2-util --init-token --slot 0 --label "ForFabric" --pin 98765432 --so-pin 1234
npm run-script build
npm run-script start

