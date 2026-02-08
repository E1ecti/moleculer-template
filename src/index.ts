import "reflect-metadata"
import { env } from "node:process"
import type { ValidatorConstructorOptions } from "fastest-validator"
import { readdir } from "fs/promises"
import { type BrokerOptions, ServiceBroker } from "moleculer"
import mongoose from "mongoose"

import ObjectIdPlugin from "@utils/ObjectIdPlugin"

const broker = new ServiceBroker({
  metadata: {
    region: "ru-east-1",
  },
  cacher: {
    type: "MemoryLRU",
    options: {
      max: Number(env.LRU_CACHE_LIMIT) ?? 500_000,
    },
  },
  tracing: {
    enabled: true,
    exporter: "Console",
    events: true,
    stackTrace: true,
    colors: true,
  },
  // TODO: Only for Node 22+
  // metrics: {
  // 	enabled: true,
  // 	reporter: [
  // 		{
  // 			type: "Prometheus",
  // 			options: {
  // 				// HTTP port
  // 				port: 3030,
  // 				// HTTP URL path
  // 				path: "/metrics",
  // 				// Default labels which are appended to all metrics labels
  // 				defaultLabels: registry => ({
  // 					namespace: registry.broker.namespace,
  // 					nodeID: registry.broker.nodeID
  // 				})
  // 			}
  // 		}
  // 	]
  // },
  validator: {
    type: "Fastest",
    options: {
      useNewCustomCheckerFunction: true,
      messages: {
        ObjectId: "The '{field}' field must be an valid ObjectId",
      },
      plugins: [ObjectIdPlugin],
    } as ValidatorConstructorOptions,
  },
} as BrokerOptions)

const services = env.SERVICES
  ? env.SERVICES.split(",")
  : await readdir("src/services")

services.map(service =>
  import(`./services/${service}.js`)
    .then(schema => broker.createService(schema.default))
    .catch(e => {
      broker.logger.error(`Failed to load service: ${service}`)
      broker.logger.error(e)
    }),
)

mongoose
  .connect(env.MONGO_URI)
  .then(() => broker.logger.info("Database connected"))

broker
  .start()
  .then(() => {
    if (env.ENV === "development") broker.repl()

    broker.logger.info("Moleculer server started")
    broker.logger.info("Loading services...")
  })
  .catch(broker.logger.error)