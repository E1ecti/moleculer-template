import type { IncomingMessage } from "node:http"
import { env } from "node:process"
import cookie from "cookie"
import _ from "lodash"
import type { AppContext, Service, ServiceSchema } from "moleculer"
import ApiGatewayService, {
  type ApiSettingsSchema,
  type GatewayResponse,
  type IncomingRequest,
  type Route,
} from "moleculer-web"

import { Errors, MakeError } from "@utils/Errors"
import JwtTokens from "@utils/JwtTokens"

// TODO: сделать реализацию расшерения контекста в другом файле, опциональную на <T>
interface RequestWithRaw extends IncomingMessage {
  rawBody?: Buffer
}

// TODO: реализация-пример рабочая, но ее надо прошерстить полностью
export default {
  name: "gateway",
  mixins: [ApiGatewayService],
  settings: {
    port: Number(env.PORT) ?? 3000,

    bodyParsers: {
      json: {
        strict: false,
        limit: "5MB",
        // Функция verify позволяет получить доступ к сырому буферу до парсинга
        verify: (
          req: IncomingRequest & { rawBody: Buffer },
          res: GatewayResponse,
          buf: Buffer,
        ) => {
          // Сохраняем сырой буфер, он понадобится для валидации подписи
          req.rawBody = buf
        },
      },
      urlencoded: { extended: true, limit: "5MB" },
    },

    // @ref https://smudge.ai/blog/ratelimit-algorithms
    rateLimit: {
      window: 20 * 1000,
      limit: 100,
      key: req => {
        return (
          req.headers["cf-connecting-ip"] ||
          req.connection.remoteAddress ||
          req.socket.remoteAddress
        )
      },
    },

    cors: {
      origin: [
        "http://localhost:4321", // Dev frontend
        "http://localhost:3000", // Dev backend
        "https://bma.media-archery.com", // Prod frontend
        "https://api.media-archery.com", // Prod backend
      ],
      methods: ["GET", "POST", "PUT", "DELETE"],
      credentials: true,
    },

    routes: [
      {
        path: "/stripe",
        authentication: false,
        authorization: false,
        mappingPolicy: "restrict",

        aliases: {
          "POST /webhook": "stripe.webhook",
        },

        // 1. Включаем "особый" парсер ТОЛЬКО для этого маршрута
        bodyParsers: {
          json: {
            strict: false,
            // Сохраняем Buffer
            verify: (req: RequestWithRaw, res: any, buf: Buffer) => {
              req.rawBody = buf
            },
          },
        },

        // 2. Прокидываем заголовки ТОЛЬКО для этого маршрута
        // Типизируем Context с нашим ContextMeta
        onBeforeCall(
          ctx: AppContext,
          route: any,
          req: RequestWithRaw,
          res: any,
        ) {
          // 1. Копируем заголовки (типы совпадают с IncomingHttpHeaders)
          ctx.meta.headers = req.headers

          // 2. Копируем сырой буфер, если он есть
          if (req.rawBody) {
            ctx.meta.rawBody = req.rawBody
          }
        },
      },
      {
        path: "/",
        autoAliases: true,
        mappingPolicy: "restrict",
        authorization: true,

        onBeforeCall(ctx, route, req, res) {
          const IP =
            req.headers["x-forwarded-for"] ||
            req.socket.remoteAddress ||
            req.socket.remoteAddress
          const UA = req.headers["user-agent"]
          const LOCALE = req.headers["accept-language"]
          const REFERER = req.headers.referer

          // ex: Telegram IP: 149.154.161.215 | TelegramBot (like TwitterBot) | en-US,en;q=0.5
          this.logger.info(`${IP} | ${UA} | ${LOCALE} | ${REFERER}`)
        },

        aliases: {
          "GET /"(req, res) {
            if (env.ENV === "development") {
              res.statusCode = 303
              res.setHeader("location", "/openapi/ui")
              return res.end()
            }

            res.statusCode = 303
            res.setHeader("location", "https:/example.com")
            return res.end()
          },
        },
      },
    ],
  },

  actions: {
    listAliases: { visibility: "public" },
  },

  methods: {
    reformatError(err) {
      // Filter out the data from the error before sending it to the client
      if (err.type === "VALIDATION_ERROR") {
        err.data = err.data.map(el => _.pick(el, ["field", "message"]))
      }
      return _.pick(err, [
        err.message ? "message" : null,
        "code",
        "type",
        "data",
      ])
    },
    async authorize(
      this: Service,
      ctx: AppContext,
      route: Route,
      req: IncomingRequest,
      res: GatewayResponse,
    ) {
      if (!req?.$action?.authorization) {
        return
      }

      // (Missing header)
      if (!req.headers.cookie)
        return MakeError(Errors.UNAUTHORIZED, { message: "No cookie" })

      // (Missing referer)
      if (!req.headers.referer)
        return MakeError(Errors.UNAUTHORIZED, { message: "No referer" })

      const token = cookie.parse(req.headers.cookie)?.session_token
      // (missing pair key-value)
      if (!token) return MakeError(Errors.UNAUTHORIZED, { message: "No token" })

      const data = await JwtTokens.verifyToken(token)
      // "What is it?
      if (!data.id)
        return MakeError(Errors.UNAUTHORIZED, { message: "Invalid token" })

      ctx.meta.user = data.id
    },
  },
} as ServiceSchema<ApiSettingsSchema>