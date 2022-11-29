import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import bigint_transformer from './bigint_transformer';
import { Tracker } from './tracker';
import { ProductToken } from './productToken'
@Entity()
export class TrackedProduct {
    @PrimaryColumn()
    productId!: number;

    @ManyToOne(() => ProductToken, (product_token) => product_token.trackers)
    @JoinColumn({name: 'productId'})
    product!: ProductToken;

    @PrimaryColumn()
    trackerId!: number;

    @ManyToOne(() => Tracker, (tracker) => tracker.trackedProducts)
    @JoinColumn({name: 'trackerId'})
    tracker!: Tracker;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    amount!: bigint;

    public static toRaw(v: TrackedProduct) {
        return { ...v };
    }
    public static toRaws(v: TrackedProduct[]) {
        return v.map(v => TrackedProduct.toRaw(v));
    }
}
