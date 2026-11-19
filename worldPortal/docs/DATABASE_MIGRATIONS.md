# Database migrations

The database shape is defined in `prisma/schema.prisma`. The folders in
`prisma/migrations/` are the history of SQL changes that build that shape.
Prisma records which ones have run in a table called `_prisma_migrations`.

## How a deploy works

The Docker image runs this on every start, before the app boots:

```bash
npx prisma migrate deploy
```

It applies, in order, every migration the database has not run yet, and does
nothing if the database is already up to date. If a migration fails, the app
does not start, and the error is in the container log.

To check a database without changing it:

```bash
npx prisma migrate status        # which migrations have run, which are pending
npx prisma migrate diff --from-url "$DATABASE_URL" \
  --to-schema-datamodel prisma/schema.prisma --exit-code
# exit code 0 = the database matches the schema, 2 = it differs
```

## The migrations so far

| Migration | What it does |
|---|---|
| `20260827000000_payment_engine_setup` | The original baseline: profiles, visa applications and the payment tables. |
| `20261119000000_sync_schema` | Catches the history up with the schema: passports, agencies, hire, bank accounts, notifications, applicants and the newer columns. |
| `20261119000100_payment_transaction_notes` | Adds `PaymentTransaction.notes`. |

For a long time the schema was applied with `prisma db push`, which changes the
database without writing a migration. So the two newer migrations check before
they act: they only create the tables, columns, indexes, enums and foreign keys
that are missing, and change nothing that already exists. That makes them safe on
a fresh database, on one that only ran the baseline, and on one built with
`db push`.

One exception: the old `Gender` value `OTHER` is removed. If any row still uses
it, the migration stops with a message naming the table and applies nothing.
Change those rows to `MALE` or `FEMALE`, then run the commands below.

```bash
npx prisma migrate resolve --rolled-back 20261119000000_sync_schema
npx prisma migrate deploy
```

## One-time fix for databases built with `db push`

A database that was set up with `prisma db push` has all its tables but no
`_prisma_migrations` table. `migrate deploy` refuses to touch it and fails with
error `P3005` ("The database schema is not empty"). It changes nothing when it
fails, so the data is safe.

Fix it once, from any machine that can reach the database (with `DATABASE_URL`
set to that database):

```bash
# 1. Tell Prisma the baseline is already in place (this only writes a row
#    to _prisma_migrations; it does not run the baseline SQL)
npx prisma migrate resolve --applied 20260827000000_payment_engine_setup

# 2. Apply the rest. The newer migrations fill in whatever is missing.
npx prisma migrate deploy
```

After that, normal deploys work on their own. Run the `migrate diff` check above
to confirm the database matches the schema.

Only mark the baseline as applied. Don't mark the newer migrations as applied
by hand: let `migrate deploy` run them, because they are what fills the gaps.

## Changing the schema

1. Edit `prisma/schema.prisma`.
2. Create a migration against a local or throwaway database (never production):
   `npx prisma migrate dev --name short_description`
3. Read the generated `migration.sql`, then commit it together with the
   schema change.

Never edit or delete a migration that has already run anywhere. Fix mistakes
with a new migration.

## Stop using `db push` on shared databases

`db push` is fine for a throwaway local database. On staging and production it
changes the database without leaving a record, so the next `migrate deploy` can
fail or the history drifts from reality again. Now that the migrations match the
schema, use `migrate deploy` (the Docker start command) for every shared
database, and stop running `db push` against them.
