// https://github.com/OsomePteLtd/server-toolkit/blob/main/src/app/app.ts
import type { HonoRequest } from 'hono'

export class Handler {
  private _versions: ((context: any) => Promise<void> | undefined)[] = []
  private _route: string = ''
  private _middleware: ((context: any) => Promise<void>) | undefined
  private _fn!: (context: any) => Promise<void>
  private _type: string
  private _label: string | undefined

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

  async then(resolve: () => void) {
    console.log(1)
    // await this._fn(this._route)
    // await this._fn(this._middleware)
    console.log(this._type, this._label)
    resolve()
  }

  Use(middleware: any) {
    this._middleware = middleware
    return this
  }

  As(exposedRpcLabel: string) {
    this._label = exposedRpcLabel
    return this
  }

  Evaluate(evaluator: (state: any) => Promise<void>) {
    const state = {}
    console.log(evaluator(state)) // add to the evaluator later in the chain
    return this
  }

  Before(fn: (context: any) => Promise<void>) {
    this._versions.push(versionModule.default)
    return this
  }

  Version(version: string, versionModule: { default: (context: any) => Promise<void> }) {
    this._versions.push(versionModule.default)
    return this
  }

  Handler(fn: (context: any) => Promise<void>) {
    this._fn = fn
    return this
  }

  Triggers(triggers: string[]) {
    // this is the list of triggers this handler triggers to
    if (this._type === 'event') {
      // evaluate this
      console.log(triggers)
    }
    return this
  }

  Invokes(invokes: string[]) {
    // this is the list of events that this handler invokes. used for documentation.
    if (this._type === 'event') {
      // evaluate this
      console.log(invokes)
    }
    return this
  }

  Tags(tags: string[]) {
    console.log(tags)
    return this
  }

  Description(description: string) {
    console.log(description)
    return this
  }

  Cached() {
    return this
  }

  __UnsafeHttpRequestMutator(mutator: (req: HonoRequest) => Promise<any>) {
    console.log(mutator({} as HonoRequest))
    return this
  }

  ValidateHttpBodyRequest(validator: any) {
    console.log(validator)
    return this
  }

  ValidateHttpParamsRequest(validator: any) {
    console.log(validator)
    return this
  }

  ValidateHttpHeadersRequest(validator: any) {
    console.log(validator)
    return this
  }

  Response(statusCode: number, schema: any) {
    console.log(statusCode, schema)
    return this
  }
}
