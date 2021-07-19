import './_boot.js';
import App from '../src/lib/app.js';
import {
    SqlClientSymbol,
} from '../src/lib/sql/base-client.js';

export async function mochaGlobalSetup() {
    this._db = App.make(SqlClientSymbol);
}