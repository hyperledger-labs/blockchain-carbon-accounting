import type { 
  ProductInterface 
} from '@blockchain-carbon-accounting/oil-and-gas-data-lib';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  ManyToMany,
  JoinTable,
} from 'typeorm';
//import { Geometry } from 'geojson';

import{ OilAndGasAsset } from './oilAndGasAsset'
import{ Operator} from './operator'
@Entity()
export class Product implements ProductInterface{
    
  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @ManyToMany(() => OilAndGasAsset)
  @JoinTable()
  assets?: OilAndGasAsset[];

  @ManyToOne(() => Operator, (operator) => operator.products)
  operator?: Operator;

  @Column()
  type!: string;

  @Column()
  name!: string;

  @Column({ type: 'double precision'})
  amount!: number;

  @Column()
  unit!: string;

  @Column({nullable:true})
  country?: string;
  
  @Column({nullable:true})  
  division_type?: string;

  @Column({nullable:true})
  division_name?: string;

  @Column({nullable:true})
  sub_division_type?: string;

  @Column({nullable:true})
  sub_division_name?: string;

  @Column({ type: 'double precision', nullable:true})
  latitude?: number;

  @Column({ type: 'double precision', nullable:true})
  longitude?: number;

  //@Column({type: 'geometry', nullable:true})
  //location?: Geometry;

  @Column({nullable:true})
  year?: string;

  @Column({nullable:true})
  month?: string;

  @Column({type: 'timestamp', nullable: true})
  from_date?: Date;

  @Column({type: 'timestamp', nullable: true})
  thru_date?: Date;

  @Column({nullable:true})
  metadata?: string;

  @Column({nullable:true})
  description?: string;

  @Column({nullable:true})
  source?: string;

  @Column({nullable:true})
  source_date?: string;
    
  @Column({nullable:true})
  validation_method?: string;

  @Column({nullable:true})
  validation_date?: string;

  public static toRaw(v: Product) {
    return { ...v };
  }
  public static toRaws(v: Product[]) {
    return v.map(v => Product.toRaw(v));
  }

}