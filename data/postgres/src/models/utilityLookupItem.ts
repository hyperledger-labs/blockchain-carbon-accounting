import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from 'typeorm';
import { UtilityLookupItemInterface } from 'emissions_data_chaincode/src/lib/utilityLookupItem'

@Entity()
export class UtilityLookupItem implements UtilityLookupItemInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string

  @Column()
  class!: string
  @Column()
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
  @Column()
  division_type?: string
  @Column()
  division_id?: string
}

