import prisma from './prisma';
import logger from './logger';

/**
 * Seeds demo CRM data for a newly created user.
 * Called automatically when a Clerk user is auto-provisioned.
 */
export async function seedDemoDataForUser(userId: string): Promise<void> {
  try {
    // Check if user already has data
    const existingCount = await prisma.customer.count({ where: { ownerId: userId } });
    if (existingCount > 0) return;

    logger.info(`Seeding demo data for new user: ${userId}`);

    // Create Customers
    const customers = await Promise.all([
      prisma.customer.create({
        data: {
          name: 'TechCorp Industries', email: 'contact@techcorp.com',
          phone: '+1 (555) 234-5678', company: 'TechCorp Industries',
          address: '100 Innovation Drive, San Francisco, CA 94105',
          status: 'ACTIVE', source: 'WEBSITE', industry: 'Technology',
          website: 'https://techcorp.com', tags: ['enterprise', 'technology', 'vip'],
          ownerId: userId,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'Global Finance Ltd', email: 'info@globalfinance.com',
          phone: '+1 (555) 345-6789', company: 'Global Finance Ltd',
          address: '200 Wall Street, New York, NY 10005',
          status: 'ACTIVE', source: 'REFERRAL', industry: 'Finance',
          website: 'https://globalfinance.com', tags: ['finance', 'enterprise'],
          ownerId: userId,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'HealthFirst Medical', email: 'admin@healthfirst.com',
          phone: '+1 (555) 456-7890', company: 'HealthFirst Medical Group',
          address: '300 Medical Center Blvd, Boston, MA 02115',
          status: 'ACTIVE', source: 'TRADE_SHOW', industry: 'Healthcare',
          tags: ['healthcare', 'medical'],
          ownerId: userId,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'EcoGreen Solutions', email: 'hello@ecogreen.com',
          phone: '+1 (555) 567-8901', company: 'EcoGreen Solutions Inc',
          status: 'LEAD', source: 'SOCIAL_MEDIA', industry: 'Environmental',
          tags: ['green', 'startup'],
          ownerId: userId,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'RetailMax Corp', email: 'sales@retailmax.com',
          phone: '+1 (555) 678-9012', company: 'RetailMax Corporation',
          address: '500 Commerce Street, Chicago, IL 60601',
          status: 'ACTIVE', source: 'EMAIL_CAMPAIGN', industry: 'Retail',
          tags: ['retail', 'enterprise'],
          ownerId: userId,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'CloudScale Tech', email: 'info@cloudscale.io',
          phone: '+1 (555) 789-0123', company: 'CloudScale Technologies',
          address: '600 Cloud Avenue, Seattle, WA 98101',
          status: 'ACTIVE', source: 'PARTNER', industry: 'Cloud Computing',
          tags: ['saas', 'cloud', 'tech'],
          ownerId: userId,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'MediaWorks Studio', email: 'contact@mediaworks.com',
          phone: '+1 (555) 890-1234', company: 'MediaWorks Creative Studio',
          status: 'LEAD', source: 'COLD_CALL', industry: 'Media',
          tags: ['media', 'creative'],
          ownerId: userId,
        },
      }),
      prisma.customer.create({
        data: {
          name: 'AutoDrive Motors', email: 'fleet@autodrive.com',
          phone: '+1 (555) 901-2345', company: 'AutoDrive Motors Inc',
          address: '800 Motor Way, Detroit, MI 48201',
          status: 'ACTIVE', source: 'REFERRAL', industry: 'Automotive',
          tags: ['automotive', 'fleet'],
          ownerId: userId,
        },
      }),
    ]);

    // Create Deals
    const deals = await Promise.all([
      prisma.deal.create({
        data: {
          title: 'Enterprise CRM Implementation', value: 125000,
          description: 'Full CRM system deployment for TechCorp',
          stage: 'NEGOTIATION', probability: 75,
          expectedCloseDate: new Date('2026-04-15'),
          ownerId: userId, customerId: customers[0].id,
        },
      }),
      prisma.deal.create({
        data: {
          title: 'Financial Analytics Platform', value: 85000,
          description: 'Custom analytics dashboard and reporting solution',
          stage: 'PROPOSAL', probability: 60,
          expectedCloseDate: new Date('2026-05-01'),
          ownerId: userId, customerId: customers[1].id,
        },
      }),
      prisma.deal.create({
        data: {
          title: 'Healthcare Data Integration', value: 200000,
          description: 'Patient management system integration',
          stage: 'QUALIFIED', probability: 40,
          expectedCloseDate: new Date('2026-06-30'),
          ownerId: userId, customerId: customers[2].id,
        },
      }),
      prisma.deal.create({
        data: {
          title: 'Sustainability Tracking Software', value: 45000,
          stage: 'LEAD', probability: 20,
          expectedCloseDate: new Date('2026-07-15'),
          ownerId: userId, customerId: customers[3].id,
        },
      }),
      prisma.deal.create({
        data: {
          title: 'Retail POS Integration', value: 175000,
          description: 'Point of sale integration across 50 locations',
          stage: 'CLOSED_WON', probability: 100,
          expectedCloseDate: new Date('2026-02-01'),
          ownerId: userId, customerId: customers[4].id,
        },
      }),
      prisma.deal.create({
        data: {
          title: 'Cloud Migration Services', value: 320000,
          description: 'Complete AWS infrastructure migration',
          stage: 'NEGOTIATION', probability: 80,
          expectedCloseDate: new Date('2026-03-20'),
          ownerId: userId, customerId: customers[5].id,
        },
      }),
      prisma.deal.create({
        data: {
          title: 'Content Management System', value: 65000,
          stage: 'PROPOSAL', probability: 50,
          expectedCloseDate: new Date('2026-04-30'),
          ownerId: userId, customerId: customers[6].id,
        },
      }),
      prisma.deal.create({
        data: {
          title: 'Fleet Management Solution', value: 95000,
          description: 'GPS tracking for 200 vehicles',
          stage: 'CLOSED_WON', probability: 100,
          expectedCloseDate: new Date('2026-01-15'),
          ownerId: userId, customerId: customers[7].id,
        },
      }),
    ]);

    // Create Tasks
    await Promise.all([
      prisma.task.create({
        data: {
          title: 'Follow up with TechCorp on proposal',
          description: 'Schedule a call to discuss CRM implementation timeline',
          priority: 'HIGH', status: 'IN_PROGRESS',
          dueDate: new Date('2026-03-01'),
          assignedToId: userId, createdById: userId,
          customerId: customers[0].id, dealId: deals[0].id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Prepare financial analytics demo',
          priority: 'HIGH', status: 'PENDING',
          dueDate: new Date('2026-03-05'),
          assignedToId: userId, createdById: userId,
          customerId: customers[1].id, dealId: deals[1].id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Review healthcare compliance requirements',
          description: 'Verify HIPAA compliance for HealthFirst',
          priority: 'URGENT', status: 'PENDING',
          dueDate: new Date('2026-03-03'),
          assignedToId: userId, createdById: userId,
          customerId: customers[2].id, dealId: deals[2].id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Send EcoGreen product brochure',
          priority: 'MEDIUM', status: 'COMPLETED',
          dueDate: new Date('2026-02-25'),
          assignedToId: userId, createdById: userId,
          customerId: customers[3].id, dealId: deals[3].id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Schedule RetailMax training session',
          priority: 'MEDIUM', status: 'IN_PROGRESS',
          dueDate: new Date('2026-03-10'),
          assignedToId: userId, createdById: userId,
          customerId: customers[4].id, dealId: deals[4].id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Finalize CloudScale migration plan',
          priority: 'HIGH', status: 'PENDING',
          dueDate: new Date('2026-03-02'),
          assignedToId: userId, createdById: userId,
          customerId: customers[5].id, dealId: deals[5].id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'Create MediaWorks wireframes',
          priority: 'LOW', status: 'PENDING',
          dueDate: new Date('2026-03-15'),
          assignedToId: userId, createdById: userId,
          customerId: customers[6].id, dealId: deals[6].id,
        },
      }),
      prisma.task.create({
        data: {
          title: 'AutoDrive quarterly review',
          priority: 'MEDIUM', status: 'PENDING',
          dueDate: new Date('2026-03-20'),
          assignedToId: userId, createdById: userId,
          customerId: customers[7].id, dealId: deals[7].id,
        },
      }),
    ]);

    // Create Contacts
    await Promise.all([
      prisma.contact.create({
        data: { firstName: 'Sarah', lastName: 'Chen', email: 'sarah.chen@techcorp.com', phone: '+1 (555) 234-5680', title: 'VP of Engineering', isPrimary: true, ownerId: userId, customerId: customers[0].id },
      }),
      prisma.contact.create({
        data: { firstName: 'Michael', lastName: 'Roberts', email: 'mroberts@globalfinance.com', phone: '+1 (555) 345-6791', title: 'CFO', isPrimary: true, ownerId: userId, customerId: customers[1].id },
      }),
      prisma.contact.create({
        data: { firstName: 'Emily', lastName: 'Watson', email: 'ewatson@healthfirst.com', title: 'CTO', isPrimary: true, ownerId: userId, customerId: customers[2].id },
      }),
      prisma.contact.create({
        data: { firstName: 'David', lastName: 'Green', email: 'david@ecogreen.com', title: 'Founder & CEO', isPrimary: true, ownerId: userId, customerId: customers[3].id },
      }),
      prisma.contact.create({
        data: { firstName: 'Jennifer', lastName: 'Martinez', email: 'jmartinez@retailmax.com', title: 'Head of IT', isPrimary: true, ownerId: userId, customerId: customers[4].id },
      }),
      prisma.contact.create({
        data: { firstName: 'Alex', lastName: 'Kumar', email: 'alex@cloudscale.io', title: 'Chief Architect', isPrimary: true, ownerId: userId, customerId: customers[5].id },
      }),
    ]);

    // Create Products
    await Promise.all([
      prisma.product.create({ data: { name: 'Nexus CRM Enterprise', description: 'Full-featured CRM with AI insights', unitPrice: 299, category: 'Software', sku: `NCRM-ENT-${userId.slice(-6)}`, isActive: true, ownerId: userId } }),
      prisma.product.create({ data: { name: 'Nexus CRM Professional', description: 'Professional CRM with team collaboration', unitPrice: 149, category: 'Software', sku: `NCRM-PRO-${userId.slice(-6)}`, isActive: true, ownerId: userId } }),
      prisma.product.create({ data: { name: 'Nexus CRM Starter', description: 'Essential CRM for small teams', unitPrice: 49, category: 'Software', sku: `NCRM-STR-${userId.slice(-6)}`, isActive: true, ownerId: userId } }),
      prisma.product.create({ data: { name: 'Implementation Services', description: 'Professional implementation and data migration', unitPrice: 5000, category: 'Services', sku: `NCRM-IMP-${userId.slice(-6)}`, isActive: true, ownerId: userId } }),
      prisma.product.create({ data: { name: 'Premium Support', description: '24/7 priority support with dedicated manager', unitPrice: 500, category: 'Support', sku: `NCRM-SUP-${userId.slice(-6)}`, isActive: true, ownerId: userId } }),
    ]);

    // Create Meetings
    await Promise.all([
      prisma.meeting.create({ data: { title: 'TechCorp Implementation Kickoff', description: 'Discuss project scope and timeline', startTime: new Date('2026-03-05T10:00:00'), endTime: new Date('2026-03-05T11:30:00'), location: 'Zoom Meeting', ownerId: userId, customerId: customers[0].id } }),
      prisma.meeting.create({ data: { title: 'Global Finance Demo', description: 'Product demonstration for analytics', startTime: new Date('2026-03-08T14:00:00'), endTime: new Date('2026-03-08T15:00:00'), location: 'Microsoft Teams', ownerId: userId, customerId: customers[1].id } }),
      prisma.meeting.create({ data: { title: 'CloudScale Migration Planning', description: 'AWS migration planning session', startTime: new Date('2026-03-03T15:00:00'), endTime: new Date('2026-03-03T17:00:00'), location: 'Google Meet', ownerId: userId, customerId: customers[5].id } }),
    ]);

    // Create Notifications
    await Promise.all([
      prisma.notification.create({ data: { type: 'TASK_DUE', title: 'Task Due Soon', message: 'Follow up with TechCorp on proposal is due tomorrow', read: false, userId } }),
      prisma.notification.create({ data: { type: 'DEAL_STAGE_CHANGED', title: 'Deal Stage Updated', message: 'CloudScale migration deal moved to Negotiation', read: false, userId } }),
      prisma.notification.create({ data: { type: 'DEAL_WON', title: 'Deal Closed Won!', message: 'Fleet Management Solution worth $95,000 has been won', read: false, userId } }),
    ]);

    // Create Notes
    await Promise.all([
      prisma.note.create({ data: { content: 'TechCorp: Looking to replace legacy CRM. Key requirements: integration, mobile access, advanced reporting. Budget approved for Q2.', ownerId: userId, customerId: customers[0].id, dealId: deals[0].id } }),
      prisma.note.create({ data: { content: 'Global Finance: Requires SOC 2 Type II compliance. Need audit reports and security docs before approval.', ownerId: userId, customerId: customers[1].id, dealId: deals[1].id } }),
    ]);

    logger.info(`Demo data seeded successfully for user: ${userId}`);
  } catch (error) {
    logger.error('Error seeding demo data for user:', error);
    // Don't throw - seeding failure shouldn't block authentication
  }
}
