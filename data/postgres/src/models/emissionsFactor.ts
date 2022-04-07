import {
    Entity,
    PrimaryGeneratedColumn,
    Column
} from 'typeorm';
import { EmissionsFactorInterface } from 'emissions_data_chaincode/src/lib/emissionsFactor'

@Entity()
export class EmissionsFactor implements EmissionsFactorInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid: string

  @Column()
  class: string
  @Column({nullable:true})
  key?: string
  @Column()
  type: string
  @Column()
  scope: string
  @Column()
  level_1: string
  @Column()
  level_2: string
  @Column()
  level_3: string
  @Column({nullable:true})
  level_4?: string
  @Column({nullable:true})
  text?: string
  @Column({nullable:true})
  year?: string
  @Column({nullable:true})
  country?: string
  @Column({nullable:true})
  division_type?: string
  @Column({nullable:true})
  division_id?: string
  @Column({nullable:true})
  division_name?: string
  @Column({nullable:true})
  activity_uom?: string
  @Column({nullable:true})
  net_generation?: string
  @Column({nullable:true})
  net_generation_uom?: string
  @Column({nullable:true})
  co2_equivalent_emissions?: string
  @Column({nullable:true})
  co2_equivalent_emissions_uom?: string
  @Column({nullable:true})
  source?: string
  @Column({nullable:true})
  non_renewables?: string
  @Column({nullable:true})
  renewables?: string
  @Column({nullable:true})
  percent_of_renewables?: string
}
