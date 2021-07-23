import './_boot.js';
import { sqlClient } from '../src/lib/sql/base-client.js';

export async function mochaGlobalSetup() {
    this._db = sqlClient();
}