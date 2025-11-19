running pnpm dev should run
1. workspace/app - next
2. workspace/platform - orchestration of serverless and tasks

running sst deploy workspace
1. runs sst deploy for everything in workspace

running osome migrate
1. runs all new migrations in workspace/**/migrations


pnpm dev = runs everything
pnpm dev --only nextsome,workspace = runs only specified packages


goals
1. create the framework skeleton
2. allow local development
3. create the migration path
4. create the deployment path with sst
5. create spa deployment path
6. create authentication path


uses the frappe model
