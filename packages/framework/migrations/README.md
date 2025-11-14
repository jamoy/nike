when migrate runs as a task:

1. gets all new migration files from any migrations directory. get the db name to run against
2. runs the migrations in order based on the timestamp in the filename

if adding a new migration file, make sure to give it a unique timestamp so it runs in the correct order

1. create a new file in the migrations directory with the current timestamp and a descriptive name