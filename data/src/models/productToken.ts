import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import bigint_transformer from './bigint_transformer';
import { 
  Tracker
} from './tracker';

@Entity()
export class ProductToken {
    @PrimaryColumn()
    productId!: number;

    @Column()
    trackerId!: number;

    @ManyToOne(() => Tracker, (tracker: Tracker) => tracker.products)
    @JoinColumn({name: 'trackerId'})
    tracker!: Tracker;

    @Column()
    auditor!: string;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    amount!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    available!: bigint;

    @Column()
    name!: string;

    @Column({nullable: true})
    unit?: string;

    @Column({nullable: true})
    unitAmount?: number;

    @Column({nullable:true})
    hash?: string;

    public static toRaw(v: ProductToken) {
        return { ...v };
    }
    public static toRaws(v: ProductToken[]) {
        return v.map(v => ProductToken.toRaw(v));
    }
}
