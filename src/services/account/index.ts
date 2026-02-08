import type { ServiceSchema } from "moleculer"

import get from "./actions/get"

export default {
  name: "account",
  settings: {
    rest: "/account",
  },
  actions: {
    get,
  },
} as ServiceSchema
