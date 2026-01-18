import { PrismaClient, TaskStatus, TaskPriority, Role } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
    console.log("🌱 Starting to seed dashboard data...");

    // Create managers
    const manager1 = await prisma.user.upsert({
        where: { email: "manager@dotspeaks.com" },
        update: {},
        create: {
            email: "manager@dotspeaks.com",
            password: "",
            role: Role.MANAGER,
        },
    });

    const projectManager = await prisma.user.upsert({
        where: { email: "pm@dotspeaks.com" },
        update: {},
        create: {
            email: "pm@dotspeaks.com",
            password: "",
            role: Role.PROJECT_MANAGER,
        },
    });

    // Create employees
    const employees = [];
    const employeeData = [
        { email: "employee@dotspeaks.com", name: "John Doe", role: "Senior Developer", dept: "Engineering" },
        { email: "alice@dotspeaks.com", name: "Alice Smith", role: "UI/UX Designer", dept: "Design" },
        { email: "bob@dotspeaks.com", name: "Bob Johnson", role: "Frontend Developer", dept: "Engineering" },
        { email: "carol@dotspeaks.com", name: "Carol Williams", role: "Backend Developer", dept: "Engineering" },
        { email: "david@dotspeaks.com", name: "David Brown", role: "QA Engineer", dept: "Quality Assurance" },
    ];

    for (const emp of employeeData) {
        const user = await prisma.user.upsert({
            where: { email: emp.email },
            update: {},
            create: {
                email: emp.email,
                password: "",
                role: Role.OPERATOR,
            },
        });

        const employee = await prisma.employee.upsert({
            where: { userId: user.id },
            update: {},
            create: {
                userId: user.id,
                name: emp.name,
                roleTitle: emp.role,
                department: emp.dept,
                managerId: manager1.id,
                status: "Active",
            },
        });

        employees.push({ user, employee });
    }

    console.log(`✅ Created ${employees.length} employees`);

    // Create tasks with various statuses
    const taskData = [
        { title: "Design new landing page", status: TaskStatus.DONE, priority: TaskPriority.HIGH, assignee: 0, hoursSpent: 8 },
        { title: "Implement user authentication", status: TaskStatus.DONE, priority: TaskPriority.HIGH, assignee: 2, hoursSpent: 12 },
        { title: "Create API documentation", status: TaskStatus.WORKING, priority: TaskPriority.MEDIUM, assignee: 3, hoursSpent: 5 },
        { title: "Fix mobile responsiveness", status: TaskStatus.WORKING, priority: TaskPriority.HIGH, assignee: 1, hoursSpent: 6 },
        { title: "Optimize database queries", status: TaskStatus.TODO, priority: TaskPriority.MEDIUM, assignee: 3, hoursSpent: 0 },
        { title: "Write unit tests", status: TaskStatus.TODO, priority: TaskPriority.LOW, assignee: 4, hoursSpent: 0 },
        { title: "Update dependencies", status: TaskStatus.STUCK, priority: TaskPriority.LOW, assignee: 2, hoursSpent: 3 },
        { title: "Refactor payment module", status: TaskStatus.DONE, priority: TaskPriority.HIGH, assignee: 0, hoursSpent: 15 },
        { title: "Setup CI/CD pipeline", status: TaskStatus.DONE, priority: TaskPriority.MEDIUM, assignee: 3, hoursSpent: 10 },
        { title: "Design email templates", status: TaskStatus.WORKING, priority: TaskPriority.MEDIUM, assignee: 1, hoursSpent: 4 },
    ];

    const tasks = [];
    for (let i = 0; i < taskData.length; i++) {
        const data = taskData[i];
        const daysOffset = i - 5; // Mix of past and future dates
        const dueDate = new Date();
        dueDate.setDate(dueDate.getDate() + daysOffset);

        const task = await prisma.task.create({
            data: {
                title: data.title,
                notes: `Task notes for ${data.title}`,
                status: data.status,
                priority: data.priority,
                dueDate: dueDate,
                assignedHours: data.hoursSpent + Math.floor(Math.random() * 5),
                createdById: manager1.id,
                assigneeId: employees[data.assignee].user.id,
            },
        });

        tasks.push(task);

        // Add work logs for tasks that have hours spent
        if (data.hoursSpent > 0) {
            const sessions = Math.ceil(data.hoursSpent / 4); // Split into sessions
            for (let s = 0; s < sessions; s++) {
                const startTime = new Date();
                startTime.setDate(startTime.getDate() - (i + s));
                startTime.setHours(9 + s * 4, 0, 0, 0);

                const endTime = new Date(startTime);
                endTime.setHours(startTime.getHours() + Math.min(4, data.hoursSpent - s * 4));

                await prisma.taskWorkLog.create({
                    data: {
                        taskId: task.id,
                        userId: employees[data.assignee].user.id,
                        startTime,
                        endTime,
                    },
                });
            }
        }

        // Add some comments
        if (i % 3 === 0) {
            await prisma.taskComment.create({
                data: {
                    taskId: task.id,
                    authorId: manager1.id,
                    content: "Great progress on this task!",
                    seenByAssignee: true,
                },
            });
        }
    }

    console.log(`✅ Created ${tasks.length} tasks with work logs and comments`);

    console.log("\n🎉 Dashboard data seeding complete!");
    console.log("📊 Your graphs and charts should now display data!");
}

main()
    .catch((e) => {
        console.error("❌ Error seeding data:", e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
