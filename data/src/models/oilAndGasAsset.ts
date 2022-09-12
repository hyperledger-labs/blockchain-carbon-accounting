import type { OilAndGasAssetInterface } from '@blockchain-carbon-accounting/oil-and-gas-data-lib/src/oilAndGasAsset';
import {
  Column, Entity,
  PrimaryGeneratedColumn
} from 'typeorm';

@Entity()
export class OilAndGasAsset implements OilAndGasAssetInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @Column()
  type!: string;

  @Column()
  country!: string;

  @Column()
  latitude!: string;

  @Column()
  longitude!: string;

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
  product?: string;

  @Column({nullable:true})
  field?: string;
  
  @Column({nullable:true})
  depth?: string;

  public static toRaw(v: OilAndGasAsset) {
    return { ...v };
  }
  public static toRaws(v: OilAndGasAsset[]) {
    return v.map(v => OilAndGasAsset.toRaw(v));
  }
}