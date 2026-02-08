import type { Model, ProjectionFields } from "mongoose"
import m2s from "mongoose-to-swagger"
// import _ from "lodash"

export default function (
  model: Model<any>,
  projection?: string[] | ProjectionFields<any>,
) {
  const schema = m2s(model) as {
    // Contains additional fields, but not needed
    type: "object"
    required: string[]
    properties: Record<string, any>
  }
  const filter = projection
    ? Array.isArray(projection)
      ? projection
      : Object.keys(projection).filter(k => projection[k])
    : null

  if (!filter) return schema

  schema.type = "object"
  schema.required = schema.required.filter(v => filter.includes(v))
  schema.properties =
    // _.pick(schema.properties, filter)
    filter.reduce((schem, k) => {
      if (Object.hasOwn(schema.properties, k)) {
        schem[k] = schema.properties[k]

        // if (schem[k].hasOwnProperty('required'))
        // 	delete schem[k].required
      }

      return schem
    }, {})

  return schema
}