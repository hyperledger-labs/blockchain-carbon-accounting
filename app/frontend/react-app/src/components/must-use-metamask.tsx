// SPDX-License-Identifier: Apache-2.0

import { FC } from "react";
import { Link } from "wouter";


type MustUseMetamaskProps = {
  actionName: string
}

const MustUseMetamask: FC<MustUseMetamaskProps> = ({ actionName } ) => {
  return <div>You must use Metamask in order to {actionName}, please go <Link href="/access-control">there</Link> to get your private key.</div>
}

export default MustUseMetamask;

