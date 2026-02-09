import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseSync, Visitor } from 'oxc-parser'
import { glob } from 'tinyglobby'

// --- Settings ---
const RELATIVE_ROOT = 'src'
const SRC_ROOT = path.join(process.cwd(), RELATIVE_ROOT)
const FILE_PATTERN = '**/*' // Pattern for finding files
const OUTPUT_RELATIVE = path.join(RELATIVE_ROOT, 'types', 'openapi.generated.d.ts')
const OUTPUT_FILE = path.join(process.cwd(), OUTPUT_RELATIVE)
const ALIAS_PATH = '@utils/schemas' // Alias we are augmenting
const DECORATOR_NAMESPACE = 'O'
const DECORATOR_METHOD = 'Component'
// ---

/**
 * Generates the content of the .d.ts file
 */
function generateDTSContent(names: Set<string>): string {
	const sortedNames = Array.from(names).sort()

	const properties = sortedNames
		.map(name => `		${name}: null`)
		.join('\n')

	// We use the same trick with `export *` that worked for you
	return `export * from '${ALIAS_PATH}'

declare module '${ALIAS_PATH}' {
  interface RegisteredSchemas {
${properties}
  }
}
`
}

/**
 * Main function
 */
async function main() {
	console.log('Starting OpenAPI type generator...')

	const allComponentNames = new Set<string>()

	// 2. Find all .ts files in the project
	const files = await glob(FILE_PATTERN, { cwd: SRC_ROOT, absolute: true })
	console.log(`Files to process: ${files.length}`)

	const visitor = new Visitor({
		// We "listen" only to nodes of type 'Decorator'.
		// 'oxc-parser' will will traverse the tree and call this function for each decorator.
		Decorator(decoratorNode) {
			// This logic is taken from the old 'findComponentNames' function,
			// but now it is applied only to the necessary nodes.

			// 3. PATTERN: The decorator must be a function call (`@O.Component(...)`)
			if (decoratorNode.expression?.type === 'CallExpression') {
				const callExpr = decoratorNode.expression

				// 4. PATTERN: The called function must be `MemberExpression` (`O.Component`)
				if (callExpr.callee?.type === 'MemberExpression') {
					const callee = callExpr.callee

					// 5. PATTERN: Check if it is `O.Component`
					const isCorrectDecorator =
						callee.object?.type === 'Identifier' &&
						callee.object.name === DECORATOR_NAMESPACE &&
						callee.property?.type === 'Identifier' &&
						callee.property.name === DECORATOR_METHOD

					if (isCorrectDecorator) {
						// 6. PATTERN: Found it! Now extract the first argument
						const firstArg = callExpr.arguments?.[0]

						// 7. PATTERN: The argument must be a string literal (`"MyComponent"`)
						if (firstArg?.type === "Literal") {
							console.log(`  Found component: ${firstArg.value}`)
							// Add it to our Set immediately
							allComponentNames.add(firstArg.value as string)
						}
					}
				}
			}
		}
	})

	// 3. Process each file
	for (const file of files) {
		if (file.endsWith('.d.ts')) continue // Skip .d.ts

		try {
			const sourceCode = fs.readFileSync(file, 'utf-8')

			// 4. Parse the code into AST
			const { program } = parseSync(file, sourceCode)

			// 5. Run our "visitor"
			visitor.visit(program)
		} catch (e) {
			console.warn(`Error parsing file ${file}: ${e.message}`)
		}
	}

	// 6. Generate the .d.ts file
	const dtsContent = generateDTSContent(allComponentNames)

	// 7. Create the directory if needed
	fs.mkdirSync(path.dirname(OUTPUT_FILE), { recursive: true })

	// 8. Write the file
	fs.writeFileSync(OUTPUT_FILE, dtsContent, 'utf-8')

	console.log(`Generation complete. Found ${allComponentNames.size} components.`)
	console.log(`File saved: ${OUTPUT_RELATIVE}`)
}

// Run it
main().catch(console.error)