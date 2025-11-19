import {Handler} from '@osome/framework';

export default Handler.Cron('every 15 minutes')
    .Handler(async (c) => {
        return c.json({
            test: 5,
        });
    });