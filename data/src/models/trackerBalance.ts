import {
    Entity,
    PrimaryColumn,
    Column,
    ManyToOne,
    JoinColumn
} from 'typeorm';
import { Tracker } from './tracker';
import { trackerStatus, TrackerStatus } from '../repositories/common'
 
@Entity()
export class TrackerBalance {

    @PrimaryColumn()
    issuedTo!: string;

    @PrimaryColumn()
    trackerId!: number;

    @ManyToOne(() => Tracker )
    @JoinColumn({name: 'trackerId'})
    tracker!: Tracker;

    @Column({enum: trackerStatus})
    status!: TrackerStatus;

    public static toRaw(v: TrackerBalance) {
        return { ...v, tracker: Tracker.toRaw(v?.tracker)};
    }
    public static toRaws(v: TrackerBalance[]) {
        return v.map(v => TrackerBalance.toRaw(v));
    }
}

