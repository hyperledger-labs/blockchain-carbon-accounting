import type { 
  OperatorInterface 
} from '@blockchain-carbon-accounting/oil-and-gas-data-lib';
import {
  Column, Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  Unique
} from 'typeorm';
import { AssetOperator } from './assetOperator';
import { Product } from './product';
import { Tracker } from './tracker';


@Entity()
@Unique(['name'])
export class Operator implements OperatorInterface {
  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @OneToMany(() => AssetOperator, (assetOperator: AssetOperator) => assetOperator.operator)
  asset_operators?: AssetOperator[];

  @OneToMany(() => Product, (product: Product) => product.operator)
  products?: Product[];

  @Column()
  wallet_address!: string;

  @OneToMany(() => Tracker, (tracker: Tracker) => tracker.operator)
  trackers?: Tracker[];

  @Column({unique: true})
  name!: string;

  @Column({nullable:true})
  status?: string;

  @Column({default:0, type: 'integer'})
  asset_count?: number;

  @Column({nullable:true})
  description?: string;

  public static toRaw(v: Operator) {
    return { ...v };
  }
  public static toRaws(v: Operator[]) {
    return v.map(v => Operator.toRaw(v));
  }
}