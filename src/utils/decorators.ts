import type { ActionOpenApi } from "@spailybot/moleculer-auto-openapi"
import { getSchema } from "fastest-validator-decorators"
import _ from "lodash"
import type {
  ActionCacheOptions,
  ActionHandler,
  ActionSchema,
  ActionVisibility,
  Service,
  ServiceAction,
  ServiceSchema,
  ServiceSettingSchema,
} from "moleculer"
import type { RestSchema } from "moleculer-web"
import type { OpenAPIV3_1 } from "openapi-types"

// import type { Scopes } from "./authorization"
import { OpenApiDecorators } from "./decorators.oapi"
import { Refs } from "./schemas"

// Hint for TS to use `this` properly
// biome-ignore lint/correctness/noUnusedVariables: Inteface is used, biome sucks
interface DecoratedMixin<T = ServiceSettingSchema> extends Service<T> { }

// biome-ignore lint/complexity/noStaticOnlyClass: Nested by decorator
class DecoratedMixin {
  static schema: ServiceAction
  static getMixin: <ActionName extends string>() => ServiceSchema & {
    actions: { [K in ActionName]: ActionSchema }
  }
}

const ActionKeys: Partial<Record<keyof ActionSchema, symbol>> = {
  authorization: Symbol("action:authorization"),
  // permission: Symbol("action:permission"),
  visibility: Symbol("action:visibility"),
  rest: Symbol("action:rest"),
  params: Symbol("action:params"),
  cache: Symbol("action:cache"),
  openapi: Symbol("action:openapi"),
  // scope: Symbol("action:scope"),
}

/**
 * Sets the visibility of an action.
 * @param {ActionVisibility} type The visibility type.
 * @returns {Function} The decorator function.
 */
const AuthorizationOpenApiSchema: OpenAPIV3_1.OperationObject = {
  security: [{ Bearer: [] }],
  responses: {
    401: {
      description: "Access denied",
      content: { "application/json": { schema: Refs.UnAuthorizedError } },
    },
  },
}

function Authorization(type: "bearer" | "api" = "bearer") {
  return (target: Function) => {
    const oapi = Reflect.getMetadata(ActionKeys.openapi, target)
    Reflect.defineMetadata(
      ActionKeys.openapi,
      _.defaultsDeep(oapi, AuthorizationOpenApiSchema),
      target,
    )
    Reflect.defineMetadata(
      ActionKeys.authorization,
      type === "bearer" ? true : type,
      target,
    )
  }
}

// function Permission(name?: string | string[]) {
//   return (target: Function) => {
//     Reflect.defineMetadata(ActionKeys.permission, name ?? true, target)
//   }
// }

/**
 * Defines the possible visibility levels for an action.
 *
 * @param type Visibility levels:
 * - "published": The action is publicly visible and accessible.
 * - "public": The action is accessible to all users.
 * - "protected": The action is accessible within the class and its subclasses.
 * - "private": The action is only accessible within the class itself.
 */
function Visibility(type: ActionVisibility) {
  return (target: Function) =>
    Reflect.defineMetadata(ActionKeys.visibility, type, target)
}

function Rest(method: RestSchema["method"], path: string) {
  return (target: Function) =>
    Reflect.defineMetadata(ActionKeys.rest, { method, path }, target)
}

// function Params<T>(schema: { new(): T }, property?: keyof T) {
function Params(schema: { new(): any }) {
  return (target: Function) =>
    Reflect.defineMetadata(
      ActionKeys.params,
      typeof schema === "function" ? getSchema(schema) : schema,
      target
    )
}

function Cache(options: ActionCacheOptions) {
  return (target: Function) =>
    Reflect.defineMetadata(ActionKeys.cache, options, target)
}

function _OpenAPI(spec: ActionOpenApi) {
  return (target: Function) => {
    const defaults = Reflect.getMetadata(ActionKeys.openapi, target)
    Reflect.defineMetadata(ActionKeys.openapi, { ...spec, ...defaults }, target)
  }
}

// function Scope(...scope: [Scopes | `${Scopes}`]) {
//   return (target: Function) =>
//     Reflect.defineMetadata(ActionKeys.scope, scope, target)
// }

function Action(name: string) {
  return <T extends { new(...args: any[]): { handler: ActionHandler } }>(
    source: T,
  ) => {
    if (typeof source.prototype.handler !== "function")
      throw new Error(
        `Class decorated with @Action("${name}") must have a 'handler' method.`,
      )

    const schema: ActionSchema = {
      name: name,
      handler: source.prototype.handler,
    }

    // Workaround for strict-mode
    // for (let k of Object.keys(ActionKeys) as [keyof ActionSchema])
    // 	Object.defineProperty(schema, k, { value: Reflect.getMetadata(ActionKeys[k], source) })
    for (const k in ActionKeys)
      schema[k] = Reflect.getMetadata(ActionKeys[k], source)

    class DecoratedAction extends source {
      static schema: ActionSchema = schema

      public static getMixin(): ServiceSchema {
        return {
          name: "DecoratedMixin",
          actions: { [name]: DecoratedAction.schema },
        }
      }
    }

    return DecoratedAction
  }
}

function _Post(path: string) {
  return (target: Function) =>
    Reflect.defineMetadata(ActionKeys.rest, { method: "POST", path }, target)
}
function _Get(path: string) {
  return (target: Function) =>
    Reflect.defineMetadata(ActionKeys.rest, { method: "GET", path }, target)
}

export { DecoratedMixin, Action, ActionKeys }
export {
  Authorization,
  Visibility,
  Cache,
  Params,
  // Permission,
  Rest,
  // Scope,
  // OpenAPI
}

export { OpenApiDecorators as O }
