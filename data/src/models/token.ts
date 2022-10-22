import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import bigint_transformer from './bigint_transformer';
import { Tracker } from './tracker'

@Entity()
export class Token {
    @PrimaryColumn()
    tokenId!: number;

    @Column()
    tokenTypeId!: number;

    @Column({nullable: true})
    trackerId?: number;

    @ManyToOne(() => Tracker, (tracker: Tracker) => tracker.tokens)
    @JoinColumn({name: 'trackerId'})
    tracker?: Tracker;

    @Column()
    issuedBy!: string;

    @Column()
    issuedFrom!: string;

    @Column()
    issuedTo!: string;

    @Column({nullable: true})
    fromDate!: number;

    @Column({nullable: true})
    thruDate!: number;

    @Column({nullable: true})
    dateCreated!: number;

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    metadata!: Object; // eslint-disable-line

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    manifest!: Object; // eslint-disable-line

    @Column({nullable: true})
    description!: string;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    totalIssued!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    totalRetired!: bigint;

    @Column({nullable: true})
    scope!: number;

    @Column({nullable: true})
    type!: string;

    public static toRaw(v: Token) {
        return { ...v };
    }
    public static toRaws(v: Token[]) {
        return v.map(v => Token.toRaw(v));
    }
}
