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

    @Column()
    available!: number;

    @Column()
    retired!: number;

    @Column()
    transferred!: number;
}

