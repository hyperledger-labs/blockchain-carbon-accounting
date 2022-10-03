import type { 
  AssetOperatorInterface 
} from '@blockchain-carbon-accounting/oil-and-gas-data-lib';
import {
  Column, Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinTable,
  Unique,
  Check
} from 'typeorm';
import { OilAndGasAsset } from './oilAndGasAsset';
import { Operator } from './operator';

@Entity({name: 'asset_operator'})
@Unique(['asset', 'operator', 'from_date' ])
@Unique(['asset', 'operator', 'thru_date' ])
@Check('"share" >= 0')
@Check('"share" <= 1')
export class AssetOperator implements AssetOperatorInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @ManyToOne(() => OilAndGasAsset, (asset) => asset.asset_operators)
  @JoinTable()
  asset!: OilAndGasAsset;

  @ManyToOne(() => Operator, (operator) => operator.asset_operators)
  @JoinTable()
  operator!: Operator;

  @Column({nullable:true})
  share!: number;

  @Column({type: 'timestamp', nullable: true})
  from_date!: Date;

  @Column({type: 'timestamp', nullable: true})
  thru_date?: Date;

  public static toRaw(v: AssetOperator) {
    return { ...v };
  }
  public static toRaws(v: AssetOperator[]) {
    return v.map(v => AssetOperator.toRaw(v));
  }
}