import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Token } from './token';

/**
 * primary key: issuee address & token id
 * data: 1) available 2) retired
 */

@Entity()
export class Balance {

    @PrimaryColumn()
    issuedTo!: string;

    @PrimaryColumn()
    tokenId!: number;

    @ManyToOne(() => Token)
    @JoinColumn({name: 'tokenId'})
    token!: Token;

    @Column({type: 'bigint'})
    available!: string;

    @Column({type: 'bigint'})
    retired!: string;

    @Column({type: 'bigint'})
    transferred!: string;
}

