/**
 * AI Service - NVIDIA NIM API Integration
 * خدمة الذكاء الاصطناعي باستخدام NVIDIA NIM
 */

const NVIDIA_API_URL = 'https://integrate.api.nvidia.com/v1/chat/completions';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY || '';
const DEFAULT_MODEL = 'meta/llama-3.3-70b-instruct';

interface ChatMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface AIResponse {
  content: string;
  model: string;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}

/**
 * Call NVIDIA NIM API
 */
async function callNvidiaAPI(
  messages: ChatMessage[],
  options: {
    model?: string;
    temperature?: number;
    maxTokens?: number;
    stream?: boolean;
  } = {}
): Promise<AIResponse> {
  const {
    model = DEFAULT_MODEL,
    temperature = 0.7,
    maxTokens = 2048,
  } = options;

  const response = await fetch(NVIDIA_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    },
    body: JSON.stringify({
      model,
      messages,
      temperature,
      max_tokens: maxTokens,
      top_p: 0.9,
    }),
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`NVIDIA API Error: ${response.status} - ${error}`);
  }

  const data = await response.json() as any;
  
  return {
    content: data.choices[0]?.message?.content || '',
    model: data.model,
    usage: data.usage,
  };
}

/**
 * CRM System Prompt
 */
const CRM_SYSTEM_PROMPT = `You are an intelligent CRM AI assistant called "Nexus AI". You help sales teams and business professionals manage their customer relationships more effectively.

Your capabilities include:
1. Analyzing customer data and providing insights
2. Suggesting next best actions for deals and customers
3. Writing professional emails and follow-ups
4. Summarizing customer interactions and history
5. Predicting deal outcomes based on patterns
6. Recommending task priorities
7. Providing sales coaching and tips

Guidelines:
- Be concise and actionable in your responses
- Focus on data-driven insights when available
- Use a professional but friendly tone
- Format responses with markdown for readability
- When analyzing data, highlight key metrics and trends
- Always provide specific, actionable recommendations`;

/**
 * AI Chat - General CRM Assistant
 */
export async function aiChat(
  userMessage: string,
  context?: string,
  conversationHistory?: ChatMessage[]
): Promise<AIResponse> {
  const messages: ChatMessage[] = [
    { role: 'system', content: CRM_SYSTEM_PROMPT },
  ];

  if (context) {
    messages.push({
      role: 'system',
      content: `Current CRM Context:\n${context}`,
    });
  }

  if (conversationHistory) {
    messages.push(...conversationHistory);
  }

  messages.push({ role: 'user', content: userMessage });

  return callNvidiaAPI(messages, { temperature: 0.7, maxTokens: 2048 });
}

/**
 * AI Email Composer
 */
