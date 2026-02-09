import { Errors as MErrors } from "moleculer"

const { MoleculerError } = MErrors


const Errors = {
	NOT_FOUND: { code: 404 },
	VALIDATION_ERROR: { code: 422 },

	NOT_IMPLEMENTED: { code: 500 },
	ORIGIN_NOT_FOUND: { code: 500 },
	SOMETHING_WENT_WRONG: { code: 500 },
	TOO_MANY_REQUESTS: {code: 429 },

	UNAUTHORIZED: { code: 401 },
	EXPIRED_TOKEN: { code: 401 },
	ACCESS_DENIED: { code: 403 },
	LIMIT_REACHED: { code: 403 },

	INCORRECT_DATA: { code: 401 },
} as const


type ErrorKey = keyof typeof Errors
type ErrorKeys = Extract<keyof typeof Errors, string>


type ErrorData<T = any> = Record<string, T>

const MakeError = (
	error: ErrorKey,
	options?: { message?: string; data?: ErrorData },
) =>
	Promise.reject(
		new MoleculerError(
			options?.message ?? "",
			Errors[error].code ?? 500,
			error,
			options?.data,
		),
	)

type ErrorFactory = {
	[K in ErrorKeys]: (
		messageOrData?: string | ErrorData,
		data?: ErrorData,
	) => Promise<void>
}

const E = new Proxy(
	{},
	{
		get(_target, prop: ErrorKey) {
			return (message, data) => {
				if (typeof message !== "string") {
					data = message
					message = null
				}

				return MakeError(prop, { message, data })
			}
		}
	}
) as ErrorFactory

export { Errors, MakeError, MoleculerError, E }