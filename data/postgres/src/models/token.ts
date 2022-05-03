import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';

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
    // eslint-disable-next-line
    metadata!: Object;

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    // eslint-disable-next-line
    manifest!: Object;

    @Column({nullable: true})
    description!: string;

    @Column({type: 'bigint'})
    totalIssued!: string;

    @Column({type: 'bigint'})
    totalRetired!: string;

    @Column({nullable: true})
    scope!: number;

    @Column({nullable: true})
    type!: string;
}
