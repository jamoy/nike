// https://github.com/OsomePteLtd/server-toolkit/blob/main/src/app/app.ts
import type { HonoRequest } from 'hono'
import { z } from 'zod'
import jsonSchemaToZod from 'json-schema-to-zod'

export class Handler<TContext extends HandlerContext = HandlerContext> {
  private _versions: HandlerVersion<TContext>[] = []
  private _route: string = ''
  private _middleware: HandlerMiddleware<TContext> | undefined
  private _fn!: (context: TContext) => Promise<void>
  private _type: string
  private _label: string | undefined
  private _beforeHandlers: HandlerMiddleware<TContext>[] = []
  private _evaluator: StateEvaluator | undefined
  private _triggers: string[] = []
  private _invokes: string[] = []
  private _tags: string[] = []
  private _description: string | undefined
  private _isCached: boolean = false
  private _requestMutator: RequestMutator | undefined
  private _bodyValidator: ValidatorSchema | undefined
  private _paramsValidator: ValidatorSchema | undefined
  private _headersValidator: ValidatorSchema | undefined
  private _responses: ResponseSchema[] = []

  static Route(route: string): Handler {
    return new Handler('route', route)
  }

  static Event(event: string): Handler {
    return new Handler('event', event)
  }

  static Cron(crontab: string): Handler {
    return new Handler('cron', crontab)
  }

  static Task(task: string): Handler {
    return new Handler('task', task)
  }

  constructor(type: string, route: string) {
    this._type = type
    this._route = route
  }

  // Make the handler thenable so it can be awaited
  async then(
    resolve: (value?: unknown) => void,
    reject?: (reason?: unknown) => void
  ): Promise<void> {
    try {
      // Execute the handler registration/initialization logic
      const manifest = await this._initialize()
      resolve(manifest)
    } catch (error) {
      reject?.(error)
    }
  }

  private async _initialize(): Promise<void> {
    // This is where you would register the handler with your framework
    // For now, we'll just validate the configuration
    if (!this._fn && this._versions.length === 0) {
      throw new Error(`Handler for ${this._type} "${this._route}" has no implementation`)
    }

    // Log the configuration for debugging
    return {
      type: this._type,
      route: this._route,
      label: this._label,
      hasMiddleware: !!this._middleware,
      hasEvaluator: !!this._evaluator,
      beforeHandlers: this._beforeHandlers.length,
      versions: this._versions.length,
      hasMainHandler: !!this._fn,
      triggers: this._triggers,
      invokes: this._invokes,
      tags: this._tags,
      description: this._description,
      isCached: this._isCached,
      hasValidation: {
        body: !!this._bodyValidator,
        params: !!this._paramsValidator,
        headers: !!this._headersValidator,
      },
      responses: this._responses.length,
    }
  }

  // Execute the full handler chain
  async execute(
    request: HonoRequest,
    initialContext: Partial<TContext> = {}
  ): Promise<TContext> {
    const context: TContext = {
      request,
      state: {},
      ...initialContext,
    } as TContext

    try {
      // 1. Run request mutator if present
      if (this._requestMutator) {
        const mutated = await this._requestMutator(request)
        Object.assign(context, mutated)
      }

      // 2. Run middleware
      if (this._middleware) {
        await this._middleware(context)
      }

      // 3. Run evaluator
      if (this._evaluator) {
        await this._evaluator(context.state)
      }

      // 4. Validate request
      await this._validateRequest(context)

      // 5. Run before handlers
      for (const beforeHandler of this._beforeHandlers) {
        await beforeHandler(context)
      }

      // 6. Run versioned handler or main handler
      const handler = this._selectHandler(context)
      await handler(context)

      return context
    } catch (error) {
      console.error(`Error executing handler ${this._type} "${this._route}":`, error)
      throw error
    }
  }

  private async _validateRequest(context: TContext): Promise<void> {
    // Validate body
    if (this._bodyValidator) {
      const bodyData = await context.request.json().catch(() => ({}))
      if (this._bodyValidator.zodSchema) {
        const result = this._bodyValidator.zodSchema.safeParse(bodyData)
        if (!result.success) {
          throw new Error(`Body validation failed: ${result.error.message}`)
        }
        context.body = result.data
      }
    }

    // Validate params
    if (this._paramsValidator) {
      const params = context.params || {}
      if (this._paramsValidator.zodSchema) {
        const result = this._paramsValidator.zodSchema.safeParse(params)
        if (!result.success) {
          throw new Error(`Params validation failed: ${result.error.message}`)
        }
        context.params = result.data
      }
    }

    // Validate headers
    if (this._headersValidator) {
      const headers = Object.fromEntries(context.request.headers.entries())
      if (this._headersValidator.zodSchema) {
        const result = this._headersValidator.zodSchema.safeParse(headers)
        if (!result.success) {
          throw new Error(`Headers validation failed: ${result.error.message}`)
        }
        context.headers = result.data
      }
    }
  }

