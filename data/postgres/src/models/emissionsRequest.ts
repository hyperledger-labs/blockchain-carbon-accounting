import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity()
export class EmissionsRequest {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column({nullable: false})
  input_data!: string;

  @Column({nullable: false})
  public_key!: string;

  @Column({nullable: false})
  public_key_name!: string;

  @Column({nullable: false})
  issuedFrom!: string;

  @Column({nullable: false})
  issuedTo!: string;

  @Column({nullable: false})
  status!: string;

  @Column({type: 'timestamp', nullable: true})
  token_from_date?: Date;

  @Column({type: 'timestamp', nullable: true})
  token_thru_date?: Date;

  @Column()
  token_total_emissions!: number;

  @Column({nullable: true})
  token_metadata?: string;

  @Column({nullable: true})
  token_manifest?: string;

  @Column({nullable: true})
  token_description?: string;

  @Column({nullable: true})
  emission_auditor?: string;

  @Column({nullable: true})
  input_data_ipfs_hash?: string;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}
