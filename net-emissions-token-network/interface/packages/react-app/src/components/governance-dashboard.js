import React, { useState, useEffect } from "react";

import { daoTokenBalanceOf } from "../services/contract-functions";

function addCommas(str){
  str += '';
  var x = str.split('.');
  var x1 = x[0];
  var x2 = x.length > 1 ? '.' + x[1] : '';
  var rgx = /(\d+)(\d{3})/;
  while (rgx.test(x1)) {
    x1 = x1.replace(rgx, '$1' + ',' + '$2');
  }
  return x1 + x2;
}

export default function GovernanceDashboard({ provider, roles, signedInAddress }) {

  const supply = 10000000; // 10 million total DAO tokens

  const [daoTokenBalance, setDaoTokenBalance] = useState(-1);
  const [fetchingDaoTokenBalance, setFetchingDaoTokenBalance] = useState();
  const percentOfSupply = ((supply / daoTokenBalance) * 100).toFixed(2);

  async function fetchDaoTokenBalance() {
    let balance = await daoTokenBalanceOf(provider, signedInAddress);
    setDaoTokenBalance(balance);
    setFetchingDaoTokenBalance(false);
  }

  // If address and provider detected then fetch balances
  useEffect(() => {
    if (provider && signedInAddress) {
      if (!fetchingDaoTokenBalance) {
        setFetchingDaoTokenBalance(true);
        fetchDaoTokenBalance();
      }
    }
  }, [signedInAddress, provider, fetchingDaoTokenBalance]);

  return (
    <>

      <h2>Governance Dashboard</h2>
      <p>Vote on or create proposals.</p>
      <hr/>
      <p>{(daoTokenBalance !== -1) && <>Your DAO tokens: {addCommas(daoTokenBalance)} ({percentOfSupply}% of entire supply)</>}</p>

    </>
  );
}
