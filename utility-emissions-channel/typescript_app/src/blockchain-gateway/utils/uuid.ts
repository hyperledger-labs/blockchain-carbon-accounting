import { v4 as uuidv4 } from "uuid";

export function getNewUuid() {
  let uuid = uuidv4();
  return uuid;
}
