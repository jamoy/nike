// Test suite for Handler implementation
import { Handler } from './handler.ts'

// Mock HonoRequest for testing
class MockHonoRequest {
  private _headers: Map<string, string>
  private _body: any

  constructor(options: { headers?: Record<string, string>, body?: any } = {}) {
    this._headers = new Map(Object.entries(options.headers || {}))
    this._body = options.body
  }

  get headers() {
    return this._headers
  }

  async json() {
    return this._body
  }
}

async function runTests() {
  console.log('=== Handler Implementation Tests ===\n')

  // Test 1: Basic handler execution
  console.log('Test 1: Basic Handler Execution')
  try {
    const handler = Handler.Route('/api/test')
      .Handler(async (context) => {
        context.result = 'success'
      })

    await handler

    const request = new MockHonoRequest() as any
    const result = await handler.execute(request)
    console.log('✓ Basic handler executed successfully')
    console.log('  Result:', result.result)
  }
  catch (error) {
    console.error('✗ Test 1 failed:', error)
  }

  // Test 2: Handler with middleware
  console.log('\nTest 2: Handler with Middleware')
  try {
    const executionOrder: string[] = []

    const handler = Handler.Route('/api/middleware-test')
      .Use(async (context) => {
        executionOrder.push('middleware')
        context.middlewareRan = true
      })
      .Handler(async (context) => {
        executionOrder.push('handler')
        context.handlerRan = true
      })

    await handler

    const request = new MockHonoRequest() as any
    const result = await handler.execute(request)

    console.log('✓ Middleware executed successfully')
    console.log('  Execution order:', executionOrder)
    console.log('  Middleware ran:', result.middlewareRan)
    console.log('  Handler ran:', result.handlerRan)
  }
  catch (error) {
    console.error('✗ Test 2 failed:', error)
  }

  // Test 3: Handler with evaluator
  console.log('\nTest 3: Handler with Evaluator')
  try {
    const handler = Handler.Route('/api/evaluator-test')
      .Evaluate(async (state) => {
        state.evaluated = true
        state.timestamp = Date.now()
      })
      .Handler(async (context) => {
        context.evaluatorState = context.state
      })

    await handler

    const request = new MockHonoRequest() as any
    const result = await handler.execute(request)

    console.log('✓ Evaluator executed successfully')
    console.log('  State:', result.evaluatorState)
  }
  catch (error) {
    console.error('✗ Test 3 failed:', error)
  }

  // Test 4: Handler with before hooks
  console.log('\nTest 4: Handler with Before Hooks')
  try {
    const executionOrder: string[] = []

    const handler = Handler.Route('/api/before-test')
      .Before(async (context) => {
        executionOrder.push('before-1')
      })
      .Before(async (context) => {
        executionOrder.push('before-2')
      })
      .Handler(async (context) => {
        executionOrder.push('handler')
      })

    await handler

    const request = new MockHonoRequest() as any
    await handler.execute(request)

    console.log('✓ Before hooks executed successfully')
    console.log('  Execution order:', executionOrder)
  }
  catch (error) {
    console.error('✗ Test 4 failed:', error)
  }

  // Test 5: Handler with body validation (success)
  console.log('\nTest 5: Handler with Body Validation (Success)')
  try {
    const handler = Handler.Route('/api/validation-test')
      .ValidateHttpBodyRequest({
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          age: { type: 'number', minimum: 18 },
        },
        required: ['email', 'age'],
      })
      .Handler(async (context) => {
        context.validatedBody = context.body
      })

    await handler

    const request = new MockHonoRequest({
      body: {
        email: 'test@example.com',
        age: 25,
      },
    }) as any

    const result = await handler.execute(request)

    console.log('✓ Body validation passed')
    console.log('  Validated body:', result.validatedBody)
  }
  catch (error) {
    console.error('✗ Test 5 failed:', error)
  }

  // Test 6: Handler with body validation (failure)
  console.log('\nTest 6: Handler with Body Validation (Failure)')
  try {
    const handler = Handler.Route('/api/validation-fail-test')
      .ValidateHttpBodyRequest({
        type: 'object',
        properties: {
          email: { type: 'string', format: 'email' },
          age: { type: 'number', minimum: 18 },
        },
        required: ['email', 'age'],
      })
      .Handler(async (context) => {
        context.validatedBody = context.body
      })

    await handler

    const request = new MockHonoRequest({
      body: {
        email: 'invalid-email',
        age: 15, // Below minimum
      },
    }) as any

    await handler.execute(request)
    console.error('✗ Test 6 failed: Validation should have failed')
  }
  catch (error) {
    console.log('✓ Body validation correctly rejected invalid data')
    console.log('  Error:', (error as Error).message)
  }

  // Test 7: Versioned handler
  console.log('\nTest 7: Versioned Handler')
  try {
    const handler = Handler.Route('/api/versioned')
      .Version('v1', {
        default: async (context) => {
          context.version = 'v1'
          context.result = 'v1 response'
        },
      })
      .Version('v2', {
        default: async (context) => {
          context.version = 'v2'
          context.result = 'v2 response'
        },
      })
      .Handler(async (context) => {
        context.version = 'default'
        context.result = 'default response'
      })

    await handler

    // Test v1
    const requestV1 = new MockHonoRequest({
      headers: { 'x-api-version': 'v1' },
    }) as any
    const resultV1 = await handler.execute(requestV1)
    console.log('  V1 Result:', resultV1.result)

    // Test v2
    const requestV2 = new MockHonoRequest({
      headers: { 'x-api-version': 'v2' },
    }) as any
    const resultV2 = await handler.execute(requestV2)
    console.log('  V2 Result:', resultV2.result)

    // Test default (no version header)
    const requestDefault = new MockHonoRequest() as any
    const resultDefault = await handler.execute(requestDefault)
    console.log('  Default Result:', resultDefault.result)

    console.log('✓ Versioned handler executed successfully')
  }
  catch (error) {
    console.error('✗ Test 7 failed:', error)
  }

  // Test 8: Full execution chain
  console.log('\nTest 8: Full Execution Chain')
  try {
    const executionOrder: string[] = []

    const handler = Handler.Route('/api/full-chain')
      .Use(async (context) => {
        executionOrder.push('middleware')
      })
      .Evaluate(async (state) => {
        executionOrder.push('evaluator')
      })
      .Before(async (context) => {
        executionOrder.push('before-1')
      })
      .Before(async (context) => {
        executionOrder.push('before-2')
      })
      .ValidateHttpBodyRequest({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        required: ['name'],
      })
      .Handler(async (context) => {
        executionOrder.push('handler')
        context.finalOrder = executionOrder
      })

    await handler

    const request = new MockHonoRequest({
      body: { name: 'Test' },
    }) as any

    const result = await handler.execute(request)

    console.log('✓ Full execution chain completed')
    console.log('  Execution order:', result.finalOrder)
  }
  catch (error) {
    console.error('✗ Test 8 failed:', error)
  }

  // Test 9: OpenAPI spec generation
  console.log('\nTest 9: OpenAPI Spec Generation')
  try {
    const handler = Handler.Route('/api/users/:id')
      .Tags(['users', 'public'])
      .Description('Get user by ID')
      .As('user.get')
      .ValidateHttpParamsRequest({
        type: 'object',
        properties: {
          id: { type: 'string' },
        },
        required: ['id'],
      })
      .ValidateHttpBodyRequest({
        type: 'object',
        properties: {
          includeDetails: { type: 'boolean' },
        },
      })
      .Response(200, {
        type: 'object',
        properties: {
          id: { type: 'string' },
          name: { type: 'string' },
          email: { type: 'string' },
        },
      })
      .Response(404, {
        type: 'object',
        properties: {
          error: { type: 'string' },
        },
      })
      .Handler(async (context) => {})

    await handler

    const spec = handler.toOpenAPISpec()
    console.log('✓ OpenAPI spec generated')
    console.log('  Spec:', JSON.stringify(spec, null, 2))
  }
  catch (error) {
    console.error('✗ Test 9 failed:', error)
  }

  // Test 10: Handler metadata
  console.log('\nTest 10: Handler Metadata')
  try {
    const handler = Handler.Event('user.created')
      .Tags(['events', 'users'])
      .Description('Handle user creation event')
      .As('user.created.handler')
      .Triggers(['user.created'])
      .Invokes(['email.send', 'analytics.track'])
      .Cached()
      .Before(async (context) => {})
      .Before(async (context) => {})
      .Version('v1', {
        default: async (context) => {},
      })
      .Handler(async (context) => {})

    await handler

    const metadata = handler.getMetadata()
    console.log('✓ Metadata retrieved')
    console.log('  Metadata:', JSON.stringify(metadata, null, 2))
  }
  catch (error) {
    console.error('✗ Test 10 failed:', error)
  }

  console.log('\n=== All Tests Completed ===')
}

// Run all tests
runTests().catch(console.error)
