import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import bigint_transformer from './bigint_transformer';
import { 
  Tracker
} from './tracker';

@Entity()
export class ProductToken {
    @PrimaryColumn()
    productId!: number;

    @Column({unique: true})
    tokenId!: number;

    @Column({nullable: true})
    trackerId!: number;

    @ManyToOne(() => Tracker, (tracker: Tracker) => tracker.products)
    @JoinColumn({name: 'trackerId'})
    tracker!: Tracker;

    @Column()
    issuedBy!: string;

    @Column()
    issuedFrom!: string;

    //@Column()
    //issuedTo!: string; // Products are issued to CarbonTracker contract 

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    issued!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    available!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer, nullable: true})
    retired!: bigint;

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    metadata!: Object; // eslint-disable-line

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    manifest!: Object; // eslint-disable-line

    @Column({nullable: true})
    dateCreated!: number;

    @Column({nullable: true})
    dateUpdated!: number;

    @Column({nullable: true})
    dateIssued!: number;

    //@Column({nullable: true, type: 'double precision'})
    //emissionsFactor!: number;

    @Column({nullable: true})
    unit?: string;

    @Column({nullable: true, type: 'double precision'})
    unitAmount?: number;

    @Column({nullable:true})
    hash?: string;

    public static toRaw(v: ProductToken) {
        return { ...v };
    }
    public static toRaws(v: ProductToken[]) {
        return v.map(v => ProductToken.toRaw(v));
    }
}