export async function aiComposeEmail(params: {
  customerName: string;
  customerCompany?: string;
  purpose: string;
  tone?: string;
  additionalContext?: string;
  dealInfo?: string;
}): Promise<AIResponse> {
  const { customerName, customerCompany, purpose, tone = 'professional', additionalContext, dealInfo } = params;

  const prompt = `Compose a professional email with the following details:

**Recipient:** ${customerName}${customerCompany ? ` from ${customerCompany}` : ''}
**Purpose:** ${purpose}
**Tone:** ${tone}
${dealInfo ? `**Deal Context:** ${dealInfo}` : ''}
${additionalContext ? `**Additional Context:** ${additionalContext}` : ''}

Please provide:
1. A compelling subject line
2. The full email body

Format as:
**Subject:** [subject line]

**Body:**
[email body]`;

  return callNvidiaAPI(
    [
      {
        role: 'system',
        content: 'You are a professional email writer for a CRM system. Write clear, engaging, and effective business emails. Always include a subject line and body.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.7, maxTokens: 1500 }
  );
}

/**
 * AI Customer Insights
 */
export async function aiCustomerInsights(customerData: {
  name: string;
  email: string;
  company?: string;
  status: string;
  deals?: Array<{ title: string; value: number; stage: string }>;
  tasks?: Array<{ title: string; status: string; priority: string }>;
  notes?: Array<{ content: string; createdAt: string }>;
  totalInteractions?: number;
  lastActivity?: string;
}): Promise<AIResponse> {
  const prompt = `Analyze this customer profile and provide actionable insights:

**Customer:** ${customerData.name}
**Email:** ${customerData.email}
**Company:** ${customerData.company || 'N/A'}
**Status:** ${customerData.status}
**Last Activity:** ${customerData.lastActivity || 'Unknown'}

**Deals (${customerData.deals?.length || 0}):**
${customerData.deals?.map(d => `- ${d.title}: $${d.value} (${d.stage})`).join('\n') || 'None'}

**Tasks (${customerData.tasks?.length || 0}):**
${customerData.tasks?.map(t => `- ${t.title}: ${t.status} (${t.priority})`).join('\n') || 'None'}

**Notes (${customerData.notes?.length || 0}):**
${customerData.notes?.slice(0, 5).map(n => `- ${n.content.substring(0, 100)}`).join('\n') || 'None'}

Please provide:
1. **Customer Health Score** (1-10) with explanation
2. **Key Insights** - What stands out about this customer?
3. **Risk Factors** - Any warning signs?
4. **Recommendations** - Next best actions for this customer
5. **Engagement Strategy** - How to improve the relationship`;

  return callNvidiaAPI(
    [
      {
        role: 'system',
        content: 'You are a CRM analytics expert. Analyze customer data and provide actionable business insights. Be specific and data-driven.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.5, maxTokens: 2000 }
  );
}

/**
 * AI Deal Analysis & Prediction
 */
export async function aiDealAnalysis(dealData: {
  title: string;
  value: number;
  stage: string;
  probability: number;
  expectedCloseDate?: string;
  customerName: string;
  customerCompany?: string;
  daysSinceCreated: number;
  notes?: string[];
  tasks?: Array<{ title: string; status: string }>;
}): Promise<AIResponse> {
  const prompt = `Analyze this deal and predict its outcome:

**Deal:** ${dealData.title}
**Value:** $${dealData.value.toLocaleString()}
**Current Stage:** ${dealData.stage}
**Probability:** ${dealData.probability}%
**Expected Close:** ${dealData.expectedCloseDate || 'Not set'}
**Days in Pipeline:** ${dealData.daysSinceCreated}
**Customer:** ${dealData.customerName}${dealData.customerCompany ? ` (${dealData.customerCompany})` : ''}

**Open Tasks:** ${dealData.tasks?.filter(t => t.status !== 'COMPLETED').length || 0}
**Notes:** ${dealData.notes?.length || 0} entries

Please provide:
1. **Win Probability Assessment** - Your estimate and why
2. **Deal Health** - Is the deal progressing well?
3. **Risk Analysis** - What could go wrong?
4. **Recommended Actions** - Top 3 actions to move this deal forward
5. **Timeline Assessment** - Is the expected close date realistic?`;

  return callNvidiaAPI(
    [
      {
        role: 'system',
        content: 'You are a sales analytics expert for a CRM system. Analyze deal data and provide accurate predictions and actionable recommendations. Be realistic but helpful.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.4, maxTokens: 2000 }
  );
}

/**
 * AI Task Prioritization
 */
export async function aiTaskPrioritization(tasks: Array<{
  title: string;
  description?: string;
  priority: string;
  status: string;
  dueDate?: string;
  customerName?: string;
  dealTitle?: string;
  dealValue?: number;
}>): Promise<AIResponse> {
  const prompt = `Analyze and prioritize these tasks for optimal productivity:

${tasks.map((t, i) => `${i + 1}. **${t.title}**
   - Priority: ${t.priority} | Status: ${t.status}
   - Due: ${t.dueDate || 'No deadline'}
   ${t.customerName ? `- Customer: ${t.customerName}` : ''}
   ${t.dealTitle ? `- Deal: ${t.dealTitle} ($${t.dealValue?.toLocaleString() || 0})` : ''}
   ${t.description ? `- Details: ${t.description.substring(0, 100)}` : ''}`).join('\n\n')}

Please provide:
1. **Recommended Priority Order** - Reorder tasks by importance
2. **Rationale** - Why this order?
3. **Quick Wins** - Which tasks can be completed fastest?
4. **Critical Items** - Which need immediate attention?
5. **Time Management Tips** - How to handle this workload`;

  return callNvidiaAPI(
    [
      {
        role: 'system',
        content: 'You are a productivity and sales task management expert. Help prioritize CRM tasks for maximum impact and efficiency.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.4, maxTokens: 2000 }
  );
}

/**
 * AI Summary Generator
 */
export async function aiSummarize(params: {
  type: 'customer' | 'deal' | 'meeting' | 'notes';
  data: string;
}): Promise<AIResponse> {
  const typeLabels = {
    customer: 'customer interaction history',
    deal: 'deal progression',
    meeting: 'meeting notes and outcomes',
    notes: 'notes and observations',
  };

  const prompt = `Summarize the following ${typeLabels[params.type]}:

${params.data}

Provide:
1. **Executive Summary** (2-3 sentences)
2. **Key Points** (bullet points)
3. **Action Items** (if any)
4. **Sentiment/Outlook** (positive/neutral/negative)`;

  return callNvidiaAPI(
    [
      {
        role: 'system',
        content: 'You are a CRM assistant that creates concise, insightful summaries. Focus on actionable information and key takeaways.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.3, maxTokens: 1500 }
  );
}

/**
 * AI Dashboard Insights
 */
export async function aiDashboardInsights(stats: {
  totalCustomers: number;
  activeCustomers: number;
  totalDeals: number;
  wonDeals: number;
  lostDeals: number;
  totalDealValue: number;
  wonValue: number;
  pendingTasks: number;
  overdueTasks: number;
  averageDealCycle?: number;
  conversionRate?: number;
}): Promise<AIResponse> {
  const prompt = `Analyze these CRM dashboard metrics and provide business insights:

**Customers:** ${stats.totalCustomers} total, ${stats.activeCustomers} active
**Deals:** ${stats.totalDeals} total, ${stats.wonDeals} won, ${stats.lostDeals} lost
**Revenue:** $${stats.totalDealValue.toLocaleString()} pipeline, $${stats.wonValue.toLocaleString()} won
**Win Rate:** ${stats.totalDeals > 0 ? ((stats.wonDeals / stats.totalDeals) * 100).toFixed(1) : 0}%
**Tasks:** ${stats.pendingTasks} pending, ${stats.overdueTasks} overdue
${stats.conversionRate ? `**Conversion Rate:** ${stats.conversionRate}%` : ''}

Provide:
1. **Performance Summary** - How is the business doing?
2. **Key Metrics Analysis** - What do the numbers tell us?
3. **Areas of Concern** - What needs attention?
4. **Opportunities** - Where can we improve?
5. **Recommendations** - Top 3 actions to take this week`;

  return callNvidiaAPI(
    [
      {
        role: 'system',
        content: 'You are a business intelligence analyst for a CRM system. Provide actionable insights from dashboard metrics. Be concise and focus on what matters most.',
      },
      { role: 'user', content: prompt },
    ],
    { temperature: 0.5, maxTokens: 1500 }
  );
}

export {
  callNvidiaAPI,
  ChatMessage,
  AIResponse,
  CRM_SYSTEM_PROMPT,
};
