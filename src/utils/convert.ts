import { Converters } from "@spailybot/moleculer-auto-openapi"
import Validator from "fastest-validator"
import { getSchema } from "fastest-validator-decorators"
import type { OpenAPIV3_1 } from "openapi-types"

const converter = new Converters.FastestValidatorConverter(new Validator())

function fv2oapi(schema: { new (): any }): OpenAPIV3_1.SchemaObject {
	const parsed = getSchema(schema)
	const schem: OpenAPIV3_1.SchemaObject = {
		type: "object",
		properties: converter.getSchemaObjectFromSchema(parsed),
	}

	return schem
}

export { fv2oapi }
