import type { 
  OperatorInterface 
} from '@blockchain-carbon-accounting/oil-and-gas-data-lib';
import {
  Column, Entity,
  PrimaryGeneratedColumn,
  OneToMany,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { AssetOwner } from './assetOwner';
import { Wallet } from './wallet';
import { Product } from './product';


@Entity()
export class Operator implements OperatorInterface {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column()
  class!: string;

  @OneToMany(() => AssetOwner, (assetOwner: AssetOwner) => assetOwner.operator)
  public assets?: AssetOwner[];

  @OneToMany(() => Product, (product: Product) => product.operator)
  public products?: Product[];

  @ManyToOne(() => Wallet)
  wallet!: Wallet

  @Column({unique: true})
  name!: string;

  @Column({nullable:true})
  status?: string;

  @Column({nullable:true})
  description?: string;

  public static toRaw(v: Operator) {
    return { ...v };
  }
  public static toRaws(v: Operator[]) {
    return v.map(v => Operator.toRaw(v));
  }
}