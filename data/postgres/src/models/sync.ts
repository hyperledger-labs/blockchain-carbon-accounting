import {
    Entity,
    Column,
    PrimaryColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity()
export class Sync {
    @PrimaryColumn()
    id!: number;

    @Column()
    block!: number;
    @Column()
    network!: string;
    @Column()
    contract!: string;

    @UpdateDateColumn()
    updated_at!: Date;
}


