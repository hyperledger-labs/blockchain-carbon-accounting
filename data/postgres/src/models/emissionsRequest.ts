import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
    ManyToOne,
    OneToOne,
    JoinColumn
} from 'typeorm';
import { UploadedFile } from './uploadedFile';

@Entity()
export class EmissionsRequest {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column({nullable: false})
  input_content!: string;

  @Column({nullable: true})
  public_key?: string;

  @Column({nullable: true})
  public_key_name?: string;

  @Column({nullable: true})
  issued_from?: string;

  @Column({nullable: false})
  issued_to!: string;

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

  @OneToMany(() => EmissionsRequestSupportingDocument, doc => doc.emissions_request)
  supporting_documents?: EmissionsRequestSupportingDocument[];

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}

@Entity()
export class EmissionsRequestSupportingDocument {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @ManyToOne(() => EmissionsRequest)
  emissions_request!: EmissionsRequest;

  @OneToOne(() => UploadedFile)
  @JoinColumn()
  file!: UploadedFile;

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;
}



