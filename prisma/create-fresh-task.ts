import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "employee@dotspeaks.com";
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error("User not found!");
        return;
    }

    // Create a new task due tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    const task = await prisma.task.create({
        data: {
            title: "📋 Review Project Documentation",
            notes: "Please review and update the project documentation before the deadline.",
            status: "TODO",
            priority: "HIGH",
            dueDate: tomorrow,
            assigneeId: user.id,
        },
    });

    console.log(`✅ Created new task: "${task.title}" (ID: ${task.id})`);
    console.log(`📅 Due: ${task.dueDate}`);
    console.log("👉 Refresh your browser to see the popup!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
