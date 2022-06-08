import { FC } from "react";

type TokenAmountProps = {
  amount: bigint|number|undefined
}
const DisplayTokenAmount:FC<TokenAmountProps> = ({amount}) => {
  if (amount === undefined) return <span></span>
  if (!amount) return <span>{'0'}</span>

  // not ideal, but it's a start
  const display = (Number(amount) / 1000).toFixed(3)
  return <span>{display}</span>
}

export default DisplayTokenAmount
