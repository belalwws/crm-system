import { PrismaClient, TaskStatus, Priority, CustomerStatus, LeadSource, DealStage, NotificationType, ActivityType } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create demo user
  const rounds = process.env.NODE_ENV === 'production' ? 12 : 4;
  const hashedPassword = await bcrypt.hash('demo123456', rounds);
  
  const user = await prisma.user.upsert({
    where: { email: 'demo@nexuscrm.com' },
    update: { password: hashedPassword },
    create: {
      name: 'John Smith',
      email: 'demo@nexuscrm.com',
      password: hashedPassword,
      company: 'Nexus Technologies',
      role: 'ADMIN',
      phone: '+1 (555) 123-4567',
      timezone: 'America/New_York',
      isActive: true,
      emailVerified: true,
    },
  });

  console.log(`✅ Created user: ${user.email}`);

  // Create Customers
  const customers = await Promise.all([
    prisma.customer.create({
      data: {
        name: 'TechCorp Industries',
        email: 'contact@techcorp.com',
        phone: '+1 (555) 234-5678',
        company: 'TechCorp Industries',
        address: '100 Innovation Drive, San Francisco, CA 94105',
        status: 'ACTIVE',
        source: 'WEBSITE',
        industry: 'Technology',
        website: 'https://techcorp.com',
        tags: ['enterprise', 'technology', 'vip'],
        ownerId: user.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'Global Finance Ltd',
        email: 'info@globalfinance.com',
        phone: '+1 (555) 345-6789',
        company: 'Global Finance Ltd',
        address: '200 Wall Street, New York, NY 10005',
        status: 'ACTIVE',
        source: 'REFERRAL',
        industry: 'Finance',
        website: 'https://globalfinance.com',
        tags: ['finance', 'enterprise', 'high-value'],
        ownerId: user.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'HealthFirst Medical',
        email: 'admin@healthfirst.com',
        phone: '+1 (555) 456-7890',
        company: 'HealthFirst Medical Group',
        address: '300 Medical Center Blvd, Boston, MA 02115',
        status: 'ACTIVE',
        source: 'TRADE_SHOW',
        industry: 'Healthcare',
        website: 'https://healthfirst.com',
        tags: ['healthcare', 'medical', 'growth'],
        ownerId: user.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'EcoGreen Solutions',
        email: 'hello@ecogreen.com',
        phone: '+1 (555) 567-8901',
        company: 'EcoGreen Solutions Inc',
        address: '400 Sustainability Way, Portland, OR 97201',
        status: 'LEAD',
        source: 'SOCIAL_MEDIA',
        industry: 'Environmental',
        website: 'https://ecogreen.com',
        tags: ['green', 'startup', 'potential'],
        ownerId: user.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'RetailMax Corp',
        email: 'sales@retailmax.com',
        phone: '+1 (555) 678-9012',
        company: 'RetailMax Corporation',
        address: '500 Commerce Street, Chicago, IL 60601',
        status: 'ACTIVE',
        source: 'EMAIL_CAMPAIGN',
        industry: 'Retail',
        website: 'https://retailmax.com',
        tags: ['retail', 'enterprise', 'expansion'],
        ownerId: user.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'CloudScale Tech',
        email: 'info@cloudscale.io',
        phone: '+1 (555) 789-0123',
        company: 'CloudScale Technologies',
        address: '600 Cloud Avenue, Seattle, WA 98101',
        status: 'ACTIVE',
        source: 'PARTNER',
        industry: 'Cloud Computing',
        website: 'https://cloudscale.io',
        tags: ['saas', 'cloud', 'tech'],
        ownerId: user.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'MediaWorks Studio',
        email: 'contact@mediaworks.com',
        phone: '+1 (555) 890-1234',
        company: 'MediaWorks Creative Studio',
        address: '700 Creative Lane, Los Angeles, CA 90028',
        status: 'LEAD',
        source: 'COLD_CALL',
        industry: 'Media & Entertainment',
        website: 'https://mediaworks.com',
        tags: ['media', 'creative', 'small-business'],
        ownerId: user.id,
      },
    }),
    prisma.customer.create({
      data: {
        name: 'AutoDrive Motors',
        email: 'fleet@autodrive.com',
        phone: '+1 (555) 901-2345',
        company: 'AutoDrive Motors Inc',
        address: '800 Motor Way, Detroit, MI 48201',
        status: 'ACTIVE',
        source: 'REFERRAL',
        industry: 'Automotive',
        website: 'https://autodrive.com',
        tags: ['automotive', 'fleet', 'enterprise'],
        ownerId: user.id,
      },
    }),
  ]);

  console.log(`✅ Created ${customers.length} customers`);

  // Create Deals
  const deals = await Promise.all([
    prisma.deal.create({
      data: {
        title: 'Enterprise CRM Implementation',
        description: 'Full CRM system deployment for TechCorp including training and support',
        value: 125000,
        stage: 'NEGOTIATION',
        probability: 75,
        expectedCloseDate: new Date('2026-04-15'),
        ownerId: user.id,
        customerId: customers[0].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Financial Analytics Platform',
        description: 'Custom analytics dashboard and reporting solution',
        value: 85000,
        stage: 'PROPOSAL',
        probability: 60,
        expectedCloseDate: new Date('2026-05-01'),
        ownerId: user.id,
        customerId: customers[1].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Healthcare Data Integration',
        description: 'Patient management system integration with existing EMR',
        value: 200000,
        stage: 'QUALIFIED',
        probability: 40,
        expectedCloseDate: new Date('2026-06-30'),
        ownerId: user.id,
        customerId: customers[2].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Sustainability Tracking Software',
        description: 'Carbon footprint tracking and ESG reporting platform',
        value: 45000,
        stage: 'LEAD',
        probability: 20,
        expectedCloseDate: new Date('2026-07-15'),
        ownerId: user.id,
        customerId: customers[3].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Retail POS Integration',
        description: 'Point of sale system integration across 50 locations',
        value: 175000,
        stage: 'CLOSED_WON',
        probability: 100,
        expectedCloseDate: new Date('2026-02-01'),
        ownerId: user.id,
        customerId: customers[4].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Cloud Migration Services',
        description: 'Complete infrastructure migration to AWS',
        value: 320000,
        stage: 'NEGOTIATION',
        probability: 80,
        expectedCloseDate: new Date('2026-03-20'),
        ownerId: user.id,
        customerId: customers[5].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Content Management System',
        description: 'Custom CMS development for digital assets',
        value: 65000,
        stage: 'PROPOSAL',
        probability: 50,
        expectedCloseDate: new Date('2026-04-30'),
        ownerId: user.id,
        customerId: customers[6].id,
      },
    }),
    prisma.deal.create({
      data: {
        title: 'Fleet Management Solution',
        description: 'GPS tracking and fleet optimization for 200 vehicles',
        value: 95000,
        stage: 'CLOSED_WON',
        probability: 100,
        expectedCloseDate: new Date('2026-01-15'),
        ownerId: user.id,
        customerId: customers[7].id,
      },
    }),
  ]);

  console.log(`✅ Created ${deals.length} deals`);

  // Create Tasks
  const tasks = await Promise.all([
    prisma.task.create({
      data: {
        title: 'Follow up with TechCorp on proposal',
        description: 'Schedule a call to discuss the enterprise CRM implementation timeline',
        priority: Priority.HIGH,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date('2026-03-01'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Prepare financial analytics demo',
        description: 'Create a customized demo environment for Global Finance',
        priority: Priority.HIGH,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-03-05'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[1].id,
        dealId: deals[1].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Review healthcare compliance requirements',
        description: 'Verify HIPAA compliance for HealthFirst integration',
        priority: Priority.URGENT,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-03-03'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[2].id,
        dealId: deals[2].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Send EcoGreen product brochure',
        description: 'Email sustainability tracking features overview',
        priority: Priority.MEDIUM,
        status: TaskStatus.COMPLETED,
        dueDate: new Date('2026-02-25'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[3].id,
        dealId: deals[3].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Schedule RetailMax training session',
        description: 'Organize onboarding training for store managers',
        priority: Priority.MEDIUM,
        status: TaskStatus.IN_PROGRESS,
        dueDate: new Date('2026-03-10'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[4].id,
        dealId: deals[4].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Finalize CloudScale migration plan',
        description: 'Review technical architecture and timeline with engineering',
        priority: Priority.HIGH,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-03-02'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[5].id,
        dealId: deals[5].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'Create MediaWorks wireframes',
        description: 'Design initial CMS interface mockups',
        priority: Priority.LOW,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-03-15'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[6].id,
        dealId: deals[6].id,
      },
    }),
    prisma.task.create({
      data: {
        title: 'AutoDrive quarterly review',
        description: 'Prepare QBR presentation for fleet management metrics',
        priority: Priority.MEDIUM,
        status: TaskStatus.PENDING,
        dueDate: new Date('2026-03-20'),
        assignedToId: user.id,
        createdById: user.id,
        customerId: customers[7].id,
        dealId: deals[7].id,
      },
    }),
  ]);

  console.log(`✅ Created ${tasks.length} tasks`);

  // Create Contacts
  const contacts = await Promise.all([
    prisma.contact.create({
      data: {
        firstName: 'Sarah',
        lastName: 'Chen',
        email: 'sarah.chen@techcorp.com',
        phone: '+1 (555) 234-5680',
        title: 'VP of Engineering',
        isPrimary: true,
        ownerId: user.id,
        customerId: customers[0].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Michael',
        lastName: 'Roberts',
        email: 'mroberts@globalfinance.com',
        phone: '+1 (555) 345-6791',
        title: 'CFO',
        isPrimary: true,
        ownerId: user.id,
        customerId: customers[1].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Emily',
        lastName: 'Watson',
        email: 'ewatson@healthfirst.com',
        phone: '+1 (555) 456-7892',
        title: 'CTO',
        isPrimary: true,
        ownerId: user.id,
        customerId: customers[2].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'David',
        lastName: 'Green',
        email: 'david@ecogreen.com',
        phone: '+1 (555) 567-8903',
        title: 'Founder & CEO',
        isPrimary: true,
        ownerId: user.id,
        customerId: customers[3].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Jennifer',
        lastName: 'Martinez',
        email: 'jmartinez@retailmax.com',
        phone: '+1 (555) 678-9014',
        title: 'Head of IT',
        isPrimary: true,
        ownerId: user.id,
        customerId: customers[4].id,
      },
    }),
    prisma.contact.create({
      data: {
        firstName: 'Alex',
        lastName: 'Kumar',
        email: 'alex@cloudscale.io',
        phone: '+1 (555) 789-0125',
        title: 'Chief Architect',
        isPrimary: true,
        ownerId: user.id,
        customerId: customers[5].id,
      },
    }),
  ]);

  console.log(`✅ Created ${contacts.length} contacts`);

  // Create Products
  const products = await Promise.all([
    prisma.product.create({
      data: {
        name: 'Nexus CRM Enterprise',
        description: 'Full-featured CRM solution with AI insights, workflow automation, and advanced analytics',
        unitPrice: 299,
        category: 'Software',
        sku: 'NCRM-ENT-001',
        isActive: true,
        ownerId: user.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Nexus CRM Professional',
        description: 'Professional CRM with core features, team collaboration, and standard reporting',
        unitPrice: 149,
        category: 'Software',
        sku: 'NCRM-PRO-001',
        isActive: true,
        ownerId: user.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Nexus CRM Starter',
        description: 'Essential CRM features for small teams and startups',
        unitPrice: 49,
        category: 'Software',
        sku: 'NCRM-STR-001',
        isActive: true,
        ownerId: user.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Implementation Services',
        description: 'Professional implementation, data migration, and custom configuration',
        unitPrice: 5000,
        category: 'Services',
        sku: 'NCRM-IMP-001',
        isActive: true,
        ownerId: user.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Training Package',
        description: 'Comprehensive training for administrators and end users',
        unitPrice: 2500,
        category: 'Services',
        sku: 'NCRM-TRN-001',
        isActive: true,
        ownerId: user.id,
      },
    }),
    prisma.product.create({
      data: {
        name: 'Premium Support',
        description: '24/7 priority support with dedicated account manager',
        unitPrice: 500,
        category: 'Support',
        sku: 'NCRM-SUP-001',
        isActive: true,
        ownerId: user.id,
      },
    }),
  ]);

  console.log(`✅ Created ${products.length} products`);

  // Create Meetings
  const meetings = await Promise.all([
    prisma.meeting.create({
      data: {
        title: 'TechCorp Implementation Kickoff',
        description: 'Initial meeting to discuss project scope and timeline',
        startTime: new Date('2026-03-05T10:00:00'),
        endTime: new Date('2026-03-05T11:30:00'),
        location: 'Zoom Meeting',
        ownerId: user.id,
        customerId: customers[0].id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'Global Finance Demo',
        description: 'Product demonstration for analytics platform',
        startTime: new Date('2026-03-08T14:00:00'),
        endTime: new Date('2026-03-08T15:00:00'),
        location: 'Microsoft Teams',
        ownerId: user.id,
        customerId: customers[1].id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'HealthFirst Technical Review',
        description: 'Technical architecture review with IT team',
        startTime: new Date('2026-03-10T09:00:00'),
        endTime: new Date('2026-03-10T10:30:00'),
        location: 'On-site - Boston Office',
        ownerId: user.id,
        customerId: customers[2].id,
      },
    }),
    prisma.meeting.create({
      data: {
        title: 'CloudScale Migration Planning',
        description: 'Detailed planning session for AWS migration',
        startTime: new Date('2026-03-03T15:00:00'),
        endTime: new Date('2026-03-03T17:00:00'),
        location: 'Google Meet',
        ownerId: user.id,
        customerId: customers[5].id,
      },
    }),
  ]);

  console.log(`✅ Created ${meetings.length} meetings`);

  // Create Notes
  await Promise.all([
    prisma.note.create({
      data: {
        content: 'Initial Discovery Call - TechCorp is looking to replace their legacy CRM. Key requirements: seamless integration with existing tools, mobile access, and advanced reporting. Budget approved for Q2.',
        ownerId: user.id,
        customerId: customers[0].id,
        dealId: deals[0].id,
      },
    }),
    prisma.note.create({
      data: {
        content: 'Compliance Discussion - Global Finance requires SOC 2 Type II compliance. Need to provide audit reports and security documentation before final approval.',
        ownerId: user.id,
        customerId: customers[1].id,
        dealId: deals[1].id,
      },
    }),
    prisma.note.create({
      data: {
        content: 'Technical Requirements - HealthFirst needs HIPAA-compliant hosting, encrypted data at rest, and integration with Epic EMR system. Timeline is flexible but aiming for Q3 go-live.',
        ownerId: user.id,
        customerId: customers[2].id,
        dealId: deals[2].id,
      },
    }),
  ]);

  console.log('✅ Created notes');

  // Create Notifications
  await Promise.all([
    prisma.notification.create({
      data: {
        type: NotificationType.TASK_DUE,
        title: 'Task Due Soon',
        message: 'Follow up with TechCorp on proposal is due tomorrow',
        read: false,
        userId: user.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.DEAL_STAGE_CHANGED,
        title: 'Deal Stage Updated',
        message: 'CloudScale migration deal moved to Negotiation stage',
        read: false,
        userId: user.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.REMINDER,
        title: 'Upcoming Meeting',
        message: 'TechCorp Implementation Kickoff starts in 1 hour',
        read: true,
        userId: user.id,
      },
    }),
    prisma.notification.create({
      data: {
        type: NotificationType.DEAL_WON,
        title: 'Deal Closed Won!',
        message: 'Fleet Management Solution deal worth $95,000 has been won',
        read: false,
        userId: user.id,
      },
    }),
  ]);

  console.log('✅ Created notifications');

  // Create Activities
  await Promise.all([
    prisma.activity.create({
      data: {
        type: ActivityType.CREATED,
        title: 'Discovery call with TechCorp',
        entityType: 'Customer',
        entityId: customers[0].id,
        details: { notes: 'Discussed current pain points and requirements', duration: 45, outcome: 'Positive - scheduling follow-up demo' },
        ownerId: user.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.EMAIL_SENT,
        title: 'Sent proposal to Global Finance',
        entityType: 'Deal',
        entityId: deals[1].id,
        details: { notes: 'Comprehensive proposal with pricing and timeline', outcome: 'Awaiting response' },
        ownerId: user.id,
      },
    }),
    prisma.activity.create({
      data: {
        type: ActivityType.UPDATED,
        title: 'On-site visit at RetailMax',
        entityType: 'Deal',
        entityId: deals[4].id,
        details: { notes: 'Met with store managers to understand POS requirements', duration: 120, outcome: 'Contract signed' },
        ownerId: user.id,
      },
    }),
  ]);

  console.log('✅ Created activities');

  console.log('\n🎉 Database seeding completed successfully!');
  console.log('\n📧 Demo credentials:');
  console.log('   Email: demo@nexuscrm.com');
  console.log('   Password: demo123456');
}

main()
  .catch((e) => {
    console.error('❌ Seeding error:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
