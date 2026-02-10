import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

/**
 * @desc    Get all products
 * @route   GET /api/products
 */
export const getProducts = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { search, category, active } = req.query;
    const where: any = { ownerId: req.user?.id };

    if (search) {
      where.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { sku: { contains: search as string, mode: 'insensitive' } },
      ];
    }
    if (category) where.category = category as string;
    if (active !== undefined) where.isActive = active === 'true';

    const products = await prisma.product.findMany({
      where,
      orderBy: { name: 'asc' },
    });

    res.json({ success: true, data: products, total: products.length });
  } catch (error) {
    logger.error('Get products error:', error);
    res.status(500).json({ success: false, message: 'Error fetching products' });
  }
};

/**
 * @desc    Get single product
 * @route   GET /api/products/:id
 */
export const getProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const product = await prisma.product.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!product) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Get product error:', error);
    res.status(500).json({ success: false, message: 'Error fetching product' });
  }
};

/**
 * @desc    Create product
 * @route   POST /api/products
 */
export const createProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, sku, description, unitPrice, currency, category } = req.body;

    if (!name) {
      res.status(400).json({ success: false, message: 'Product name is required' });
      return;
    }

    const product = await prisma.product.create({
      data: {
        name,
        sku,
        description,
        unitPrice: unitPrice || 0,
        currency: currency || 'USD',
        category,
        ownerId: req.user?.id as string,
      },
    });

    res.status(201).json({ success: true, data: product });
  } catch (error) {
    logger.error('Create product error:', error);
    res.status(500).json({ success: false, message: 'Error creating product' });
  }
};

/**
 * @desc    Update product
 * @route   PUT /api/products/:id
 */
export const updateProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });

    res.json({ success: true, data: product });
  } catch (error) {
    logger.error('Update product error:', error);
    res.status(500).json({ success: false, message: 'Error updating product' });
  }
};

/**
 * @desc    Delete product
 * @route   DELETE /api/products/:id
 */
export const deleteProduct = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.product.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Product not found' });
      return;
    }

    await prisma.product.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Product deleted' });
  } catch (error) {
    logger.error('Delete product error:', error);
    res.status(500).json({ success: false, message: 'Error deleting product' });
  }
};
