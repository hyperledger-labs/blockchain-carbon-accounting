import { FC } from "react";

type TokenAmountProps = {
  amount: number|undefined
}
const DisplayTokenAmount:FC<TokenAmountProps> = ({amount}) => {
  if (amount === undefined) return <span></span>
  if (!amount) return <span>{amount}</span>

  const display = (amount / 1000).toFixed(3)
  return <span>{display}</span>
}

export default DisplayTokenAmount
