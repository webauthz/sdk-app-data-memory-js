sdk-app-data-memory-js
======================

In-memory storage implementation for Webauthz NodeJS application SDK.

# Usage

```
const { WebauthzMemoryDatabase } = require('@webauthz/sdk-app-data-memory-js');
const { Webauthz } = require('@webauthz/sdk-app-core-node-js');

const database = new WebauthzMemoryDatabase();
const webauthzPlugin = new Webauthz({ database, ...otherSettings });
```

# Build

```
npm run lint
npm run build
```
