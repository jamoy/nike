// https://kysely.dev/docs/category/examples
import {Db} from '@osome/framework/db';

export type SelectAccountProjectsQuery = {
  id: string;
}

export default Query(async (opts: SelectAccountProjectsQuery, context) => {
  return Db.selectFrom('projects')
    .selectFrom('person')
    .select(['id', 'first_name'])
    .where('id', '=', opts.id)
    .executeTakeFirst()
})
