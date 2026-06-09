import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_POOL_MAX, DB_USER } from "../config";

import knex from "knex";

export const db = knex({
        client: "mysql2",
        connection: {
            host: DB_HOST,
            user: DB_USER,
            password: DB_PASSWORD,
            database: DB_DATABASE,
        },
        pool: {
            min: 0,
            max: DB_POOL_MAX
        }
    });