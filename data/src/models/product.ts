import type { ProductInterface } from '@blockchain-carbon-accounting/oil-and-gas-data-lib/src/product';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';
import bigint_transformer from './bigint_transformer';

@Entity()
export class Product implements ProductInterface{
    
  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @Column()
  type!: string;

  @Column()
  name!: string;

  @Column()
  amount!: string;

  @Column()
  unit!: string;

  @Column({nullable:true})
  asset_uuid?: string;

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

  @Column({nullable:true})
  latitude?: string;

  @Column({nullable:true})
  longitude?: string;

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