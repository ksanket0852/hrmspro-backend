
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    const email = "employee@dotspeaks.com";
    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
        console.log("User not found");
        return;
    }

    console.log(`Checking reminders for user: ${user.id}`);

    const reminders = await prisma.taskReminder.findMany({
        where: { userId: user.id },
        include: { task: true }
    });

    if (reminders.length === 0) {
        console.log("No reminder records found.");
    } else {
        reminders.forEach(r => {
            console.log(`Task: "${r.task.title}" Status: [${r.status}] SnoozeUntil: ${r.snoozeUntil}`);
        });
    }
}

main()
    .catch(console.error)
    .finally(() => prisma.$disconnect());
