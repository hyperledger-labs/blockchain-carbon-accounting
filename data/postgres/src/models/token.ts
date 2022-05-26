import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';
import bigint_transformer from './bigint_transformer';

@Entity()
export class Token {
    @PrimaryColumn()
    tokenId!: number;

    @Column()
    tokenTypeId!: number;

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
}
