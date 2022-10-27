//weight units and conversion
const kg = ['kg', 'kilograms', 'kilogram'] as const;
type KG = typeof kg[number];

const grams = ['g','grams','gram'] as const;
type Gram = typeof grams[number];

const ton = ['metric tons','metric ton','t','ton','tons','tonne','tonnes','mt'] as const;
type Ton = typeof ton[number];

const tonMillion = ['million tons','million tonnes'] as const;
type TonMillion = typeof tonMillion[number];

const tonShort = ['short ton'] as const;
type TonShort = typeof tonShort[number];

const tonLong = ['long ton'] as const;
type TonLong  = typeof tonLong[number];

const pound = ['lb','lbs','pound','pounds'] as const;
type Pound = typeof pound[number];



export type WeightUnit = {
    grams: Gram[],
    kg: KG[],
    ton: Ton[],
    tonMillion: TonMillion[],
    pound: Pound[],
    tonShort: TonShort[],
    tonLong: TonLong[],
}

export const weightUnits: WeightUnit = {
    grams: grams.map(String) as Gram[], 
    kg: kg.map(String) as KG[], 
    ton: ton.map(String) as Ton[], 
    tonMillion: tonMillion.map(String) as TonMillion[],
    pound: pound.map(String) as Pound[], 
    tonShort: tonShort.map(String) as TonShort[], 
    tonLong: tonLong.map(String) as TonLong[] 
}

export function weight_in_kg(weight?: number, uom?: string) {
  if (!weight) throw new Error(`Invalid weight ${weight}`);
  if (!uom) return weight;
  // check supported UOMs
  const u = uom.toLowerCase();
  if (weightUnits.kg.includes(u as KG)) return weight;
  if (weightUnits.ton.includes(u as Ton)) return weight * 1000.0;
  if (weightUnits.tonMillion.includes(u as TonMillion)) return weight * 10.0**6;
  if (weightUnits.grams.includes(u as Gram)) return weight / 1000.0;
  if (weightUnits.pound.includes(u as Pound)) return weight * 0.453592;
  // not recognized
  throw new Error(`Weight UOM ${uom} not supported. Supported units are ${JSON.stringify(weightUnits)}`);
}

// use this to convert kg into the emission factor uom, most should be 'tonne.kg'
// but also support different weight uoms
export function get_convert_kg_for_uom(uom: string): number {
  if (uom.includes('.')) {
    return get_convert_kg_for_uom(uom.split('.')[0]);
  }

  const u = uom.toLowerCase();
  if (weightUnits.kg.includes(u as KG)) return 1;
  if (weightUnits.pound.includes(u as Pound)) return 2.20462;
  if (weightUnits.ton.includes(u as Ton)) return 0.001;
  if (weightUnits.grams.includes(u as Gram)) return 1000.0;
  // not recognized
  throw new Error(`Weight UOM ${uom} not supported. Support units are ${JSON.stringify(weightUnits)}`);
}

// volume units and conversion
const cubicMeters = ['cubic meter', 'm3', 'cubic meters','cm'] as const;
type CubicMeter = typeof cubicMeters[number];

const millionCubicMeters = ['million cubic meters','million m3','mcm'] as const;
type MillionCubicMeter = typeof millionCubicMeters[number];

const billionCubicMeters = ['billion cubic meters','billion m3','bcm'] as const;
type BillionCubicMeter = typeof billionCubicMeters[number];

const thousandCubicMeters = ['thousand cubic meters','thousand m3','kcm',] as const;
type ThousandCubicMeter = typeof thousandCubicMeters[number];

const cubicFeet = ['cubic feet', 'cf'] as const;
type CubicFeet = typeof cubicFeet[number];

const billionCubicFeet = ['billion cubic feet','bcf'] as const;
type BillionCubicFeet = typeof billionCubicFeet[number];

const millionCubicFeet = ['million cubic feet','mmcf'] as const;
type MillionCubicFeet = typeof millionCubicFeet[number];

const thousandCubicFeet = ['thousand cubic feet','mcf','mcm'] as const;
type ThousandCubicFeet = typeof thousandCubicFeet[number];


export type VolumeUnit = {
    billionCubicMeters: BillionCubicMeter[],
    millionCubicMeters: MillionCubicMeter[],
    thousandCubicMeters: ThousandCubicMeter[],
    cubicMeters: CubicMeter[],
    billionCubicFeet: BillionCubicFeet[],
    millionCubicFeet: MillionCubicFeet[],
    thousandCubicFeet: ThousandCubicFeet[],
    cubicFeet: CubicFeet[],
}

export const volumeUnits: VolumeUnit = {
    cubicMeters: cubicMeters.map(String) as CubicMeter[],
    thousandCubicMeters: thousandCubicMeters.map(String) as ThousandCubicMeter[],
    millionCubicMeters: millionCubicMeters.map(String) as MillionCubicMeter[],
    billionCubicMeters: billionCubicMeters.map(String) as BillionCubicMeter[],
    cubicFeet: cubicFeet.map(String) as CubicFeet[], 
    thousandCubicFeet: thousandCubicFeet.map(String) as ThousandCubicFeet[], 
    millionCubicFeet: millionCubicFeet.map(String) as MillionCubicFeet[], 
    billionCubicFeet: billionCubicFeet.map(String) as BillionCubicFeet[], 
}

export const volume_to_cubic_meters = (volume?:number,u?:string) => { 
    if (!volume) throw new Error(`Invalid weight ${volume}`);
    if (!u) throw new Error(`Mus specify a`);
    if (volumeUnits.cubicFeet.includes(u as CubicFeet)){return volume*0.0283168}
    if (volumeUnits.billionCubicFeet.includes(u as BillionCubicFeet)){return volume*0.0283168*10.0**9}
    if (volumeUnits.millionCubicFeet.includes(u as MillionCubicFeet)){return volume*0.0283168*10.0**6}
    if (volumeUnits.thousandCubicFeet.includes(u as ThousandCubicFeet)){return volume*0.0283168*10.0**3} 
    if (volumeUnits.billionCubicMeters.includes(u as BillionCubicMeter)){return volume*10.0**9}
    if (volumeUnits.millionCubicMeters.includes(u as MillionCubicMeter)){return volume*10.0**6}
    if (volumeUnits.thousandCubicMeters.includes(u as ThousandCubicMeter)){return volume*10.0**3}
    if (volumeUnits.cubicMeters.includes(u as CubicMeter)){return volume}
    throw new Error(`Volume unit ${u} not supported. Supported units are ${JSON.stringify(volumeUnits)}`);
}