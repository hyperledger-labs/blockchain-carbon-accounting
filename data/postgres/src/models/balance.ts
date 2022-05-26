import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Token } from './token';
import { bigint_transformer } from './bigint_transformer'

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

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    available!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    retired!: bigint;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    transferred!: bigint;
}

