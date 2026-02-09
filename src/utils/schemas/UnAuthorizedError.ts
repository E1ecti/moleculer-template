import { Schema, String } from "fastest-validator-decorators"

import { fv2oapi } from "@utils/convert"


@Schema()
class UnAuthorizedError {
	@String({ enum: ["INVALID_TOKEN", "EXPIRED_TOKEN"] })
	type: string
}

export default fv2oapi(UnAuthorizedError)
