import type Validator from "fastest-validator"
import type { CompilationFunction } from "fastest-validator"

const ObjectIdValidation: CompilationFunction = function (
  this: Validator,
  { schema, messages, index },
  path,
  context: any,
) {
  const src: string[] = []

  if (!context.customs[index]) context.customs[index] = { schema }
  else context.customs[index].schema = schema

  // src.push(`
  //     const ObjectId = context.customs[${index}].schema.ObjectId
  //     if (
  // 			typeof value !== "string" ||
  // 			value.length !== 24 ||
  // 			!/^[0-9a-f]{24}$/.test(value)
  // 		) {
  //     	${this.makeError({ type: "ObjectId", actual: "value", messages })}
  //       return
  //     }
  //   `)

  src.push(`
		if (typeof value !== "string")
			return ${this.makeError({ type: "ObjectId", actual: "value", messages })}
		if (value.length !== 24)
			return ${this.makeError({ type: "ObjectId", actual: "value", messages })}
		for (let i = 0; i < 24; i++) {
			const char = value.charCodeAt(i);
			if (
				(char >= 48 && char <= 57) ||
				(char >= 97 && char <= 102) ||
				(char >= 65 && char <= 70)
			) {
				continue;
			}
			return ${this.makeError({ type: "ObjectId", actual: "value", messages })}
		}
		return value;
	`)

  if (schema.convert)
    src.push("if (typeof value === 'string') return new ObjectId(value)")
  src.push("return value")

  return { source: src.join("\n") }
}

export default (v: Validator) => {
  v.add("ObjectId", ObjectIdValidation)
  v.add("ObjectID", ObjectIdValidation)
  v.add("objectID", ObjectIdValidation)
}