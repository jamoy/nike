import {Hono} from 'hono'
// import {bodyLimit} from 'hono/body-limit'
import {secureHeaders} from 'hono/secure-headers'
import {logger} from 'hono/logger'
// import {requestId} from 'hono/request-id'
import {contextStorage} from 'hono/context-storage'
import {timing} from 'hono/timing'
// import {sentry} from '@hono/sentry'
import { serve } from '@hono/node-server'
import type {Handler} from "hono";

const app = new Hono()

app.use(timing());
app.use(contextStorage())
app.use(logger())
app.use(secureHeaders())
// app.use('*', sentry())
// app.use('*', requestId())
// app.use('*', bodyLimit({
//     maxSize: 34000
// }))

export function Route(route: string, handler: Handler) {
    app.get(route.split(' ').at(1)!, handler)
    return { test: 1, route, handler };
}

export function Start() {
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