  private _selectHandler(context: TContext): (context: TContext) => Promise<void> {
    // Check if there's a version header or param
    const requestedVersion =
      (context.headers as Record<string, string> | undefined)?.[
        'x-api-version'
        ] || (context.params as Record<string, string> | undefined)?.version

    if (requestedVersion && this._versions.length > 0) {
      const versionHandler = this._versions.find(v => v.version === requestedVersion)
      if (versionHandler) {
        return versionHandler.handler
      }
    }

    // Return the latest version if available, otherwise the main handler
    if (this._versions.length > 0) {
      return this._versions[this._versions.length - 1].handler
    }

    return this._fn
  }

  // Middleware to be used before the handler
  Use(middleware: HandlerMiddleware<TContext>): this {
    this._middleware = middleware
    return this
  }

  // The exposed RPC label
  As(exposedRpcLabel: string): this {
    this._label = exposedRpcLabel
    return this
  }

  // Evaluate the state of the request
  Evaluate(evaluator: StateEvaluator): this {
    this._evaluator = evaluator
    return this
  }

  // Runs before the handler and versions
  Before(fn: HandlerMiddleware<TContext>): this {
    this._beforeHandlers.push(fn)
    return this
  }

  // Versions of the handler
  Version(
    version: string,
    versionModule: { default: (context: TContext) => Promise<void> }
  ): this {
    this._versions.push({
      version,
      handler: versionModule.default,
    })
    return this
  }

  // The actual base handler, superseded by versions
  Handler(fn: (context: TContext) => Promise<void>): this {
    this._fn = fn
    return this
  }

  // Assertion that checks if this handler is triggered by some event
  Triggers(triggers: string[]): this {
    if (this._type === 'event') {
      this._triggers = triggers
      // You could add validation logic here to ensure the triggers exist
    }
    return this
  }

  // Assertion that checks if a downstream handler is invoked
  Invokes(invokes: string[]): this {
    if (this._type === 'event') {
      this._invokes = invokes
      // You could add validation logic here to ensure the invokes exist
    }
    return this
  }

  // Add tags to the handler for OpenAPI docs
  Tags(tags: string[]): this {
    this._tags = tags
    return this
  }

  // Add description to the handler for OpenAPI docs
  Description(description: string): this {
    this._description = description
    return this
  }

  // Mark the handler as cacheable
  Cached(): this {
    this._isCached = true
    return this
  }

  // A mutator of the request object
  __UnsafeHttpRequestMutator(mutator: RequestMutator): this {
    this._requestMutator = mutator
    return this
  }

  // Validate the HTTP body using JSON schema
  ValidateHttpBodyRequest(validator: JSONSchema): this {
    this._bodyValidator = {
      schema: validator,
      zodSchema: this._convertToZod(validator),
    }
    return this
  }

  // Validate the params using JSON schema
  ValidateHttpParamsRequest(validator: JSONSchema): this {
    this._paramsValidator = {
      schema: validator,
      zodSchema: this._convertToZod(validator),
    }
    return this
  }

  // Validate the HTTP headers using JSON schema
  ValidateHttpHeadersRequest(validator: JSONSchema): this {
    this._headersValidator = {
      schema: validator,
      zodSchema: this._convertToZod(validator),
    }
    return this
  }

  // Validate the response for OpenAPI schema
  Response(statusCode: number, schema: JSONSchema): this {
    this._responses.push({ statusCode, schema })
    return this
  }

  private _convertToZod(jsonSchema: JSONSchema): z.ZodSchema {
    try {
      // Convert JSON Schema to Zod
      const zodCode = jsonSchemaToZod(jsonSchema, { module: 'esm' })
      // This would need to be evaluated to get the actual Zod schema
      // For now, we'll use a basic conversion
      return this._basicJsonSchemaToZod(jsonSchema)
    } catch (error) {
      console.error('Error converting JSON schema to Zod:', error)
      return z.any()
    }
  }

