// import {glob} from 'glob';
import { Dev, RegisterRoute } from './index.ts'
// import * as path from "node:path"; // only available in dev.ts
//
// const files = await glob('./src/http/**/handler.{ts,js}', { cwd: process.cwd() });
// console.log(files);
// for (const file of files) {
//     console.log(1);
//     await import(path.join(process.cwd(), `./${file}`)); // <--- this is stupid because it requires dist to be available, need to tsc @osome/framework
// }
//
// Dev();

import * as path from 'node:path'

await import(path.join(process.cwd(), './src/dev.ts'))
const manifest = await import(path.join(process.cwd(), './src/manifest.ts'))

Object.keys(manifest).forEach(async (key) => {
  const mod = manifest[key]
  if (mod && typeof mod === 'object' && 'default' in mod) {
    RegisterRoute(mod.default)
  }
})

Dev()

// should be unified with api gateway openapi
// should be able to generate its own openapi spec
