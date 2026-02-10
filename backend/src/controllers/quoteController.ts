import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

/**
 * Generate a unique quote number
 */
const generateQuoteNumber = async (userId: string): Promise<string> => {
  const count = await prisma.quote.count({ where: { ownerId: userId } });
  const num = (count + 1).toString().padStart(4, '0');
  return `QT-${new Date().getFullYear()}-${num}`;
};

/**
 * @desc    Get all quotes
 * @route   GET /api/quotes
 */
export const getQuotes = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { status, customerId, dealId, page = '1', limit = '20' } = req.query;
    const where: any = { ownerId: req.user?.id };

    if (status) where.status = status as string;
    if (customerId) where.customerId = customerId as string;
    if (dealId) where.dealId = dealId as string;

    const skip = (parseInt(page as string) - 1) * parseInt(limit as string);
    const take = parseInt(limit as string);

    const [quotes, total] = await Promise.all([
      prisma.quote.findMany({
        where,
        include: {
          customer: { select: { id: true, name: true, company: true } },
          deal: { select: { id: true, title: true } },
          lineItems: {
            include: { product: { select: { id: true, name: true, sku: true } } },
            orderBy: { sortOrder: 'asc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take,
      }),
      prisma.quote.count({ where }),
    ]);

    res.json({ success: true, data: quotes, total, page: parseInt(page as string), totalPages: Math.ceil(total / take) });
  } catch (error) {
    logger.error('Get quotes error:', error);
    res.status(500).json({ success: false, message: 'Error fetching quotes' });
  }
};

/**
 * @desc    Get single quote
 * @route   GET /api/quotes/:id
 */
export const getQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
      include: {
        customer: { select: { id: true, name: true, company: true, email: true, address: true } },
        deal: { select: { id: true, title: true } },
        lineItems: {
          include: { product: { select: { id: true, name: true, sku: true } } },
          orderBy: { sortOrder: 'asc' },
        },
      },
    });

    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }

    res.json({ success: true, data: quote });
  } catch (error) {
    logger.error('Get quote error:', error);
    res.status(500).json({ success: false, message: 'Error fetching quote' });
  }
};

/**
 * @desc    Create quote
 * @route   POST /api/quotes
 */
export const createQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { title, customerId, dealId, discount, discountType, tax, validUntil, notes, terms, lineItems } = req.body;

    if (!title || !customerId) {
      res.status(400).json({ success: false, message: 'Title and customer ID are required' });
      return;
    }

    const quoteNumber = await generateQuoteNumber(req.user?.id as string);

    // Calculate totals
    let subtotal = 0;
    const processedItems = (lineItems || []).map((item: any, index: number) => {
      const itemTotal = (item.quantity || 1) * (item.unitPrice || 0) - (item.discount || 0);
      subtotal += itemTotal;
      return {
        description: item.description,
        quantity: item.quantity || 1,
        unitPrice: item.unitPrice || 0,
        discount: item.discount || 0,
        total: itemTotal,
        sortOrder: index,
        productId: item.productId || null,
      };
    });

    const discountAmount = discountType === 'PERCENTAGE'
      ? subtotal * ((discount || 0) / 100)
      : (discount || 0);
    const taxAmount = (subtotal - discountAmount) * ((tax || 0) / 100);
    const total = subtotal - discountAmount + taxAmount;

    const quote = await prisma.quote.create({
      data: {
        quoteNumber,
        title,
        customerId,
        dealId: dealId || null,
        discount: discount || 0,
        discountType: discountType || 'PERCENTAGE',
        tax: tax || 0,
        subtotal,
        total,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        terms,
        ownerId: req.user?.id as string,
        lineItems: {
          create: processedItems,
        },
      },
      include: {
        customer: { select: { id: true, name: true } },
        lineItems: true,
      },
    });

    res.status(201).json({ success: true, data: quote });
  } catch (error) {
    logger.error('Create quote error:', error);
    res.status(500).json({ success: false, message: 'Error creating quote' });
  }
};

/**
 * @desc    Update quote
 * @route   PUT /api/quotes/:id
 */
