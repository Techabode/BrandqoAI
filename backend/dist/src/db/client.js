"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = exports.Prisma = void 0;
const client_1 = require("../../generated/prisma/client");
const adapter_pg_1 = require("@prisma/adapter-pg");
const pg_1 = require("pg");
const env_1 = require("../config/env");
var client_2 = require("../../generated/prisma/client");
Object.defineProperty(exports, "Prisma", { enumerable: true, get: function () { return client_2.Prisma; } });
const pool = new pg_1.Pool({
    connectionString: env_1.env.databaseUrl,
});
const adapter = new adapter_pg_1.PrismaPg(pool);
exports.prisma = new client_1.PrismaClient({
    adapter,
});
