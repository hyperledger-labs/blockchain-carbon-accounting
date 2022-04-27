import { FC } from "react";
import { decodeDate } from "../services/contract-functions";

type DisplayDateProps = {
  date: number|undefined
}
const DisplayDate:FC<DisplayDateProps> = ({date}) => {
  const decoded = decodeDate(date)
  if (!decoded) return <span>None</span>
  return <span>{decoded.toLocaleString()}</span>
}

export default DisplayDate

