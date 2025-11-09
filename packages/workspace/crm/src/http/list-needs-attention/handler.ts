import { Route } from '@osome/framework';

export default Route('GET /_/1.0/workspace/crm/needs-attention', async (c) => {
    c.json({
        test: 1
    })
});
