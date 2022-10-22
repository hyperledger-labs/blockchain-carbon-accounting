import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
    ManyToOne,
} from 'typeorm';
import bigint_transformer from './bigint_transformer';
import { ProductToken } from './productToken';
import { Token } from './token';
import { Operator } from './operator';

@Entity()
export class Tracker {
    @PrimaryColumn()
    trackerId!: number;

    @OneToMany(() => ProductToken, (product: ProductToken) => product.tracker)
    products?: ProductToken[];

    @OneToMany(() => Token, (token: Token) => token.tracker)
    tokens?: Token[];

    @ManyToOne(() => Operator, (operator: Operator) => operator.trackers)
    operator?: Operator;

    @Column()
    trackee!: string;

    @Column({nullable: true})
    createdBy!: string;

    @Column()
    auditor!: string;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    totalProductAmounts!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    totalEmissions!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    totalOffsets!: bigint;

    @Column({nullable: true})
    fromDate!: number;

    @Column({nullable: true})
    thruDate!: number;

    @Column({nullable: true})
    dateCreated!: number;

    @Column({nullable: true})
    dateUpdated?: number;

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    // eslint-disable-next-line
    metadata!: Object;

    @Column({nullable: true})
    description!: string;

    public static toRaw(v: Tracker) {
        return { ...v };
    }
    public static toRaws(v: Tracker[]) {
        return v.map(v => Tracker.toRaw(v));
    }
}
