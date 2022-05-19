import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';

@Entity()
export class Tracker {
    @PrimaryColumn()
    trackerId!: number;

    @Column()
    trackee!: string;

    @Column()
    auditor!: string;

    @Column({type: 'bigint'})
    totalProductAmounts!: string;

    @Column({type: 'bigint'})
    totalEmissions!: string;

    @Column({type: 'bigint'})
    totalOffsets!: string;

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
}
