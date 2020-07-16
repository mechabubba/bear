### Config properties

- `users`

  User groups, arrays that contain user ids.

  Null means that group and by extension feature it's for is disabled

- `users.trusted`

  Trusted users. Just an example group, not relied upon by anything.

- `users.blocked`

  Used by command internals, acts as a "block list" where user ids in the group are not allowed to run commands

- `users.allowed`

  Used by command internals, acts as an "allow list" where only user ids in the group are allowed to run commands

- `guilds`

  Guild groups, arrays that contain guild ids. Null means that group and by extension feature it's for is disabled

- `guilds.blocked`

  Used by bot access control, acts as a "block list" where the bot will auto leave guilds on the list (id based)

- `guilds.allowed`

  Used by bot access control, acts as an "allow list" where the bot will auto leave guilds not on the list (id based)

### Commands

- Command(s) for blocking/unblocking and allowing/forgetting users or guilds (part of command access control and guild access control)

- Command(s) for managing and listing user groups easily (adding/removing groups, adding/removing users to/from groups)

### Code

```js
const users = client.config.get("users").value();
const guilds = client.config.get("guilds").value();
```

```js
const dynamic = "trusted";
const group = client.config.get(["users", dynamic]).value();
```
