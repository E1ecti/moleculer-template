import _ from "lodash"
import type moleculer from "moleculer"
import type { Context, Service, ServiceSchema } from "moleculer"
import ApiGatewayService, { type ApiSettingsSchema } from "moleculer-web"
import express from "ultimate-express"

import { SessionState } from "@models/Session"
import { MoleculerError } from "@utils/Errors"
import authorize from "./methods/authorize"
import { env } from "node:process"


const [NOT_FOUND_RESPONSE, WRONG_RESPONSE] = [
	"NOT_FOUND",
	"SOMETHING_WENT_WRONG"
].map((el) => JSON.stringify({ type: el }))

export default {
	name: "gateway",
	mixins: [ApiGatewayService],
	settings: {
		server: false,
		cors: {
			methods: ["GET", "POST", "DELETE"],
			origin: "*",
		},
		routes: [
			{
				path: "/",
				autoAliases: true,
				mappingPolicy: "restrict",
				authorization: true,
			},
		],
		onError(_req, res, err) {
			if (err instanceof MoleculerError && err.type !== "SERVICE_NOT_FOUND") {
				res.writeHead(err.code)
				res.setHeader("Content-Type", "application/json")
				res.end(
					JSON.stringify(
						_.pick(err, "type", err.message ? "message" : null, "data"),
					),
				)
				return
			}

			res.writeHead(500)
			res.setHeader("Content-Type", "application/json")
			res.end(WRONG_RESPONSE)
		},
	},
	actions: {
		listAliases: { visibility: "public" },
	},
	methods: {
		reformatError: (err: moleculer.Errors.MoleculerError) =>
			_.pick(err, ["type", "data"]),
		authorize,
	},
	started() {
		const server = express()

		server
			// Default route for
			.get("/", (_req, res) => {
				res.writeHead(302, { location: "/openapi/ui" }).end()
			})

			// .use(errorhandler)
			.use(this.express())

			// Default 404 error:
			.all("*", (_req, res) =>
				res
					.writeHead(404)
					.contentType("application/json")
					.end(NOT_FOUND_RESPONSE),
			)
			.set("catch async errors", true)
			.set("x-powered-by", false)
			.set("etag", false)
			.set("declarative responses", false)
			.listen(env.PORT ?? 3000)
	},
} satisfies ServiceSchema<ApiSettingsSchema>
