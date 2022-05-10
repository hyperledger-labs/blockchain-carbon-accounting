
import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';

@Entity()
export class Wallet {

  @PrimaryColumn()
  address!: string

  @Column({nullable:true})
  email?:string
  @Column({nullable:true})
  password?: string

  @Column({nullable:true})
  name?: string

  @Column({nullable:true})
  organization?: string

  @Column({nullable:true})
  public_key?: string

  @Column({nullable:true})
  public_key_name?: string

  @Column({nullable:true})
  private_key?: string

  @Column({nullable:true})
  metamask_encrypted_public_key?: string

  @Column({nullable:true})
  roles?: string
}
