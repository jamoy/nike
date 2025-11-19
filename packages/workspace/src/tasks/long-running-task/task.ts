import {Handler} from '@osome/framework';

export default Handler.Task('long_running_task')
    .Handler(async (c) => {
        return c.json({
            test: 5,
        });
    });