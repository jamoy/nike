import { Dev, GetApp, Handler } from './index.ts'

import * as path from 'node:path'

let config = {}

// load the dev bootstrap
const devModule = await import(path.join(process.cwd(), './src/dev.ts'))
if (typeof devModule.default === 'function' || devModule.constructor.name === 'AsyncFunction') {
  const override = await devModule.default(config)
  if (override) {
    config = override
  }
}

const manifest = await import(path.join(process.cwd(), './src/manifest.ts'))

const app = GetApp();

Object.keys(manifest).forEach(async (key) => {
  const mod = manifest[key]
  if (mod && typeof mod === 'object' && 'default' in mod) {
    Handler.RegisterRoute(app, mod.default, config)
  }
})

Dev()

// should be unified with api gateway openapi
// should be able to generate its own openapi spec
