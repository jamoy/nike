// https://github.com/OsomePteLtd/server-toolkit/blob/main/src/app/app.ts
import type { HonoRequest } from 'hono'
import { z } from 'zod'
import jsonSchemaToZod from 'json-schema-to-zod'

export class Handler {
  private _versions: ((context: any) => Promise<void> | undefined)[] = []
  private _route: string = ''
  private _middleware: ((context: any) => Promise<void>) | undefined
  private _fn!: (context: any) => Promise<void>
  private _type: string
  private _label: string | undefined
  private _spec: {}

  static Route(route: string) {
    return new Handler('route', route)
  }

  static Event(event: string) {
    return new Handler('event', event)
  }

  static Cron(crontab: string) {
    return new Handler('cron', crontab)
  }

  static Task(task: string) {
    return new Handler('task', task)
  }

  constructor(type: string, route: string) {
    this._type = type
    this._route = route
  }

  // called when the handler is fully configured
  async then(resolve: () => void) {
    console.log(1)
    // await this._fn(this._route)
    // await this._fn(this._middleware)
    console.log(this._type, this._label)
    resolve()
  }

  // middleware to be used before the handler, it can be an array of hono middlewares
  Use(middleware: any) {
    this._middleware = middleware
    return this
  }

  // the exposed rpc label
  As(exposedRpcLabel: string) {
    this._label = exposedRpcLabel
    return this
  }

  // evaluate the state of the request, state is an object that can contain flags, auth, and request metadata
  Evaluate(evaluator: (state: any) => Promise<void>) {
    const state = {}
    console.log(evaluator(state)) // add to the evaluator later in the chain
    return this
  }

  // runs before the handler and versions
  Before(fn: (context: any) => Promise<void>) {
    this._versions.push(versionModule.default)
    return this
  }

  // versions of the handler received as an array, same signature as Handler
  Version(version: string, versionModule: { default: (context: any) => Promise<void> }) {
    this._versions.push(versionModule.default)
    return this
  }

  // the actual base handler, superceded by versions
  Handler(fn: (context: any) => Promise<void>) {
    this._fn = fn
    return this
  }

  // assertion that checks if this handler is triggered by some event
  Triggers(triggers: string[]) {
    // this is the list of triggers this handler triggers to
    if (this._type === 'event') {
      // evaluate this
      console.log(triggers)
    }
    return this
  }

  // assertion that checks if a downstream handler is invoked
  Invokes(invokes: string[]) {
    // this is the list of events that this handler invokes. used for documentation.
    if (this._type === 'event') {
      // evaluate this
      console.log(invokes)
    }
    return this
  }

  // use to add tags to the handler for openapi docs
  Tags(tags: string[]) {
    console.log(tags)
    return this
  }

  // use to add description to the handler for openapi docs
  Description(description: string) {
    console.log(description)
    return this
  }

  // mark the handler as cacheable
  Cached() {
    return this
  }

  // a mutator of the request object
  __UnsafeHttpRequestMutator(mutator: (req: HonoRequest) => Promise<any>) {
    console.log(mutator({} as HonoRequest))
    return this
  }

  // validate the http body using jsonschema
  ValidateHttpBodyRequest(validator: any) {
    console.log(validator)
    return this
  }

  // validate the params header using jsonschema
  ValidateHttpParamsRequest(validator: any) {
    this._spec = jsonSchemaToZod(validator, { module: 'esm' })
    return this
  }

  // validate the http header using jsonschema
  ValidateHttpHeadersRequest(validator: any) {
    console.log(validator)
    return this
  }

  // validate the response for openapi schema
  Response(statusCode: number, schema: any) {
    console.log(statusCode, schema)
    return this
  }
}
