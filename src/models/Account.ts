import {
  getModelForClass,
  ModelOptions,
  prop,
  type Ref,
} from "@typegoose/typegoose"
import { TimeStamps } from "@typegoose/typegoose/lib/defaultClasses"
import { v7 as uuidv7 } from "uuid"

// TODO: Fix impl
export const Projections = {
  DEFAULT: ["email", "name", "picture", "balance", "isBanned"],
  EXTENDED: ["googleId", "isBanned"],
  SYSTEM: ["_id"],
}

@ModelOptions({
  schemaOptions: {
    timestamps: true,
  },
})
export class Account extends TimeStamps {
  // TODO: показать реализацию
  @prop({ required: true, default: () => uuidv7() })
  _id!: string

  @prop({
    unique: true,
  maxlength: 100,
  })
  email: string

  @prop({
    required: true,
  })
  name: string

  @prop({})
  picture?: string

  @prop({
    required: true,
  })
  emailVerified: boolean

  @prop({
    required: true,
    unique: true,
  })
  googleId: string

  @prop({
    required: true,
    positive: true,
    integer: true,
    max: global.Number.MAX_SAFE_INTEGER,
    default: 0,
  })
  balance: number

 // TODO: показать реализацию
  @prop({ type: () => [SummaryItem], required: true, _id: false })
  result!: SummaryItem[]

  // TODO: показать реализацию
  @prop({
    required: true,
    index: true,
    ref: () => Account,
  })
  owner: Ref<Account>

  // TODO: показать реализацию
  @prop({
    index: true,
    required: true,
    ref: () => Project,
    type: String,
  })
  projectId!: Ref<Project, string>


  @prop({ required: true, default: false })
  isBanned: boolean
}

export default getModelForClass(Account)

