# Native iOS push (APNs)

OpWrk does not send native push through OpenChamber's hosted relay. APNs delivery is off until the server has either its own direct Apple configuration or an explicitly configured HTTPS push relay. Browser and desktop notifications use separate paths.

## Delivery paths

- **Direct APNs:** Set `OPENCHAMBER_APNS_KEY_ID`, `OPENCHAMBER_APNS_TEAM_ID`, `OPENCHAMBER_APNS_P8` (or `OPENCHAMBER_APNS_P8_PATH`), and `OPENCHAMBER_APNS_BUNDLE_ID` for the actual iOS app. The server signs an ES256 JWT and sends over HTTP/2 to Apple. There is no inherited bundle ID. Values can also come from `settings.json` `apnsConfig`.
- **Configured relay:** Set `OPENCHAMBER_PUSH_RELAY_URL` to the HTTPS `/v1/push/send` endpoint of a relay you control. The server derives `/v1/push/register-token` from that URL and signs register/send requests with its local relay keypair. `https://api.openchamber.dev` is rejected. Set `OPENCHAMBER_PUSH_RELAY_DISABLED=true` to force the direct path even when a relay URL is present.

These environment names are retained for compatibility during the fork migration; their presence does not imply any OpenChamber-hosted service. A missing or invalid relay URL makes no relay request. A missing direct configuration makes no APNs request and logs one local warning when delivery is attempted.

## Token and payload flow

Only the native Capacitor app registers an APNs token through `POST /api/push/apns-token`. Tokens are stored per UI session. In configured-relay mode, a new token is bound to this server's signing identity. In direct mode, the server keeps it locally and sends to Apple itself. A `410`, `BadDeviceToken`, or `Unregistered` result removes a dead token.

Notification triggers are ready, error, question, and permission events. The alert carries a generic scenario title, the session name, a badge count, and a session ID for opening the correct task. It does not include message or model content. The payload is not end-to-end encrypted: Apple can read direct APNs alerts, and a configured relay can read relayed alerts and device tokens. Choose a relay accordingly.

Tokens are grouped by their registered APNs environment: Xcode/development builds use sandbox and production builds use production. `OPENCHAMBER_APNS_ENVIRONMENT` may override that routing. APNs delivery is not gated on UI visibility because a suspended WKWebView cannot reliably send a visibility update. The iOS shell suppresses foreground banners.

The badge is the number of distinct pending notification tags since the app last foregrounded. Opening a session or sending a message clears the pending set. Android FCM push is not implemented.
