# Meta App Review Notes

MeuPerfil uses the official Instagram API to send private replies to people who comment on a connected Instagram professional account's post or reel.

## Permissions To Request

- `instagram_business_basic`
- `instagram_business_manage_comments`
- `instagram_business_manage_messages`
- `instagram_business_content_publish`

## Review Demo Script

1. Sign in to MeuPerfil with an email magic link.
2. Connect an Instagram Business or Creator account.
3. Create a campaign for a recent reel/post with keyword `LINK`.
4. From a tester Instagram account, comment `LINK` on that reel/post.
5. Show `/api/webhook` receiving the comment event.
6. Show the worker sending a private reply through the Instagram messages endpoint using the comment ID.
7. Show the log row in the dashboard with status `SENT`.

## Compliance Positioning

- The app never scrapes Instagram.
- The app only sends a private reply when a user comments on the connected business account's content.
- Tokens are encrypted at rest with AES-256-GCM.
- Customers can disconnect Instagram from Settings.
- Rate limiting, deduplication, and monthly plan limits prevent spammy behavior.

## Publishing validation

The app uses Instagram Login tokens and the `graph.instagram.com` host. Existing
accounts must reconnect to grant the new content publishing permission. Confirm
Advanced Access/App Review for public users before enabling production publishing.

On a Meta test account, verify photo, Reel, carousel and (where supported by the
account) Story publishing. Then verify that the published post's keyword comment
creates one private reply and one persisted lead. See `docs/integration-smoke-tests.md`.

Reference: [Meta's Instagram Login collection](https://www.postman.com/meta/instagram/folder/1z5vxzu/instagram-api-with-instagram-login).
