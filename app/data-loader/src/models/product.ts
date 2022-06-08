import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';
import bigint_transformer from './bigint_transformer';

@Entity()
export class Product {
    @PrimaryColumn()
    productId!: number;

    @Column()
    trackerId!: number;

    @Column()
    auditor!: string;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    amount!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    available!: bigint;

    @Column()
    name!: string;

    @Column()
    unit!: string;

    @Column()
    unitAmount!: number;

    @Column()
    hash!: string;

    public static toRaw(v: Product) {
        return { ...v };
    }
    public static toRaws(v: Product[]) {
        return v.map(v => Product.toRaw(v));
    }
}
