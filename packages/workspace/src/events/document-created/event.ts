import {Handler} from '@osome/framework';

export default Handler.Event('document.created')
    .Triggers([
        'API:Workspace.Crm.ListNeedsAttention'
    ])
    .Handler(async (c) => {
        return c.json({
            test: 5,
        });
    })
    .Invokes([
        'document.created-finalize',
    ]);