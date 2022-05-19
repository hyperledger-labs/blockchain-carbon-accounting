import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';

@Entity()
export class Product {
    @PrimaryColumn()
    productId!: number;

    @Column()
    trackerId!: number;

    @Column()
    auditor!: string;

    @Column({type: 'bigint'})
    amount!: string;

    @Column({type: 'bigint'})
    available!: string;

    @Column()
    name!: string;

    @Column()
    unit!: string;

    @Column({type: 'bigint'})
    unitAmount!: string;

    @Column()
    hash!: string;
}
