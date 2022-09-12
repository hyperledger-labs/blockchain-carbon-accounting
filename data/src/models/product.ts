import type { ProductInterface } from '@blockchain-carbon-accounting/oil-and-gas-data-lib/src/product';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column
} from 'typeorm';

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
  year?: string;

  @Column({nullable:true})
  month?: string;

  @Column({nullable:true})
  from_date?: number;

  @Column({nullable:true})
  thru_date?: number;

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