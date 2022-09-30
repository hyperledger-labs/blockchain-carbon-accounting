import type { 
  AssetOwnerInterface 
} from '@blockchain-carbon-accounting/oil-and-gas-data-lib';
import {
  Column, Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  Unique,
  Check
} from 'typeorm';
import { OilAndGasAsset } from './oilAndGasAsset';
import { Operator } from './operator';

@Entity()
@Unique(['asset', 'operator', 'from_date' ])
@Unique(['asset', 'operator', 'thru_date' ])
@Check('"share" >= 0')
@Check('"share" <= 1')
export class AssetOwner implements AssetOwnerInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @ManyToOne(() => OilAndGasAsset, (asset) => asset.owners)
  asset!: OilAndGasAsset

  @ManyToOne(() => Operator, (operator) => operator.assets)
  operator!: Operator

  @Column({nullable:true})
  share!: number;

  @Column({type: 'timestamp', nullable: true})
  from_date!: Date;

  @Column({type: 'timestamp', nullable: true})
  thru_date?: Date;

  public static toRaw(v: AssetOwner) {
    return { ...v };
  }
  public static toRaws(v: AssetOwner[]) {
    return v.map(v => AssetOwner.toRaw(v));
  }
}