export const updateQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.quote.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }

    const { lineItems, ...quoteData } = req.body;

    // If line items provided, replace them
    if (lineItems) {
      await prisma.lineItem.deleteMany({ where: { quoteId: req.params.id } });

      let subtotal = 0;
      const items = lineItems.map((item: any, index: number) => {
        const itemTotal = (item.quantity || 1) * (item.unitPrice || 0) - (item.discount || 0);
        subtotal += itemTotal;
        return {
          description: item.description,
          quantity: item.quantity || 1,
          unitPrice: item.unitPrice || 0,
          discount: item.discount || 0,
          total: itemTotal,
          sortOrder: index,
          productId: item.productId || null,
          quoteId: req.params.id,
        };
      });

      await prisma.lineItem.createMany({ data: items });

      const discountType = quoteData.discountType || existing.discountType;
      const discount = quoteData.discount ?? existing.discount;
      const tax = quoteData.tax ?? existing.tax;

      const discountAmount = discountType === 'PERCENTAGE'
        ? subtotal * (discount / 100)
        : discount;
      const taxAmount = (subtotal - discountAmount) * (tax / 100);
      quoteData.subtotal = subtotal;
      quoteData.total = subtotal - discountAmount + taxAmount;
    }

    const quote = await prisma.quote.update({
      where: { id: req.params.id },
      data: quoteData,
      include: {
        customer: { select: { id: true, name: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    res.json({ success: true, data: quote });
  } catch (error) {
    logger.error('Update quote error:', error);
    res.status(500).json({ success: false, message: 'Error updating quote' });
  }
};

/**
 * @desc    Delete quote
 * @route   DELETE /api/quotes/:id
 */
export const deleteQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.quote.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }

    await prisma.quote.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Quote deleted' });
  } catch (error) {
    logger.error('Delete quote error:', error);
    res.status(500).json({ success: false, message: 'Error deleting quote' });
  }
};

/**
 * @desc    Send quote to customer
 * @route   POST /api/quotes/:id/send
 */
export const sendQuote = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const quote = await prisma.quote.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
      include: {
        customer: { select: { id: true, name: true, email: true } },
        lineItems: { orderBy: { sortOrder: 'asc' } },
      },
    });

    if (!quote) {
      res.status(404).json({ success: false, message: 'Quote not found' });
      return;
    }

    if (!quote.customer.email) {
      res.status(400).json({ success: false, message: 'Customer has no email address' });
      return;
    }

    // Send quote email
    const { sendEmail } = await import('../lib/email');
    const itemRows = quote.lineItems.map(item =>
      `<tr><td style="padding:8px;border-bottom:1px solid #eee;">${item.description || ''}</td>
       <td style="padding:8px;border-bottom:1px solid #eee;text-align:center;">${item.quantity}</td>
       <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.unitPrice.toFixed(2)}</td>
       <td style="padding:8px;border-bottom:1px solid #eee;text-align:right;">$${item.total.toFixed(2)}</td></tr>`
    ).join('');

    const emailBody = `
      <h2>Quote ${quote.quoteNumber}</h2>
      <p>Dear ${quote.customer.name},</p>
      <p>${quote.title}</p>
      <table style="width:100%;border-collapse:collapse;margin:20px 0;">
        <thead><tr style="background:#f5f5f5;">
          <th style="padding:8px;text-align:left;">Description</th>
          <th style="padding:8px;text-align:center;">Qty</th>
          <th style="padding:8px;text-align:right;">Unit Price</th>
          <th style="padding:8px;text-align:right;">Total</th>
        </tr></thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr><td colspan="3" style="padding:8px;text-align:right;font-weight:bold;">Subtotal:</td><td style="padding:8px;text-align:right;">$${quote.subtotal.toFixed(2)}</td></tr>
          ${quote.discount > 0 ? `<tr><td colspan="3" style="padding:8px;text-align:right;">Discount:</td><td style="padding:8px;text-align:right;">-$${(quote.subtotal - quote.total + (quote.subtotal * quote.tax / 100)).toFixed(2)}</td></tr>` : ''}
          ${quote.tax > 0 ? `<tr><td colspan="3" style="padding:8px;text-align:right;">Tax (${quote.tax}%):</td><td style="padding:8px;text-align:right;">$${(quote.total - quote.subtotal + (quote.subtotal - quote.total + (quote.subtotal * quote.tax / 100))).toFixed(2)}</td></tr>` : ''}
          <tr><td colspan="3" style="padding:8px;text-align:right;font-weight:bold;font-size:18px;">Total:</td><td style="padding:8px;text-align:right;font-weight:bold;font-size:18px;">$${quote.total.toFixed(2)}</td></tr>
        </tfoot>
      </table>
      ${quote.notes ? `<p><strong>Notes:</strong> ${quote.notes}</p>` : ''}
      ${quote.terms ? `<p><strong>Terms:</strong> ${quote.terms}</p>` : ''}
      ${quote.validUntil ? `<p><em>Valid until: ${new Date(quote.validUntil).toLocaleDateString()}</em></p>` : ''}
    `;

    await sendEmail(quote.customer.email, `Quote ${quote.quoteNumber}: ${quote.title}`, emailBody);

    await prisma.quote.update({
      where: { id: req.params.id },
      data: { status: 'SENT', sentAt: new Date() },
    });

    res.json({ success: true, message: 'Quote sent to customer' });
  } catch (error) {
    logger.error('Send quote error:', error);
    res.status(500).json({ success: false, message: 'Error sending quote' });
  }
};
