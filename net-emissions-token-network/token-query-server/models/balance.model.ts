import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Token } from './token.model';

/**
 * primary key: issee address & token id
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