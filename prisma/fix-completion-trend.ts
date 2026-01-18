import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("📊 Updating task timestamps for trend graph...");

    const employee = await prisma.user.findUnique({
        where: { email: "employee@dotspeaks.com" }
    });

    if (!employee) {
        console.error("Employee not found!");
        return;
    }

    // Get all DONE tasks for this employee
    const doneTasks = await prisma.task.findMany({
        where: {
            assigneeId: employee.id,
            status: "DONE"
        },
        orderBy: { createdAt: 'asc' }
    });

    console.log(`Found ${doneTasks.length} completed tasks`);

    // Update each task with backdated completion times
    for (let i = 0; i < doneTasks.length; i++) {
        const task = doneTasks[i];
        const daysAgo = (doneTasks.length - i) * 2; // Spread completions over time

        const completedDate = new Date();
        completedDate.setDate(completedDate.getDate() - daysAgo);

        await prisma.task.update({
            where: { id: task.id },
            data: {
                updatedAt: completedDate,
                createdAt: new Date(completedDate.getTime() - 86400000) // Created 1 day before completion
            }
        });

        console.log(`  ✓ ${task.title} - completed ${daysAgo} days ago`);
    }

    console.log("\n✅ Task completion trend data updated!");
    console.log("📈 Refresh your dashboard to see the trend graph!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
