import type { ActionOpenApi } from "@spailybot/moleculer-auto-openapi"
import type { OpenAPIV3_1 } from "openapi-types"

import { fv2oapi } from "./convert"
import { ActionKeys } from "./decorators"
import { Refs } from "./schemas"

const SYMBOL = Symbol("action:oapi")

const SchemaByCode = {
	404: Refs.NotFound,
	401: Refs.UnAuthorizedError,
}

const OpenApiDecorators = {
	Describe: (summary: string, description?: string) => (target: Function) => {
		const spec_list: any[] = Reflect.getMetadata(SYMBOL, target) ?? []
		// const default_spec = Reflect.getMetadata(ActionKeys.openapi, target)

		let OAPI: ActionOpenApi //= default_spec ?? {}

		OAPI = { summary, description }
		OAPI.responses = {}

		if (spec_list)
			spec_list.forEach((spec) => {
				switch (spec.type) {
					case "response":
						OAPI.responses[spec.code] = {
							description: spec.description,
							content: spec.schema
								? { "application/json": { schema: spec.schema } }
								: undefined,
						}
						break
					case "component":
						OAPI.components[spec.name] = { "application/json": { schema: spec.schema } }
						break
				}
			})

		Reflect.defineMetadata(ActionKeys.openapi, OAPI, target)
	},

	Response:
		(
			code: number,
			description?: string,
			schema?: { new(): any } | OpenAPIV3_1.SchemaObject,
		) =>
			(target: Function) => {
				const spec_list: any[] = Reflect.getMetadata(SYMBOL, target) ?? []

				if (!schema) schema = SchemaByCode[code]

				if (typeof schema === "function") schema = fv2oapi(schema)

				spec_list.push({
					type: "response",
					code,
					description: description ?? undefined,
					schema,
				})

				Reflect.defineMetadata(SYMBOL, spec_list, target)
			},


	Component:
		(
			name: string,
			schema: { new(): any } | OpenAPIV3_1.SchemaObject,
		) =>
			(target: Function) => {
				const spec_list: any[] = Reflect.getMetadata(SYMBOL, target) ?? []

				if (typeof schema === "function")
					schema = fv2oapi(schema)

				spec_list.push({
					type: "component",
					name,
					schema,
				})

				Reflect.defineMetadata(SYMBOL, spec_list, target)
			},
}

export { OpenApiDecorators }
