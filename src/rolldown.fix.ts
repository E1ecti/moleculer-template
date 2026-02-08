import type { RolldownPlugin } from "rolldown"

export default {
	name: "rolldown-fix",
	renderChunk: (src) => ({
		code: src
			// Class names fix
			.replace(/((\w+) = class )\2\$\d/g, "$1$2")

			// Enum fixer
			.replace(
				/(enum: (\w+)( |\n)(?:[\s\S]*?))typeof \((_ref\d?\$?\d?) = typeof \2 .+ : Object/g,
				"$1Object.values($2).at(-1).constructor",
			)

			// Useless import fix
			.replaceAll("Ref, ", "")

			// Wrong import fix
			.replaceAll(
				'@typegoose/typegoose/lib/defaultClasses"',
				'@typegoose/typegoose/lib/defaultClasses.js"',
			),
	}),
} as RolldownPlugin
