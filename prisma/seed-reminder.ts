
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "employee@dotspeaks.com"; // The user you logged in as

    console.log(`Looking for user: ${email}...`);
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (!user) {
        console.error("User not found! Did you login as Employee?");
        return;
    }

    console.log(`Found user: ${user.id}`);

    // Create a task due tomorrow
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);

    console.log("Creating test task...");
    const task = await prisma.task.create({
        data: {
            title: "🚨 URGENT: Test Reminder Popup",
            notes: "This task was created by the debugger to test the popup.",
            status: "TODO",
            priority: "HIGH",
            dueDate: tomorrow,
            assigneeId: user.id,
        },
    });

    console.log(`✅ Success! Created task: "${task.title}" (ID: ${task.id})`);
    console.log("👉 Now refresh your browser!");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
