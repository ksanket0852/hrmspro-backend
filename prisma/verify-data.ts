import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const tasks = await prisma.task.groupBy({
        by: ['status'],
        _count: { status: true }
    });

    console.log('Task counts by status:');
    tasks.forEach(g => {
        console.log(`  ${g.status}: ${g._count.status}`);
    });

    const total = await prisma.task.count();
    console.log(`\nTotal tasks: ${total}`);
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
