import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { IToken, Token } from './token';
import { bigint_transformer } from './bigint_transformer'


export type IBalance = {
  issuedTo: string;
  tokenId: number;
  token: IToken;
  available: bigint;
  retired: bigint;
  transferred: bigint;
}

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

    public static toRaw(v: Balance) {
        return { ...v, token: Token.toRaw(v.token) };
    }
    public static toRaws(v: Balance[]) {
        return v.map(v => Balance.toRaw(v));
    }
}

