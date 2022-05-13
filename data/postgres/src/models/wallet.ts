
import { pbkdf2Sync, randomBytes } from 'crypto';
import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn
} from 'typeorm';

@Entity()
export class Wallet {

  @PrimaryColumn()
  address!: string

  @Column({nullable:true, unique: true})
  email?:string
  @Column({nullable:true, select: false})
  email_verified?: boolean
  @Column({nullable:true, select: false})
  verification_token?: string
  verification_token_sent_at?: Date
  @Column({nullable:true, select: false})
  password_hash?: string
  @Column({nullable:true, select: false})
  password_salt?: string

  @Column({nullable:true})
  name?: string

  @Column({nullable:true})
  organization?: string

  @Column({nullable:true})
  public_key?: string

  @Column({nullable:true})
  public_key_name?: string

  @Column({nullable:true, select: false})
  private_key?: string

  @Column({nullable:true})
  metamask_encrypted_public_key?: string

  @Column({nullable:true})
  roles?: string

  @CreateDateColumn()
  created_at!: Date;

  @UpdateDateColumn()
  updated_at!: Date;



  public static generateVerificationToken() {
    return randomBytes(32).toString('hex')
  }
  public static generateHash(password: string) {
    const password_salt = randomBytes(16).toString('hex')
    return { password_salt, password_hash: pbkdf2Sync(password, password_salt, 1000, 64, `sha512`).toString(`hex`) }
  }

  /** Sets both `password_hash` and `password_salt` */
  setPassword(password: string) {
    const { password_salt, password_hash } = Wallet.generateHash(password)
    this.password_hash = password_hash
    this.password_salt = password_salt
  }

  /** Checks the given password against `password_hash` using `password_salt` */
  checkPassword(password: string) {
    if (!this.password_hash || !this.password_salt) return false
    const hash = pbkdf2Sync(password, this.password_salt, 1000, 64, `sha512`).toString(`hex`)
    return this.password_hash === hash
  }
}
