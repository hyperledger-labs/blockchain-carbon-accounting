import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';
import bigint_transformer from './bigint_transformer';

@Entity()
export class Tracker {
    @PrimaryColumn()
    trackerId!: number;

    @Column()
    trackee!: string;

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
