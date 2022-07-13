import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';
import bigint_transformer from './bigint_transformer';

@Entity()
export class ProductToken {
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

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    unitAmount!: bigint;

    @Column({nullable:true, select: false})
    hash?: string;

    public static toRaw(v: ProductToken) {
        return { ...v };
    }
    public static toRaws(v: ProductToken[]) {
        return v.map(v => ProductToken.toRaw(v));
    }
}
