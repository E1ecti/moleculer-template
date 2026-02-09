import * as fs from 'node:fs'
import * as path from 'node:path'
import { parseSync } from 'oxc-parser'
import { glob } from 'tinyglobby'

const CONFIG = {
	srcGlob: ['src/services/**/actions/*.ts'],
	outputPath: 'src/types/services.generated.d.ts',
	cwd: process.cwd(),
}

const TEMPLATE = `import "moleculer"
import type { CallingOptions } from "moleculer"

%IMPORTS%

export interface ServiceActionMap {
%MAP_ENTRIES%
}

declare module "moleculer" {
	interface ServiceActionCall {
		call<K extends keyof ServiceActionMap>(
			actionName: K,
			params: ServiceActionMap[K]["params"],
			opts?: CallingOptions
		): Promise<ServiceActionMap[K]["response"]>

		// call<T = any, P = any>(
		// 	actionName: string,
		// 	params?: P,
		// 	opts?: CallingOptions
		// ): Promise<T>
	}
}
`

interface ActionMeta {
	serviceName: string
	actionName: string
	filePath: string
	paramsType?: string
	responseType?: string
}

async function run() {
	const files = await glob(CONFIG.srcGlob, { cwd: CONFIG.cwd, absolute: true })
	const actions: ActionMeta[] = []

	console.log(`Found files: ${files.length}`)

	for (const filePath of files) {
		const sourceText = fs.readFileSync(filePath, 'utf-8')
		const parsed = parseSync(filePath, sourceText, { sourceType: 'module' })

		// --- CORRECTION HERE ---
		// Splitting the path by both types of slashes to work correctly on Windows + glob
		const pathParts = filePath.split(/[/\\]/)
		// -------------------------

		const actionsIndex = pathParts.lastIndexOf('actions')

		if (actionsIndex === -1 || actionsIndex === 0)
			continue

		const serviceName = pathParts[actionsIndex - 1]
		const fileName = pathParts[pathParts.length - 1]
		const actionName = fileName.replace(/\.ts$/, '')

		let paramsType: string | undefined
		let responseType: string | undefined

		for (const statement of parsed.program.body) {
			if (statement.type !== 'ExportNamedDeclaration') continue
			if (!statement.declaration) continue

			const decl = statement.declaration
			let exportedName: string | undefined

			if (decl.type === 'TSTypeAliasDeclaration')
				exportedName = decl.id.name
			else if (decl.type === 'TSInterfaceDeclaration')
				exportedName = decl.id.name
			else if (decl.type === 'ClassDeclaration')
				exportedName = decl.id?.name


			if (exportedName)
				if (/Params$/.test(exportedName))
					paramsType = exportedName
				else if (/Response$/.test(exportedName))
					responseType = exportedName
		}

		if (paramsType || responseType)
			actions.push({
				serviceName,
				actionName,
				filePath,
				paramsType,
				responseType,
			})

	}

	const importLines: string[] = []
	const mapEntries: string[] = []
	const outputDir = path.dirname(path.resolve(CONFIG.cwd, CONFIG.outputPath))

	actions.forEach((action) => {
		const pascalService = toPascalCase(action.serviceName)
		const pascalAction = toPascalCase(action.actionName)
		const prefix = `${pascalService}${pascalAction}`

		const importItems: string[] = []
		let mappedParams = 'void'
		let mappedResponse = 'unknown'

		if (action.paramsType) {
			const alias = `${prefix}Params`
			importItems.push(`${action.paramsType} as ${alias}`)
			mappedParams = alias
		}

		if (action.responseType) {
			const alias = `${prefix}Response`
			importItems.push(`${action.responseType} as ${alias}`)
			mappedResponse = alias
		}

		let relativePath = path.relative(outputDir, action.filePath)
		relativePath = relativePath.replace(/\.ts$/, '')
		if (!relativePath.startsWith('.')) relativePath = `./${relativePath}`
		// Convert import paths to unix-style (essential for import)
		relativePath = relativePath.split(path.sep).join('/')

		if (importItems.length > 0) {
			importLines.push(
				`import type { ${importItems.join(', ')} } from "${relativePath}"`
			)

			mapEntries.push(`\t"${action.serviceName}.${action.actionName}": {\n\t\tparams: ${mappedParams}\n\t\tresponse: ${mappedResponse}\n\t}`)
		}
	})

	const content = TEMPLATE.replace('%IMPORTS%', importLines.join('\n')).replace(
		'%MAP_ENTRIES%',
		mapEntries.join('\n\n')
	)

	fs.mkdirSync(outputDir, { recursive: true })
	fs.writeFileSync(path.resolve(CONFIG.cwd, CONFIG.outputPath), content)
	console.log(`Generated types: ${actions.length}`)
}

function toPascalCase(str: string) {
	return str.replace(/(^\w|-\w)/g, (text) => text.replace(/-/, '').toUpperCase())
}

run()
	.catch((err) => {
		console.error(err)
		process.exit(1)
	})