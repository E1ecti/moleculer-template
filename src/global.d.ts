import type { Context } from "moleculer"
import type { RestSchema } from "moleculer-web"

// import type { Scopes } from "@utils/authorization"
import type { ApiGatewayMetadata, AuthorizationMetadata } from "@utils/metadata"

type DefaultMetadata = ApiGatewayMetadata & AuthorizationMetadata
type Override<T, U> = Omit<T, keyof U> & U

declare module "moleculer" {
	interface ActionSchema {
		rest?: RestSchema
		authorization?: boolean
		// permission?: string | boolean
		// scope?: Scopes[]
	}

	type AppContext<
		TParams = unknown,
		TMeta extends object = {},
		TLocals = Record<string, any>,
		THeaders = Record<string, any>,
	> = Omit<Context<TParams, Override<DefaultMetadata, TMeta>, TLocals, THeaders>, "call"> & ServiceActionCall
}