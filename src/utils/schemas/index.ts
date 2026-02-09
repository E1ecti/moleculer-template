import type { OpenAPIV3_1 } from "openapi-types"

import NotFound from "./NotFound"
import UnAuthorizedError from "./UnAuthorizedError"

const schemas = {
	NotFound,
	UnAuthorizedError
}

export interface RegisteredSchemas {
	NotFound: typeof NotFound,
	UnAuthorizedError: typeof UnAuthorizedError
}

const Refs = new Proxy<{
	[K in keyof RegisteredSchemas]?: OpenAPIV3_1.ReferenceObject
}>(
	{},
	{
		get(_target, name) {
			if (typeof name !== "string")
				throw Error("Wrong schema accessed")

			return { $ref: `#/components/schemas/${name}` }
		}
	}
)


export default schemas
export { Refs }