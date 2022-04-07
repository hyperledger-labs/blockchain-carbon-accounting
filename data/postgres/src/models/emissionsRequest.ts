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
  uuid: string;

  @Column({nullable:false})
  input_data?: string;

  @Column({nullable:false})
  public_key?: string;

  @Column({nullable:false})
  public_key_name?: string;

  @Column({nullable:false})
  issuee?: string;

  @Column({nullable:false})
  status?: string;

  @CreateDateColumn()
  createdAt;

  @UpdateDateColumn()
  updatedAt;
}
