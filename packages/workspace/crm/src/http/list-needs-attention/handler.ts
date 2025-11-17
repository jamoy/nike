import {MiddlewareGroup, Handler} from '@osome/framework';

export default Handler.Route('GET  /_/1.0/workspace/crm/needs-attention')
    // the name in the RPC if we need to call it internally
    .As('ListNeedsAttention')

    // middlewares
    .Use(MiddlewareGroup.Default)

    // original implementation
    .Handler(async (c) => {
        return c.json({
            test: 5,
        });
    });