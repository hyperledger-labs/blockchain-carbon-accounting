
import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';

@Entity()
export class ActivityEmissionsFactorLookup {

  @PrimaryColumn()
  mode!: string
  @PrimaryColumn()
  type!: string

  @Column({nullable:false})
  scope!: string
  @Column({nullable:false})
  level_1!: string
  @Column({nullable:false})
  level_2!: string
  @Column({nullable:false})
  level_3!: string
  @Column({nullable:false})
  level_4!: string
  @Column({nullable:true})
  text?: string
  @Column({nullable:false})
  activity_uom!: string

  public static toRaw(v: ActivityEmissionsFactorLookup) {
    return { ...v };
  }
  public static toRaws(v: ActivityEmissionsFactorLookup[]) {
    return v.map(v => ActivityEmissionsFactorLookup.toRaw(v));
  }
}

