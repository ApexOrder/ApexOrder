# Admin-managed Battle.net credentials

Battle.net OAuth credentials can be entered under **Admin → Settings → Battle.net Account Linking**.

The values are stored in the ApexOrder SQLite database. Saving causes the PM2-managed web process to restart automatically so the OAuth routes reload the new credentials.

The Blizzard application callback URL must match:

`https://apexorder.uk/api/auth/battlenet/callback`
