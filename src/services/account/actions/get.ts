import _ from "lodash"
import type { AppContext } from "moleculer"

import Account, { Projections } from "@models/Account"
import BetterM2S from "@utils/BetterM2S"
import {
  Action,
  Authorization,
  DecoratedMixin,
  O,
  Rest,
} from "@utils/decorators"
import { Errors, MakeError } from "@utils/Errors"
import { Refs } from "@utils/schemas"

@Action("me")
@Rest("GET", "/me")
@Authorization()
@O.Describe(
  "Account information",
  "This method returns the account information",
)
@O.Response(200, "Account information", BetterM2S(Account, Projections.DEFAULT))
@O.Response(404, "Account not found", Refs.NotFound)
class AccountMe extends DecoratedMixin {
  async handler(ctx: AppContext<null>) {
    const account = await Account.findById(ctx.meta.user)

    if (account?._id) {
      return _.pick(account, Projections.DEFAULT)
    }

    return MakeError(Errors.NOT_FOUND, { message: "Account not found" })
  }
}

export default AccountMe.schema