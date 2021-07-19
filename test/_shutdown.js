export async function mochaGlobalTeardown() {
    await this._db.end();
}