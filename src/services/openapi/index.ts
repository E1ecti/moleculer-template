import { readFileSync } from "node:fs"
import { env } from "node:process"
import {
  type MoleculerWebTypes,
  OpenApiMixin,
  type OpenApiMixinSettings,
} from "@spailybot/moleculer-auto-openapi"
import _ from "lodash"
import { type Context, Service, type ServiceSchema } from "moleculer"
import type { Alias } from "moleculer-web"

import schemas from "@utils/schemas"

const AnotherOpenApiMixin = OpenApiMixin

delete AnotherOpenApiMixin.actions.assets
// delete AnotherOpenApiMixin.actions.oauth2Redirect

const OpenApiServiceSchema: ServiceSchema<
  OpenApiMixinSettings & MoleculerWebTypes.RestServiceSettings
> = {
  name: "openapi",
  mixins: [AnotherOpenApiMixin],
  settings: {
    addServiceNameToTags: true,
    skipUnresolvedActions: true,

    openApiPaths: {
      schemaPath: "/openapi/json",
    },
    openapi: {
      info: {
        title: process.env.npm_package_name
          ? `${process.env.npm_package_name} API`
          : "My API",
        version: process.env.npm_package_version
          ? `${process.env.npm_package_version}`
          : "0.0.1",
        // description:
        //   "**Для получения API-ключа, пожалуйста, свяжитесь с нами по адресу info@example.com**\n\nДокументация содержит подробную информацию о доступных эндпоинтах, параметрах запросов и примерах ответов.",
        termsOfService: "https://example.com/terms/",
        contact: {
          name: "API Support",
          url: "https://www.example.com/support",
          email: "support@example.com",
        },
        // license: {
        //   name: "Apache 2.0",
        //   url: "https://www.apache.org/licenses/LICENSE-2.0.html",
        // },
      },
      servers: [
        {
          ...(env.ENV === "development" && {
            url: "http://localhost:3000",
            description: "Development",
          }),
        },
        {
          url: "https://your.production.com",
          description: "Production",
        },
      ],
      components: {
        schemas: schemas,
        securitySchemes: {
          default: {
            type: "http",
            scheme: "bearer",
          },
        },
        responses: {
          // "ReturnedData": {
          // 	"description": "",
          // 	"content": {
          // 		"application/json": {
          // 			"schema": {
          // 			}
          // 		}
          // 	}
          // }
        },
      },
    },
    summaryTemplate: v => v.summary, // Disable `(goods.get) [autoAlias]` after path in ui
  },
  methods: {
    filterAliases: (ctx: Context, aliases: Alias[]) =>
      aliases.filter(alias => alias.service.name !== "openapi"),
  },
  actions: {
    generate: {
      // cache: { ttl: 60 },
      rest: { method: "GET", path: "json" },
      async handler(ctx) {
        const spec: any = await ctx.call("openapi.generateDocs")
        // for (const path in spec.paths) {
        //   for (const method in spec.paths[path]) {
        //     if (spec.paths[path][method].responses?.default) {
        //       delete spec.paths[path][method].responses.default
        //     }
        //   }
        // }
        return spec
      },
    },
    ui: {
      rest: "GET /ui",
      handler(ctx) {
        ctx.meta.$responseType = "text/html"
        return readFileSync("./public/scalar.html")
      },
    },
  },
}

class OpenApiService extends Service {
  constructor(broker) {
    super(broker)
    this.parseServiceSchema(OpenApiServiceSchema)
  }

  mergeSchemaSettings(src, target) {
    if (target?.$secureSettings || src?.$secureSettings) {
      const srcSS = src?.$secureSettings ? src.$secureSettings : []
      const targetSS = target?.$secureSettings ? target.$secureSettings : []
      if (!target) target = {}

      target.$secureSettings = [new Set(...srcSS, ...targetSS)]
    }

    return _.defaults(src, target)
  }
}

export default OpenApiService