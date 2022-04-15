import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';

/**
 * primary key: issuee address & token id
 * data: 1) available 2) retired
 */

@Entity()
export class Balance {
    
    @PrimaryColumn()
    issuee!: string;

    @PrimaryColumn()
    tokenId!: number;

    @Column()
    available!: number;

    @Column()
    retired!: number;

    @Column()
    transferred!: number;
}

