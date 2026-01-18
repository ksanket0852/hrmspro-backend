import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "employee@dotspeaks.com";
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.error("User not found!");
        return;
    }

    // Create a task due today (more urgent)
    const today = new Date();
    today.setHours(23, 59, 59, 999); // End of today

    const task = await prisma.task.create({
        data: {
            title: "⚡ Complete Client Presentation",
            notes: "Finalize slides and prepare for the 3 PM client meeting.",
            status: "TODO",
            priority: "HIGH",
            dueDate: today,
            assigneeId: user.id,
        },
    });

    console.log(`✅ Created urgent task: "${task.title}" (ID: ${task.id})`);
    console.log(`📅 Due: TODAY at ${task.dueDate}`);
    console.log("👉 Refresh your browser to see the popup!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
