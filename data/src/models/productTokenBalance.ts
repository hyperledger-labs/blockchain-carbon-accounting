import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { ProductToken } from './productToken';
import { bigint_transformer } from './bigint_transformer'


@Entity()
export class ProductTokenBalance {

    @PrimaryColumn()
    issuedTo!: string;

    @PrimaryColumn()
    productId!: number;

    @ManyToOne(() => ProductToken)
    @JoinColumn({name: 'productId'})
    product!: ProductToken;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    available!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    retired!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    transferred!: bigint;


    public static toRaw(v: ProductTokenBalance) {
        return { ...v, product: ProductToken.toRaw(v?.product)};
    }
    public static toRaws(v: ProductTokenBalance[]) {
        return v.map(v => ProductTokenBalance.toRaw(v));
    }
}

