import { PrismaClient, ProjectStatus, TaskStatus, Priority } from "@prisma/client";
import bcrypt from "bcrypt";

const prisma = new PrismaClient();

const SEED_USER_EMAIL = "demo@projecttracker.com";
const SEED_USER_PASSWORD = "Password123!";
const SEED_USER_NAME = "Demo User";

const projectDefinitions: Array<{
  name: string;
  description: string;
  status: ProjectStatus;
  priority: Priority;
  progress: number;
  startDate: Date | null;
  endDate: Date | null;
}> = [
  {
    name: "Website Redesign",
    description: "Complete overhaul of the company website with modern UI/UX patterns",
    status: ProjectStatus.Active,
    priority: Priority.High,
    progress: 45,
    startDate: new Date("2024-01-15"),
    endDate: new Date("2024-06-30"),
  },
  {
    name: "Mobile App Development",
    description: "Build a cross-platform mobile application for iOS and Android",
    status: ProjectStatus.Active,
    priority: Priority.High,
    progress: 30,
    startDate: new Date("2024-02-01"),
    endDate: new Date("2024-09-30"),
  },
  {
    name: "API Integration Platform",
    description: "Develop a centralized platform for managing third-party API integrations",
    status: ProjectStatus.Active,
    priority: Priority.Medium,
    progress: 60,
    startDate: new Date("2024-01-01"),
    endDate: new Date("2024-05-31"),
  },
  {
    name: "Data Analytics Dashboard",
    description: "Create an interactive dashboard for visualizing business metrics",
    status: ProjectStatus.Planned,
    priority: Priority.Medium,
    progress: 0,
    startDate: new Date("2024-07-01"),
    endDate: new Date("2024-12-31"),
  },
  {
    name: "Customer Feedback System",
    description: "Implement a system for collecting and analyzing customer feedback",
    status: ProjectStatus.Planned,
    priority: Priority.Low,
    progress: 0,
    startDate: new Date("2024-08-01"),
    endDate: new Date("2025-01-31"),
  },
  {
    name: "Security Audit Remediation",
    description: "Address findings from the Q4 security audit and implement fixes",
    status: ProjectStatus.Completed,
    priority: Priority.High,
    progress: 100,
    startDate: new Date("2023-10-01"),
    endDate: new Date("2024-01-15"),
  },
  {
    name: "Documentation Portal",
    description: "Build a self-service documentation portal for internal and external users",
    status: ProjectStatus.Completed,
    priority: Priority.Medium,
    progress: 100,
    startDate: new Date("2023-09-01"),
    endDate: new Date("2023-12-31"),
  },
  {
    name: "Performance Optimization",
    description: "Optimize application performance including database queries and caching",
    status: ProjectStatus.Active,
    priority: Priority.Low,
    progress: 20,
    startDate: new Date("2024-03-01"),
    endDate: new Date("2024-06-30"),
  },
  {
    name: "CI/CD Pipeline Upgrade",
    description: "Modernize the CI/CD pipeline with improved testing and deployment stages",
    status: ProjectStatus.Planned,
    priority: Priority.Low,
    progress: 0,
    startDate: new Date("2024-09-01"),
    endDate: new Date("2024-11-30"),
  },
  {
    name: "User Onboarding Flow",
    description: "Design and implement a guided onboarding experience for new users",
    status: ProjectStatus.Completed,
    priority: Priority.Medium,
    progress: 100,
    startDate: new Date("2023-11-01"),
    endDate: new Date("2024-02-28"),
  },
];

