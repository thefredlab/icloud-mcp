import knex from "knex";
import { DB_DATABASE, DB_HOST, DB_PASSWORD, DB_USER } from "../config";

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
            max: parseInt(process.env.DB_POOL_MAX || "30", 10)
        }
    });