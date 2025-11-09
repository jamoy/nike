import {glob} from 'glob';
import { Start } from '@osome/framework';

const files = await glob('./http/**/handler.ts', { cwd: import.meta.dirname });
for (const file of files) {
    await import(`./${file}`); // <--- this is stupid because it requires dist to be available, need to tsc @osome/framework
}
Start();
