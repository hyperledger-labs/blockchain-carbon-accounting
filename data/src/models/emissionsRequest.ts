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
import { bigint_transformer } from './bigint_transformer';

@Entity()
export class EmissionsRequest {

  @PrimaryGeneratedColumn("uuid")
  uuid!: string;

  @Column({nullable: true})
  node_id?: string;

  @Column({nullable: false, select: false})
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

  @Column({type: 'numeric', precision: 78, scale: 0, transformer: bigint_transformer})
  token_total_emissions!: bigint;

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

  public static toRaw(v: EmissionsRequest) {
    return { ...v };
  }
  public static toRaws(v: EmissionsRequest[]) {
    return v.map(v => EmissionsRequest.toRaw(v));
  }
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

  public static toRaw(v: EmissionsRequestSupportingDocument) {
    return { ...v };
  }
  public static toRaws(v: EmissionsRequestSupportingDocument[]) {
    return v.map(v => EmissionsRequestSupportingDocument.toRaw(v));
  }
}



