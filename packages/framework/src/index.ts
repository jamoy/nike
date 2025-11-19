import { Hono } from 'hono'
// import {bodyLimit} from 'hono/body-limit'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { contextStorage } from 'hono/context-storage'
import { timing } from 'hono/timing'
import { handle } from 'hono/aws-lambda'
// import * as Sentry from '@sentry/aws-serverless';
export { z } from 'zod'
// import {Resource} from "sst";
// import {task} from "sst/aws/task";

// Sentry.init({
//     dsn: 'https://f71b2ab44e84bdb69e08f098b48d7898@o1010530.ingest.us.sentry.io/4510220609257472',
//     tracesSampleRate: 1.0,
// });

const app = new Hono()

app.use(timing())
app.use(contextStorage())
app.use(logger())
app.use(secureHeaders())
app.use('*', requestId())
// app.use('*', bodyLimit({
//     maxSize: 34000
// }))

export const MiddlewareGroup = {
  Default: () => {
  },
}

MiddlewareGroup.Default = () => {
}

export function RegisterRoute(route: any) {
  console.log('Registering route:', route._route)
  const [method, path] = route._route.split(' ')
  console.log(route)
  app[method.toLowerCase()](path, route._fn)
}

export async function Dev() {
  if (!process.env['AWS_EXECUTION_ENV']) {
    const { serve } = await import('@hono/node-server')
    const server = serve({
      fetch: app.fetch,
      port: 8787,
    })
    // graceful shutdown
    process.on('SIGINT', () => {
      server.close()
      process.exit(0)
    })
    process.on('SIGTERM', () => {
      server.close((err) => {
        if (err) {
          console.error(err)
          process.exit(1)
        }
        process.exit(0)
      })
    })
  }
}

export { Handler } from './handler.ts'

export const handler = handle(app)
