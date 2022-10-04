import type { 
  OilAndGasAssetInterface 
} from '@blockchain-carbon-accounting/oil-and-gas-data-lib';
import {
  //Index,
  Column, Entity,
  OneToMany,
  ManyToMany,
  PrimaryGeneratedColumn,
  //Unique
} from 'typeorm';
import { AssetOperator } from './assetOperator';
//import { Operator } from './operator';
import { Product } from './product';

//import { Point } from 'geojson';

export type OilAndGasAssetOperator = {
    oil_and_gas_asset_operator:string
};

@Entity()
//@Unique(['name','operator','latitude', 'longitude' ])
export class OilAndGasAsset implements OilAndGasAssetInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @OneToMany(() => AssetOperator, (assetOperator: AssetOperator) => assetOperator.asset)
  asset_operators?: AssetOperator[];

  @ManyToMany(() => Product)
  products?: Product[];

  @Column()
  type!: string;

  /*Index({ spatial: true })
  @Column({
    type: 'geography',
    spatialFeatureType: 'Point', 
    srid: 4326,
    nullable: true,
  })
  location:Point*/

  @Column({ type: 'double precision'})
  latitude!: number;

  @Column({ type: 'double precision'})
  longitude!: number;

  @Column()
  country?: string;

  @Column({nullable:true})
  name?: string;

  @Column({nullable:true})
  operator?: string;

  @Column({nullable:true})
  division_type?: string;

  @Column({nullable:true})
  division_name?: string;

  @Column({nullable:true})
  sub_division_type?: string;

  @Column({nullable:true})
  sub_division_name?: string;

  @Column({nullable:true})
  status?: string;

  @Column({nullable:true})
  api?: string;

  @Column({nullable:true})
  description?: string;

  @Column({nullable:true})
  source?: string;

  @Column({type: 'timestamp', nullable: true})
  source_date?: Date;

  @Column({nullable:true})
  validation_method?: string;

  @Column({type: 'timestamp', nullable: true})
  validation_date?: Date;

  @Column({nullable:true})
  metadata?: string;

  public static toRaw(v: OilAndGasAsset) {
    return { ...v };
  }
  public static toRaws(v: OilAndGasAsset[]) {
    return v.map(v => OilAndGasAsset.toRaw(v));
  }
}