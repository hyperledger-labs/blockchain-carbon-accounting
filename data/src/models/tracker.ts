import {
    Entity,
    PrimaryColumn,
    Column,
    OneToMany,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import bigint_transformer from './bigint_transformer';
import { ProductToken } from './productToken';
import { Operator } from './operator';
import { TrackerBalance } from './trackerBalance'
import { TrackedProduct } from './trackedProduct';
import { TrackedToken } from './trackedToken';

@Entity()
export class Tracker {
    @PrimaryColumn()
    trackerId!: number;

    @Column({unique: true})
    tokenId!: number;

    @OneToMany(() => ProductToken, (product: ProductToken) => product.tracker)
    products?: ProductToken[];

    //products used as input to tracker 
    @OneToMany(() => TrackedProduct, (tracked_product: TrackedProduct) => tracked_product.tracker)
    trackedProducts?: TrackedProduct[];

    @OneToMany(() => TrackedToken, (tracked_token: TrackedToken) => tracked_token.token)
    tokens?: TrackedToken[];

    @OneToMany(() => TrackerBalance, (balance: TrackerBalance) => balance.tracker)
    balances?: TrackerBalance[];

    @ManyToOne(() => Operator, (operator: Operator) => operator.trackers)
    @JoinColumn({name: 'operatorUuid'})
    operator!: Operator;

    @Column({nullable: true})
    operatorUuid!: string;

    @Column()
    trackee!: string;

    @Column()
    issuedBy!: string;

    @Column()
    issuedFrom!: string;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    totalProductAmounts!: bigint;

    @Column({ type: 'double precision', nullable: true})
    totalEmissions!: number;

    @Column({ type: 'double precision', nullable: true})
    totalOffsets!: number;

    @Column({ type: 'double precision', nullable: true})
    totalREC!: number;

    @Column({nullable: true})
    retired!: boolean;

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    metadata!: Object; // eslint-disable-line

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    manifest!: Object; // eslint-disable-line

    @Column({nullable: true})
    dateCreated!: number;

    @Column({nullable: true})
    dateIssued!: number;

    @Column({nullable: true})
    dateUpdated!: number;

    public static toRaw(v: Tracker) {
        return { ...v };
    }
    public static toRaws(v: Tracker[]) {
        return v.map(v => Tracker.toRaw(v));
    }
}
