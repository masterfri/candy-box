import mysql from 'mysql2';

class MysqlClient
{
    constructor(config) {
        this._conn = mysql.createConnection(config);
    }

    getConnection() {

    }

    execute(sql) {

    }

    select(sql) {
        
    }

    end() {

    }
}

export default MysqlClient;