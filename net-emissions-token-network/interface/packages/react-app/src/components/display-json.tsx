import { FC } from "react";

type DisplayJSONProps = {
  json: any
}


const DisplayJSON:FC<DisplayJSONProps> = ({json}) => {
  let decoded = undefined

  if(typeof json === 'string') {
    try {
      decoded = JSON.parse(json);
    } catch (err) {
      console.error('Could not parse JSON from ', json);
    }
  } else {
    decoded = json
  }
  if (!decoded) return <></>;

  let keys: string[] = [];
  let values: string[] = [];
  for (const key in decoded) {
    keys.push(key);
    values.push(decoded[key]);
  }

  return <>{keys.filter((k,i)=>k&&values[i]).map((key, i) => <div key={`${key}-${i}`}><b>{key}</b> : {values[i]}</div>
  )}</>
}

export default DisplayJSON

