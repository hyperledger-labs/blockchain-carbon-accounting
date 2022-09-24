import type { 
  UtilityLookupItemInterface 
} from '@blockchain-carbon-accounting/emissions_data_lib';
import {
    Column, Entity,
    PrimaryGeneratedColumn
} from 'typeorm';

@Entity()
export class UtilityLookupItem implements UtilityLookupItemInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string

  @Column()
  class!: string
  @Column({nullable:true})
  key?: string
  @Column()
  year?: string
  @Column()
  utility_number?: string
  @Column()
  utility_name?: string
  @Column()
  country?: string
  @Column()
  state_province?: string
  @Column({nullable:true})
  division_type?: string
  @Column({nullable:true})
  division_id?: string

  public static toRaw(v: UtilityLookupItem) {
    return { ...v };
  }
  public static toRaws(v: UtilityLookupItem[]) {
    return v.map(v => UtilityLookupItem.toRaw(v));
  }
}

