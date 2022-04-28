import { FC } from "react";
import { decodeDate } from "../services/contract-functions";

type DisplayDateProps = {
  date: number|string|Date|undefined
}

/** Returns a proper Date instance from the various formats that could be used as dates. */
export const parseDate = (date: number|string|Date|undefined) => {
  if (date instanceof Date) return date
  if (typeof date === 'string') return new Date(date)
  if (typeof date === 'number') return decodeDate(date)
  return undefined
}

const DisplayDate:FC<DisplayDateProps> = ({date}) => {
  const decoded = parseDate(date)
  if (!decoded) return <span>None</span>
  return <span>{decoded.toLocaleString()}</span>
}

export default DisplayDate