  private _basicJsonSchemaToZod(jsonSchema: JSONSchema): z.ZodSchema {
    // Handle enum type first
    if ('enum' in jsonSchema && jsonSchema.enum) {
      const [first, ...rest] = jsonSchema.enum as [string | number, ...(string | number)[]]
      return z.enum([String(first), ...rest.map(String)] as [string, ...string[]])
    }

    if ('type' in jsonSchema) {
      if (jsonSchema.type === 'object') {
        const shape: Record<string, z.ZodSchema> = {}
        const properties = jsonSchema.properties || {}

        for (const [key, value] of Object.entries(properties)) {
          shape[key] = this._basicJsonSchemaToZod(value)
        }

        let objectSchema = z.object(shape)

        if (jsonSchema.required && jsonSchema.required.length > 0) {
          // Mark non-required fields as optional
          const optionalKeys = Object.keys(shape).filter(
            key => !jsonSchema.required?.includes(key)
          )

          if (optionalKeys.length > 0) {
            objectSchema = objectSchema.partial(
              Object.fromEntries(optionalKeys.map(k => [k, true]))
            ) as z.ZodObject<typeof shape>
          }
        } else {
          // If no required fields specified, all are optional
          objectSchema = objectSchema.partial()
        }

        return objectSchema
      } else if (jsonSchema.type === 'string') {
        let schema = z.string()

        if (jsonSchema.minLength !== undefined) {
          schema = schema.min(jsonSchema.minLength)
        }
        if (jsonSchema.maxLength !== undefined) {
          schema = schema.max(jsonSchema.maxLength)
        }
        if (jsonSchema.pattern) {
          schema = schema.regex(new RegExp(jsonSchema.pattern))
        }
        if (jsonSchema.format === 'email') {
          schema = z.string().email()
        }
        if (jsonSchema.format === 'uuid') {
          schema = z.string().uuid()
        }
        if (jsonSchema.format === 'uri') {
          schema = z.string().url()
        }
        if (jsonSchema.enum && jsonSchema.enum.length > 0) {
          const [first, ...rest] = jsonSchema.enum as [string, ...string[]]
          return z.enum([first, ...rest])
        }

        return schema
      } else if (jsonSchema.type === 'number' || jsonSchema.type === 'integer') {
        let schema = jsonSchema.type === 'integer' ? z.number().int() : z.number()

        if (jsonSchema.minimum !== undefined) {
          schema = schema.min(jsonSchema.minimum)
        }
        if (jsonSchema.maximum !== undefined) {
          schema = schema.max(jsonSchema.maximum)
        }
        if (jsonSchema.exclusiveMinimum !== undefined) {
          schema = schema.gt(jsonSchema.exclusiveMinimum)
        }
        if (jsonSchema.exclusiveMaximum !== undefined) {
          schema = schema.lt(jsonSchema.exclusiveMaximum)
        }

        return schema
      } else if (jsonSchema.type === 'boolean') {
        return z.boolean()
      } else if (jsonSchema.type === 'array') {
        const itemSchema = jsonSchema.items
          ? this._basicJsonSchemaToZod(jsonSchema.items)
          : z.unknown()

        let schema = z.array(itemSchema)

        if (jsonSchema.minItems !== undefined) {
          schema = schema.min(jsonSchema.minItems)
        }
        if (jsonSchema.maxItems !== undefined) {
          schema = schema.max(jsonSchema.maxItems)
        }

        return schema
      }
    }

    return z.unknown()
  }

  // Generate OpenAPI specification for this handler
  toOpenAPISpec(): OpenAPISpec | null {
    if (this._type !== 'route') {
      return null // Only routes have OpenAPI specs
    }

    const spec: OpenAPISpec = {
      summary: this._description || `${this._type} ${this._route}`,
      tags: this._tags,
      operationId: this._label,
      responses: {},
    }

    // Add parameters from validation
    if (this._paramsValidator && 'properties' in this._paramsValidator.schema) {
      const properties = this._paramsValidator.schema.properties || {}
      spec.parameters = Object.entries(properties).map(([name, schema]) => ({
        name,
        in: 'path' as const,
        required: this._paramsValidator?.schema.required?.includes(name) || false,
        schema: schema as JSONSchema,
      }))
    }

    // Add request body from validation
    if (this._bodyValidator) {
      spec.requestBody = {
        required: true,
        content: {
          'application/json': {
            schema: this._bodyValidator.schema,
          },
        },
      }
    }

    // Add responses
    if (this._responses.length > 0) {
      for (const response of this._responses) {
        spec.responses[response.statusCode] = {
          description: `Response ${response.statusCode}`,
          content: {
            'application/json': {
              schema: response.schema,
            },
          },
        }
      }
    }

    return spec
  }

  // Get metadata about the handler
  getMetadata(): HandlerMetadata {
    return {
      type: this._type,
      route: this._route,
      label: this._label,
      triggers: this._triggers,
      invokes: this._invokes,
      tags: this._tags,
      description: this._description,
      isCached: this._isCached,
      hasMiddleware: !!this._middleware,
      hasEvaluator: !!this._evaluator,
      beforeHandlers: this._beforeHandlers.length,
      versions: this._versions.map(v => v.version),
      hasMainHandler: !!this._fn,
      validation: {
        body: !!this._bodyValidator,
        params: !!this._paramsValidator,
        headers: !!this._headersValidator,
      },
      responses: this._responses.map(r => r.statusCode),
    }
  }
}
