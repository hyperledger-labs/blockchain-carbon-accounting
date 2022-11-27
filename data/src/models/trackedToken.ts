import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import bigint_transformer from './bigint_transformer';
import { Tracker } from './tracker';
import { Token } from './token'
@Entity()
export class TrackedToken {
    @PrimaryColumn()
    tokenId!: number;

    @ManyToOne(() => Token, (token) => token.trackers)
    @JoinColumn({name: 'tokenId'})
    token!: Token;

    @PrimaryColumn()
    trackerId!: number;

    @ManyToOne(() => Tracker, (tracker) => tracker.tokens)
    @JoinColumn({name: 'trackerId'})
    tracker!: Tracker;

    @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
    amount!: bigint;

    public static toRaw(v: TrackedToken) {
        return { ...v };
    }
    public static toRaws(v: TrackedToken[]) {
        return v.map(v => TrackedToken.toRaw(v));
    }
}
