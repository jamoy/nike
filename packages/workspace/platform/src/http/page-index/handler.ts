import { Route } from '@osome/framework';
// import { Endpoints as WorkspaceCrmEndpoints } from '@osome/workspace-crm';

export default Route('GET /_/1.0/workspace/dashboard', async (c) => {
    // const sequence = await Promise.all([
    //     WorkspaceCrmEndpoints.ListNeedsAttention(c),
    // ])
    // c.json(sequence[0])

    // ? how do we invoke the other endpoints without going through http.
    return c.json({
        test: 1,
    });
});
