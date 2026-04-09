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
// import { Refs } from "@utils/schemas"

@Action("me")
@Rest("GET", "/me")
@Authorization()
@O.Describe(
  "Account information",
  "This method returns the account information",
)
@O.Response(200, "Account information", BetterM2S(Account, Projections.DEFAULT))
// @O.Response(404, "Account not found", Refs.NotFound)
class AccountMe extends DecoratedMixin {
  async handler(ctx: AppContext<null>) {
    return Account.findById(ctx.meta.user, Projections.DEFAULT).toJSON()
  }
}

export default AccountMe.schema
