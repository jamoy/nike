import {glob} from 'glob';
import { Start } from '@osome/framework';

const files = await glob('./http/**/handler.ts', { cwd: import.meta.dirname });
for (const file of files) {
    console.log(await import(`./${file}`)); // Adjust the path as necessary
}
Start();
