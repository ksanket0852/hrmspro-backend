import { Router } from "express";
import { auth } from "../middleware/auth.js";
import prisma from "../db";

const router = Router();

// GET /api/reminders
// Fetch upcoming deadlines for the logged-in user
router.get("/", auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const today = new Date();
    const threeDaysFromNow = new Date();
    threeDaysFromNow.setDate(today.getDate() + 3);

    // 1. Find tasks assigned to user that are not done
    // and have a due date (either overdue or upcoming within 3 days)
    const tasks = await prisma.task.findMany({
      where: {
        assigneeId: userId,
        status: { not: "DONE" },
        isDeleted: false,
        dueDate: {
          not: null,
          lte: threeDaysFromNow, // Only show tasks due within 3 days or overdue
        },
      },
      select: {
        id: true,
        title: true,
        dueDate: true,
        priority: true,
        status: true,
      },
      orderBy: { dueDate: "asc" },
    });

    // 2. Filter tasks based on Reminder status (Dismissed/Snoozed)
    const reminderStatuses = await prisma.taskReminder.findMany({
      where: {
        userId,
        taskId: { in: tasks.map((t) => t.id) },
      },
    });

    const reminderMap = new Map();
    reminderStatuses.forEach((r) => {
      reminderMap.set(r.taskId, r);
    });

    const activeReminders = tasks
      .map((task) => {
        const reminder = reminderMap.get(task.id);
        const status = reminder ? reminder.status : "PENDING";
        const snoozeUntil = reminder ? reminder.snoozeUntil : null;
        const dueDate = new Date(task.dueDate!);

        // Skip dismissed tasks
        if (status === "DISMISSED") return null;

        // Skip snoozed tasks if snooze time hasn't passed
        if (status === "SNOOZED" && snoozeUntil && new Date() < snoozeUntil) {
          return null;
        }

        // Calculate days remaining
        // Difference in time
        const diffTime = dueDate.getTime() - today.getTime();
        // Difference in days (ceil to handle partial days)
        const daysRemaining = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let reminderStatus = "Upcoming";
        if (daysRemaining < 0) reminderStatus = "Overdue";
        else if (daysRemaining === 0) reminderStatus = "Due Today";

        return {
          id: task.id,
          title: task.title,
          dueDate: task.dueDate,
          daysRemaining,
          status: reminderStatus,
          originalStatus: task.status,
          priority: task.priority,
        };
      })
      .filter((t) => t !== null); // Remove nulls

    res.json(activeReminders);
  } catch (error) {
    console.error("Error fetching reminders:", error);
    res.status(500).json({ error: "Failed to fetch reminders" });
  }
});

// POST /api/reminders/dismiss
router.post("/dismiss", auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { taskId } = req.body;

    if (!taskId) return res.status(400).json({ error: "Task ID required" });

    // Upsert reminder status to DISMISSED
    await prisma.taskReminder.upsert({
      where: {
        taskId_userId: { taskId, userId },
      },
      update: {
        status: "DISMISSED",
        snoozeUntil: null,
      },
      create: {
        taskId,
        userId,
        status: "DISMISSED",
      },
    });

    res.json({ message: "Reminder dismissed" });
  } catch (error) {
    console.error("Error dismissing reminder:", error);
    res.status(500).json({ error: "Failed to dismiss reminder" });
  }
});

// POST /api/reminders/snooze
router.post("/snooze", auth, async (req, res) => {
  try {
    const userId = req.user!.id;
    const { taskId, snoozeHours } = req.body;

    if (!taskId) return res.status(400).json({ error: "Task ID required" });

    const hours = parseInt(snoozeHours) || 24; // Default 24 hours
    const snoozeUntil = new Date();
    snoozeUntil.setHours(snoozeUntil.getHours() + hours);

    // Upsert reminder status to SNOOZED
    await prisma.taskReminder.upsert({
      where: {
        taskId_userId: { taskId, userId },
      },
      update: {
        status: "SNOOZED",
        snoozeUntil,
      },
      create: {
        taskId,
        userId,
        status: "SNOOZED",
        snoozeUntil,
      },
    });

    res.json({ message: `Reminder snoozed for ${hours} hours`, snoozeUntil });
  } catch (error) {
    console.error("Error snoozing reminder:", error);
    res.status(500).json({ error: "Failed to snooze reminder" });
  }
});

export default router;
