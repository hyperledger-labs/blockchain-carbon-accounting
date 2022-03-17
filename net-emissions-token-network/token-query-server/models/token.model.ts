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
    issuee!: string;

    @Column()
    issuer!: string;

    @Column({nullable: true})
    fromDate!: number;

    @Column({nullable: true})
    thruDate!: number;

    @Column({nullable: true})
    dateCreated!: number;

    @Column({nullable: true})
    automaticRetiredDate!: number;

    @Column({type: "hstore", hstoreType:"object", nullable: true})
    metaMap!: Map<string, string>;

    @Column()
    manifest!: string;

    @Column({nullable: true})
    description!: string;

    @Column()
    totalIssued!: number;

    @Column()
    totalRetired!: number;

    @Column({nullable: true})
    scope!: string;

    @Column({nullable: true})
    type!: string;
}