// 50 tasks: 5 per project, ensuring each TaskStatus appears ≥10 times and each Priority appears ≥10 times
// Distribution plan per project (5 tasks each):
// Statuses across 10 projects (50 tasks total): Todo=17, InProgress=17, Done=16
// Priorities across 10 projects (50 tasks total): Low=17, Medium=17, High=16
const taskTemplates: Array<{
  title: string;
  description: string;
  status: TaskStatus;
  priority: Priority;
  dueDate: Date | null;
}>[] = [
  // Project 0: Website Redesign
  [
    { title: "Design homepage mockup", description: "Create wireframes and high-fidelity mockups for the new homepage", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2024-02-15") },
    { title: "Implement responsive navigation", description: "Build a responsive navigation bar with mobile hamburger menu", status: TaskStatus.InProgress, priority: Priority.High, dueDate: new Date("2024-03-01") },
    { title: "Migrate content to new CMS", description: "Transfer all existing content to the new content management system", status: TaskStatus.Todo, priority: Priority.Medium, dueDate: new Date("2024-04-15") },
    { title: "Set up A/B testing framework", description: "Integrate A/B testing tools for measuring design effectiveness", status: TaskStatus.Todo, priority: Priority.Low, dueDate: new Date("2024-05-01") },
    { title: "Optimize image assets", description: "Compress and convert images to WebP format for faster loading", status: TaskStatus.InProgress, priority: Priority.Medium, dueDate: new Date("2024-03-15") },
  ],
  // Project 1: Mobile App Development
  [
    { title: "Set up React Native project", description: "Initialize the React Native project with TypeScript configuration", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2024-02-10") },
    { title: "Implement authentication screens", description: "Build login and registration screens with form validation", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2024-03-01") },
    { title: "Build project list view", description: "Create the main project listing screen with pull-to-refresh", status: TaskStatus.InProgress, priority: Priority.Medium, dueDate: new Date("2024-04-01") },
    { title: "Implement push notifications", description: "Set up push notification service for task reminders", status: TaskStatus.Todo, priority: Priority.Low, dueDate: new Date("2024-06-01") },
    { title: "Design app icon and splash screen", description: "Create branded app icon and animated splash screen", status: TaskStatus.Done, priority: Priority.Low, dueDate: new Date("2024-02-20") },
  ],
  // Project 2: API Integration Platform
  [
    { title: "Design API gateway architecture", description: "Document the gateway architecture with rate limiting and auth", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2024-01-20") },
    { title: "Implement OAuth2 connector", description: "Build a reusable OAuth2 connector for third-party services", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2024-02-15") },
    { title: "Build webhook receiver service", description: "Create a service to receive and process incoming webhooks", status: TaskStatus.InProgress, priority: Priority.Medium, dueDate: new Date("2024-03-15") },
    { title: "Create integration testing suite", description: "Develop automated tests for all API integration endpoints", status: TaskStatus.InProgress, priority: Priority.Medium, dueDate: new Date("2024-04-01") },
    { title: "Write API documentation", description: "Generate OpenAPI specs and developer documentation", status: TaskStatus.Todo, priority: Priority.Low, dueDate: new Date("2024-05-01") },
  ],
  // Project 3: Data Analytics Dashboard
  [
    { title: "Define KPI requirements", description: "Work with stakeholders to define key performance indicators", status: TaskStatus.Todo, priority: Priority.High, dueDate: new Date("2024-07-15") },
    { title: "Design dashboard layout", description: "Create wireframes for the analytics dashboard interface", status: TaskStatus.Todo, priority: Priority.Medium, dueDate: new Date("2024-08-01") },
    { title: "Set up data pipeline", description: "Configure ETL pipeline for aggregating data from multiple sources", status: TaskStatus.Todo, priority: Priority.High, dueDate: new Date("2024-08-15") },
    { title: "Implement chart components", description: "Build reusable chart components using a visualization library", status: TaskStatus.Todo, priority: Priority.Medium, dueDate: new Date("2024-09-01") },
    { title: "Create export functionality", description: "Add ability to export dashboard data as CSV and PDF", status: TaskStatus.Todo, priority: Priority.Low, dueDate: new Date("2024-10-01") },
  ],
  // Project 4: Customer Feedback System
  [
    { title: "Research feedback tools", description: "Evaluate existing feedback collection tools and libraries", status: TaskStatus.Todo, priority: Priority.Medium, dueDate: new Date("2024-08-15") },
    { title: "Design feedback form UI", description: "Create an intuitive feedback submission form interface", status: TaskStatus.Todo, priority: Priority.Low, dueDate: new Date("2024-09-01") },
    { title: "Build sentiment analysis module", description: "Implement NLP-based sentiment analysis for feedback text", status: TaskStatus.Todo, priority: Priority.Medium, dueDate: new Date("2024-10-01") },
    { title: "Create admin review dashboard", description: "Build interface for admins to review and categorize feedback", status: TaskStatus.Todo, priority: Priority.Low, dueDate: new Date("2024-11-01") },
    { title: "Set up notification triggers", description: "Configure alerts for negative feedback requiring immediate attention", status: TaskStatus.Todo, priority: Priority.High, dueDate: new Date("2024-11-15") },
  ],
  // Project 5: Security Audit Remediation
  [
    { title: "Fix SQL injection vulnerabilities", description: "Remediate all identified SQL injection points in the application", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2023-10-15") },
    { title: "Update dependency versions", description: "Upgrade all packages with known security vulnerabilities", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2023-10-20") },
    { title: "Implement CSP headers", description: "Add Content Security Policy headers to all responses", status: TaskStatus.Done, priority: Priority.Medium, dueDate: new Date("2023-11-01") },
    { title: "Add rate limiting", description: "Implement rate limiting on authentication and API endpoints", status: TaskStatus.Done, priority: Priority.Medium, dueDate: new Date("2023-11-15") },
    { title: "Conduct penetration testing", description: "Run automated and manual penetration tests on remediated areas", status: TaskStatus.Done, priority: Priority.Low, dueDate: new Date("2023-12-15") },
  ],
  // Project 6: Documentation Portal
  [
    { title: "Set up documentation framework", description: "Install and configure the documentation site generator", status: TaskStatus.Done, priority: Priority.Medium, dueDate: new Date("2023-09-15") },
    { title: "Write API reference docs", description: "Document all API endpoints with examples and parameters", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2023-10-15") },
    { title: "Create getting started guide", description: "Write a beginner-friendly guide for new developers", status: TaskStatus.Done, priority: Priority.Medium, dueDate: new Date("2023-11-01") },
    { title: "Add search functionality", description: "Implement full-text search across all documentation pages", status: TaskStatus.Done, priority: Priority.Low, dueDate: new Date("2023-11-15") },
    { title: "Deploy documentation site", description: "Set up CI/CD pipeline for automatic documentation deployment", status: TaskStatus.Done, priority: Priority.Low, dueDate: new Date("2023-12-01") },
  ],
  // Project 7: Performance Optimization
  [
    { title: "Profile database queries", description: "Identify and log slow database queries for optimization", status: TaskStatus.InProgress, priority: Priority.High, dueDate: new Date("2024-03-15") },
    { title: "Implement Redis caching", description: "Add Redis caching layer for frequently accessed data", status: TaskStatus.Todo, priority: Priority.Medium, dueDate: new Date("2024-04-15") },
    { title: "Optimize bundle size", description: "Analyze and reduce JavaScript bundle size with code splitting", status: TaskStatus.InProgress, priority: Priority.Medium, dueDate: new Date("2024-04-01") },
    { title: "Set up performance monitoring", description: "Integrate APM tool for continuous performance monitoring", status: TaskStatus.Todo, priority: Priority.Low, dueDate: new Date("2024-05-01") },
    { title: "Implement lazy loading", description: "Add lazy loading for images and below-the-fold components", status: TaskStatus.InProgress, priority: Priority.Low, dueDate: new Date("2024-05-15") },
  ],
  // Project 8: CI/CD Pipeline Upgrade
  [
    { title: "Evaluate CI/CD platforms", description: "Compare GitHub Actions, GitLab CI, and CircleCI for our needs", status: TaskStatus.InProgress, priority: Priority.Medium, dueDate: new Date("2024-09-15") },
    { title: "Design pipeline stages", description: "Define build, test, and deploy stages for the new pipeline", status: TaskStatus.InProgress, priority: Priority.High, dueDate: new Date("2024-09-30") },
    { title: "Implement automated testing stage", description: "Configure automated unit and integration test execution", status: TaskStatus.Todo, priority: Priority.High, dueDate: new Date("2024-10-15") },
    { title: "Set up staging environment", description: "Create a staging deployment environment for pre-production testing", status: TaskStatus.Todo, priority: Priority.Medium, dueDate: new Date("2024-10-30") },
    { title: "Configure rollback mechanism", description: "Implement automated rollback on deployment failure", status: TaskStatus.InProgress, priority: Priority.Low, dueDate: new Date("2024-11-15") },
  ],
  // Project 9: User Onboarding Flow
  [
    { title: "Map user journey", description: "Document the ideal new user journey from signup to first action", status: TaskStatus.Done, priority: Priority.High, dueDate: new Date("2023-11-10") },
    { title: "Design onboarding screens", description: "Create step-by-step onboarding screen designs", status: TaskStatus.Done, priority: Priority.Medium, dueDate: new Date("2023-11-25") },
    { title: "Implement progress tracker", description: "Build a visual progress indicator for onboarding steps", status: TaskStatus.InProgress, priority: Priority.Medium, dueDate: new Date("2023-12-15") },
    { title: "Add interactive tooltips", description: "Implement contextual tooltips highlighting key features", status: TaskStatus.InProgress, priority: Priority.Low, dueDate: new Date("2024-01-15") },
    { title: "Create welcome email sequence", description: "Design and implement automated welcome emails for new users", status: TaskStatus.Done, priority: Priority.Low, dueDate: new Date("2024-02-01") },
  ],
];

async function main() {
  console.log("🌱 Starting database seed...");

  // Idempotency: delete existing seed user (cascade will remove projects and tasks)
  await prisma.user.deleteMany({
    where: { email: SEED_USER_EMAIL },
  });

  console.log("🧹 Cleared existing seed data");

  // Create user with hashed password
  const hashedPassword = await bcrypt.hash(SEED_USER_PASSWORD, 10);
  const user = await prisma.user.create({
    data: {
      name: SEED_USER_NAME,
      email: SEED_USER_EMAIL,
      password: hashedPassword,
    },
  });

  console.log(`👤 Created user: ${user.email}`);

  // Create 10 projects
  for (let i = 0; i < projectDefinitions.length; i++) {
    const projectDef = projectDefinitions[i];
    const project = await prisma.project.create({
      data: {
        name: projectDef.name,
        description: projectDef.description,
        status: projectDef.status,
        priority: projectDef.priority,
        progress: projectDef.progress,
        startDate: projectDef.startDate,
        endDate: projectDef.endDate,
        ownerId: user.id,
      },
    });

    // Create 5 tasks for this project
    const tasks = taskTemplates[i];
    for (const taskDef of tasks) {
      await prisma.task.create({
        data: {
          title: taskDef.title,
          description: taskDef.description,
          status: taskDef.status,
          priority: taskDef.priority,
          dueDate: taskDef.dueDate,
          projectId: project.id,
        },
      });
    }

    console.log(`📁 Created project "${project.name}" with 5 tasks`);
  }

  console.log("✅ Seed completed successfully!");
  console.log(`   - 1 user (${SEED_USER_EMAIL} / ${SEED_USER_PASSWORD})`);
  console.log("   - 10 projects");
  console.log("   - 50 tasks");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
