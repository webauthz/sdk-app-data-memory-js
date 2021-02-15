/*!
Copyright (C) 2021 Cryptium Corporation. All rights reserved.
*/
const { Database } = require('@libertyio/data-collection-memory-js');

class WebauthzMemoryDatabase {
    constructor({ log = console, storage = {} } = {}) {
        this.log = log;
        this.database = new Database({ log, storage });
    }

    // create new record, or replace existing record; should not throw exception unless there is a write error
    async storeConfiguration(webauthz_discovery_uri, configuration) {
        await this.database.collection('webauthz_configuration').deleteById(webauthz_discovery_uri); // in case there was already an entry
        const isCreated = await this.database.collection('webauthz_configuration').insert(webauthz_discovery_uri, configuration);
        return isCreated;
    }

    async fetchConfiguration(webauthz_discovery_uri) {
        return await this.database.collection('webauthz_configuration').fetchById(webauthz_discovery_uri);
    }

    // create new record, or replace existing record; should not throw exception unless there is a write error
    async storeRegistration(webauthz_register_uri, registration) {
        await this.database.collection('webauthz_registration').deleteById(webauthz_register_uri); // in case there was already an entry
        const isCreated = await this.database.collection('webauthz_registration').insert(webauthz_register_uri, registration);
        return isCreated;
    }

    async fetchRegistration(webauthz_register_uri) {
        return await this.database.collection('webauthz_registration').fetchById(webauthz_register_uri);
    }

    // creates new record, should throw exception if record already exists
    async createAccessRequest(requestId, requestRecord) {
        const isCreated = await this.database.collection('webauthz_request').insert(requestId, requestRecord);
        return isCreated;
    }

    async fetchAccessRequest(requestId) {
        return await this.database.collection('webauthz_request').fetchById(requestId);
    }

    // should throw exception if record does not exist
    async editAccessRequest(requestId, requestRecord) {
        const isEdited = await this.database.collection('webauthz_request').editById(requestId, requestRecord);
        return isEdited;
    }

    // creates new record, should throw exception if record already exists
    async createAccessToken(id, accessTokenRecord) {
        const isCreated = await this.database.collection('webauthz_access_token').insert(id, accessTokenRecord);

        // NOTE: because we're using an in-memory database without a search feature, we create our own index of origin + path pointing to the access token record, so we can look up access tokens later by origin and path prefix; in a relational database this would simply be a lookup on columns other than the primary key, which could then be indexed by the database; we include user_id as prefix in the index to ensure that all tokens are still scoped to the user in the index and we don't accidentally find a token belonging to someone else for the same resource; "replace" below means insert or update -- if you do keep a separate index table and the storage system doesn't support "replace", use fetch, delete if exists, then insert

        const { user_id, origin, path } = accessTokenRecord;
        const indexValue = `${user_id}:${origin}${path}`;
        this.log.info(`createAccessToken: adding access token index for ${indexValue} => ${id}`);
        await this.database.collection('webauthz_access_token_index').replace(indexValue, id);

        return isCreated;
    }

    async fetchAccessToken({ user_id, origin, pathList }) {
        let accessTokenRecord = null;
        for (let i = 0; i < pathList.length; i += 1) {
            const pathPrefix = pathList[i];
            const indexValue = `${user_id}:${origin}${pathPrefix}`;
            this.log.info(`getAccessToken: search for access token index ${indexValue}`);
            const id = await this.database.collection('webauthz_access_token_index').fetchById(indexValue);
            if (typeof id === 'string' && id) {
                accessTokenRecord = await this.database.collection('webauthz_access_token').fetchById(id);
                if (typeof accessTokenRecord === 'object' && accessTokenRecord !== null ) {
                    break;
                }
            }
        }
        return accessTokenRecord; // may be null
    }
}

export { WebauthzMemoryDatabase };
