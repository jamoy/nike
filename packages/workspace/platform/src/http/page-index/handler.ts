import { Route } from '@osome/framework';

export default await Route('GET /v1/page', async (c) => {
    c.text('Hono!');
});
