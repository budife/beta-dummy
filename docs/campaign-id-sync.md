# Campaign Counter Phase 1

Campaign Counter is a browser-local registry for generating
four-digit Campaign IDs. It does not scan folders, import XLSX files, or use
the Monday bookmarklet in this phase.

## Required setup

1. A future self-hosted service must expose `campaign_registry`,
   `generate_campaign_id`, and `set_next_campaign_id`.
2. Add the project URL and **Publishable/Anon** key directly to
   The Campaign Counter is local-only. See `EXTERNAL-INTEGRATIONS.md` for the
   replacement point if a self-hosted shared service is required.

```js
window.EDM_SUPABASE_CONFIG = {
   url: 'REPLACE_WITH_APPROVED_SELF_HOSTED_ENDPOINT',
  anonKey: 'your-publishable-anon-key'
};
```

Only the public anon key is valid in this static GitHub Pages app. Never add a
service-role key, database password, or private token to the repository.

## User flow

1. Open Campaign Counter and confirm `Connected`.
2. On the first visit, enter a name; it is retained in `localStorage` as
   `edm_username`.
3. Select **Generate Campaign ID**. The button uses browser-local storage.
   the request, preventing duplicate clicks.
4. The new ID is copied to the clipboard, Last Campaign refreshes, and the
   activity list shows who generated it and when.

Use the small edit icon next to Last Campaign when an ID must be set manually.
Any value from `0001` through `9999` is accepted. The optional reason is saved
with a `manual_set` activity record. The newest activity becomes the active
counter pointer: after manually setting `0314`, the next generated ID is `0315`.

If the badge says `Offline`, no ID can be generated. Check the network,
The old shared-service setup is no longer part of the application. See
`EXTERNAL-INTEGRATIONS.md` before implementing a replacement.

If manual adjustment returns PostgreSQL error `42702`, run
The old Supabase SQL migration is retained only as historical reference. Do not
run it for this local-only deployment. It replaces the
RPC with a version that qualifies every `campaign_registry` column using `cr`.
Run the complete file, including its initial `drop function` statement.
