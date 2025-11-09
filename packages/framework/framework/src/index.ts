import {Hono} from 'hono'
import { bodyLimit } from 'hono/body-limit'
import { secureHeaders } from 'hono/secure-headers'
import { logger } from 'hono/logger'
import { requestId } from 'hono/request-id'
import { contextStorage } from 'hono/context-storage'
import { timing } from 'hono/timing'
import { sentry } from '@hono/sentry'
import type {Handler} from "hono";

const app = new Hono()

app.use(timing());
app.use(contextStorage())
app.use(logger())
app.use(secureHeaders())
app.use('*', sentry())
app.use('*', requestId())
app.use('*', bodyLimit({
    maxSize: 34000
}))

export async function Route(route: string, handler: Handler) {
    app.get(route, handler)
}