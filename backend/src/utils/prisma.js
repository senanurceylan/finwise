/**
 * Prisma Client tek noktadan export.
 * Hot-reload ortamında birden fazla instance oluşmasını önler.
 */
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

module.exports = { prisma };
