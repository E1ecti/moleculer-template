import { env } from "node:process"
import type { ValidatorConstructorOptions } from "fastest-validator"
import type { BrokerOptions } from "moleculer"
import mongoose from "mongoose"

import ObjectIdPlugin from "@utils/ObjectIdPlugin"

if (!env.DB) throw new Error("Empty DB environment variable")

mongoose.connect(env.DB, {
	connectTimeoutMS: 5 * 1000,
	serverSelectionTimeoutMS: 5 * 1000,
})

const ValidatorOptions: ValidatorConstructorOptions = {
	useNewCustomCheckerFunction: true,
	messages: {
		ObjectId: "The '{field}' field must be an valid ObjectId",
	},
	plugins: [ObjectIdPlugin],
}

export default {
	validator: {
		type: "Fastest",
		options: ValidatorOptions,
	},
	cacher: {
		type: "MemoryLRU",
		options: {
			max: Number(env.LRU_CACHE_LIMIT) ?? 500_000,
		},
	},
	tracing: {
		enabled: false,
		exporter: "Console",
		events: true,
		stackTrace: true,
	},
	logger: [
		{
			type: "Console",
			options: {
				// Logging level
				level: "info",
				// Using colors on the output
				colors: true,
				// Print module names with different colors (like docker-compose for containers)
				moduleColors: true,
				// Line formatter. It can be "json", "short", "simple", "full", a `Function` or a template string like "{timestamp} {level} {nodeID}/{mod}: {msg}"
				formatter: "full",
				// Custom object printer. If not defined, it uses the `util.inspect` method.
				objectPrinter: null,
				// Auto-padding the module name in order to messages begin at the same column.
				autoPadding: true,
			},
		},
		env.DATADOG
			? {
				type: "Datadog",
				options: {
					level: "info",
					url: "https://http-intake.logs.datadoghq.com/v1/input/",
					apiKey: process.env.DATADOG_API_KEY,
					ddSource: "moleculer",
					env: undefined,
					// hostname: os.hostname(),
					// Custom object printer function for `Object` & `Ąrray`
					objectPrinter: null,
					interval: 10 * 1000,
				},
			}
			: null,
	],
	replOptions: { delimiter: "$ " },
	logLevel: env.LOGGING || "info",
	transporter: env.TRANSPORTER,
} as BrokerOptions
export { ValidatorOptions }
