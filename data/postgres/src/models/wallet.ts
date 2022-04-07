
import {
    Entity,
    PrimaryColumn,
    Column
} from 'typeorm';

@Entity()
export class Wallet {

  @PrimaryColumn("uuid")
  address: string

  @Column()
  name?: string
  @Column()
  organization?: string
  @Column()
  public_key?: string
  @Column()
  public_key_name?: string
  @Column()
  roles?: string
}

