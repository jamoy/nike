import { MiddlewareGroup, Handler } from '@osome/framework'
// import SDK from '@osome/sdk';

export default Handler.Route('GET /_/1.0/workspace/dashboard')
  // description showing in openapi docs and types
  .Description('Retrieve the workspace dashboard')

  // tags that can be used for grouping, filtering in docs, cost, and caching
  .Tags(['Workspace', 'CRM', 'Dashboard'])

  // the name in the RPC if we need to call it internally
  .As('ListDashboard')

  // middlewares
  .Use(MiddlewareGroup.Default)

  // if it needs to be cached
  .Cached()

  // flags, auth
  .Evaluate(async (state) => {
    if (state.flags.enabled('new-dashboard-PF-2330')) {
      throw new Error('this dashboard shouldnt be available yet')
    }
    if (!state.authenticated) {
      throw new Error('what are you doing here?')
    }
    if (!state.claims.includes('workspace.crm')) {
      throw new Error('not available yet')
    }
  })

  // validate the body using jsonschema
  .ValidateHttpBodyRequest({})

  // validate the headers using jsonschema
  .ValidateHttpHeadersRequest({})

  // validate the params using jsonschema
  .ValidateHttpParamsRequest({})

  // if we want to actually mutate the request right before we run the handlers, before Before
  .__UnsafeHttpRequestMutator(async (req) => {
    return req
  })

  // anything before versions
  .Before(async (c) => {
    return c.json({
      test: 5,
    })
  })

  // original implementation
  .Handler(async (c) => {
    // const list = await SDK.Workspace.Crm.ListNeedsAttention();
    return c.json({
      test: 5,
    })
  })

  // an assertion that logs an even if this is breached.
  .Invokes([
    'workspace.dashboard.viewed',
  ])

  // response schema validation
  .Response(200, {})
