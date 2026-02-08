# project

Template app based on [moleculer](https://github.com/moleculerjs/moleculer), with API Gateway powered by [ultimate-express](https://github.com/dimdenGD/ultimate-express), validation via [fastest-validator-decorators](https://github.com/AmauryD/fastest-validator-decorators) and [typegoose](https://github.com/typegoose/typegoose) ORM.

Bundling powered by [rolldown](https://github.com/rolldown/rolldown) with some fixes.


### Validation Schema Declaration

> Using `@ObjectId` without `transform: true` results in a `string`. Note that automatic transformation to a native `ObjectId` may impact performance.

```ts
@Schema({ strict: true })
export class BookParams {
	@String()
	title: string

	@Array({ items: { type: "objectID" }, max: 24 })
	tags: string[]

	@Number({ positive: true, integer: true })
	pages: number

	@ObjectId()
	file: string

	@Boolean({ optional: true, default: false })
	hidden?: boolean
}
```

Even though the original library requires using `getSchema(Schem)`, the `@Params(Schem)` decorator applies it automatically.

### Example of Service Action schema

For security reasons, always use the `@Params` decorator to ensure user data validation. The `@Authorization` decorator is optional. `@Rest` exposes the action via the API Gateway. The `@Visibility` decorator controls action accessibility (e.g., `published`, `public`, `protected`, `private`). See the Moleculer documentation for more details.

> Note, `@Action` **must** be on top of the class declaration.


```ts
@Action("stop")
@Authorization()
@Rest("POST", "/stop")
@Params(SessionStopParams)

@O.Describe("Short summary", "Short description of the action.")
@O.Response(204, "Short description of the response.")
@O.Response(404, "Short description of the response.", Refs.NotFound)
class SessionStop extends DecoratedMixin {
	async handler(ctx: AppContext<SessionStopParams>) {
		const { id } = ctx.params
		const { user } = ctx.meta

		await Session.updateOne({
			_id: id,
			user: user,
			state: SessionState.ACTIVE
		}, {
			$set: { state: SessionState.TERMINATED }
		})

		ctx.meta.$statusCode = 204
		return true
	}
}

export default SessionStop.schema
```