import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🎯 Assigning tasks to employee@dotspeaks.com...");

    const employee = await prisma.user.findUnique({
        where: { email: "employee@dotspeaks.com" }
    });

    if (!employee) {
        console.error("Employee not found!");
        return;
    }

    // Create several completed tasks for this employee (for graph data)
    const completedTasks = [
        { title: "Setup development environment", days: -10 },
        { title: "Complete onboarding training", days: -8 },
        { title: "Review codebase documentation", days: -6 },
        { title: "Fix bug in user profile", days: -4 },
        { title: "Implement password reset feature", days: -2 },
    ];

    for (const task of completedTasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.days);

        await prisma.task.create({
            data: {
                title: task.title,
                status: "DONE",
                priority: "MEDIUM",
                dueDate: dueDate,
                assigneeId: employee.id,
                assignedHours: 8,
            },
        });
    }

    console.log(`✅ Created ${completedTasks.length} completed tasks`);

    // Create new active tasks
    const newTasks = [
        { title: "🚀 Implement dark mode toggle", status: "TODO", priority: "HIGH", days: 2 },
        { title: "📊 Create analytics dashboard", status: "WORKING", priority: "HIGH", days: 5 },
        { title: "🔧 Optimize image loading", status: "TODO", priority: "MEDIUM", days: 7 },
    ];

    for (const task of newTasks) {
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + task.days);

        await prisma.task.create({
            data: {
                title: task.title,
                status: task.status as any,
                priority: task.priority as any,
                dueDate: dueDate,
                assigneeId: employee.id,
                assignedHours: 10,
            },
        });
    }

    console.log(`✅ Created ${newTasks.length} new tasks`);
    console.log("\n📋 Your new assignments:");
    newTasks.forEach(t => console.log(`   - ${t.title} (${t.status})`));
    console.log("\n🎉 Done! Refresh your dashboard to see the data!");
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
