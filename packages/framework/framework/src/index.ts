import {Hono} from 'hono'
// import {bodyLimit} from 'hono/body-limit'
import {secureHeaders} from 'hono/secure-headers'
import {logger} from 'hono/logger'
// import {requestId} from 'hono/request-id'
import {contextStorage} from 'hono/context-storage'
import {timing} from 'hono/timing'
import { serve } from '@hono/node-server'
import type {Handler} from "hono";
import * as Sentry from '@sentry/aws-serverless';

Sentry.init({
    dsn: 'https://f71b2ab44e84bdb69e08f098b48d7898@o1010530.ingest.us.sentry.io/4510220609257472',
    tracesSampleRate: 1.0,
});

const app = new Hono()

app.use(timing());
app.use(contextStorage())
app.use(logger())
app.use(secureHeaders())
// app.use('*', requestId())
// app.use('*', bodyLimit({
//     maxSize: 34000
// }))

export const MiddlewareGroup = {
    Default: () => {},
};

MiddlewareGroup.Default = () => {};

export function Route(route: string, handler: Handler) {
    console.log(2);
    app.get('/test2', async (c) => {
        return c.json({ test: 'ok' });
    })
    const [method, path] = route.split(' ') as [string, string];
    console.log(`registering ${method} ${path}`);
    (app as any)[method.toLowerCase()](path, handler);
    return { route, handler };
}

export function Dev() {

    app.get('/test', async (c) => {
        return c.json({ test: 'ok' });
    })

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

export class NikeHandler {
    private _versions: ((context: any) => Promise<void> | undefined)[] = [];
    private _route: string = '';
    private _middleware: ((context: any) => Promise<void>) | undefined;
    private _fn!: (context: any) => Promise<void>;
    static New(route: string) {
        return new NikeHandler(route);
    }

    constructor(route: string) {
        this._route = route;
    }

    Use(middleware: any) {
        this._middleware = middleware;
        return this;
    }

    Evaluate() {
        return this;
    }

    Before(fn: (context: any) => Promise<void>) {
        this._fn = fn;
        return this;
    }

    Version(versionModule: { default: (context: any) => Promise<void> }) {
        this._versions.push(versionModule.default);
        return this;
    }

    Final(fn: (context: any) => Promise<void>) {
        this._fn = fn;
        return this;
    }

    async then(resolve: () => void) {
        await this._fn(this._versions);
        await this._fn(this._route);
        await this._fn(this._middleware);
        resolve()
    }
}
