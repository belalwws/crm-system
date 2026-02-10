import { Response } from 'express';
import prisma from '../lib/prisma';
import { AuthRequest } from '../types';
import logger from '../lib/logger';

/**
 * @desc    Get custom fields for an entity type
 * @route   GET /api/custom-fields?entity=customer
 */
export const getCustomFields = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { entity } = req.query;
    const where: any = { ownerId: req.user?.id };
    if (entity) where.entity = entity as string;

    const fields = await prisma.customField.findMany({
      where,
      orderBy: { sortOrder: 'asc' },
    });

    res.json({ success: true, data: fields });
  } catch (error) {
    logger.error('Get custom fields error:', error);
    res.status(500).json({ success: false, message: 'Error fetching custom fields' });
  }
};

/**
 * @desc    Create custom field
 * @route   POST /api/custom-fields
 */
export const createCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { name, label, fieldType, entity, isRequired, options, defaultValue, sortOrder } = req.body;

    if (!name || !label || !fieldType || !entity) {
      res.status(400).json({ success: false, message: 'name, label, fieldType, and entity are required' });
      return;
    }

    const validEntities = ['customer', 'deal', 'task', 'contact'];
    if (!validEntities.includes(entity)) {
      res.status(400).json({ success: false, message: `entity must be one of: ${validEntities.join(', ')}` });
      return;
    }

    const field = await prisma.customField.create({
      data: {
        name,
        label,
        fieldType,
        entity,
        isRequired: isRequired || false,
        options: options || null,
        defaultValue,
        sortOrder: sortOrder || 0,
        ownerId: req.user?.id as string,
      },
    });

    res.status(201).json({ success: true, data: field });
  } catch (error) {
    logger.error('Create custom field error:', error);
    res.status(500).json({ success: false, message: 'Error creating custom field' });
  }
};

/**
 * @desc    Update custom field
 * @route   PUT /api/custom-fields/:id
 */
export const updateCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.customField.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Custom field not found' });
      return;
    }

    const { name, label, fieldType, isRequired, options, defaultValue, sortOrder } = req.body;
    const field = await prisma.customField.update({
      where: { id: req.params.id },
      data: {
        ...(name !== undefined && { name }),
        ...(label !== undefined && { label }),
        ...(fieldType !== undefined && { fieldType }),
        ...(isRequired !== undefined && { isRequired }),
        ...(options !== undefined && { options }),
        ...(defaultValue !== undefined && { defaultValue }),
        ...(sortOrder !== undefined && { sortOrder }),
      },
    });

    res.json({ success: true, data: field });
  } catch (error) {
    logger.error('Update custom field error:', error);
    res.status(500).json({ success: false, message: 'Error updating custom field' });
  }
};

/**
 * @desc    Delete custom field
 * @route   DELETE /api/custom-fields/:id
 */
export const deleteCustomField = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const existing = await prisma.customField.findFirst({
      where: { id: req.params.id, ownerId: req.user?.id },
    });

    if (!existing) {
      res.status(404).json({ success: false, message: 'Custom field not found' });
      return;
    }

    await prisma.customField.delete({ where: { id: req.params.id } });
    res.json({ success: true, message: 'Custom field deleted' });
  } catch (error) {
    logger.error('Delete custom field error:', error);
    res.status(500).json({ success: false, message: 'Error deleting custom field' });
  }
};

/**
 * @desc    Get custom field values for an entity
 * @route   GET /api/custom-fields/values/:entityId
 */
export const getCustomFieldValues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const values = await prisma.customFieldValue.findMany({
      where: { entityId: req.params.entityId },
      include: { field: true },
    });

    res.json({ success: true, data: values });
  } catch (error) {
    logger.error('Get custom field values error:', error);
    res.status(500).json({ success: false, message: 'Error fetching values' });
  }
};

/**
 * @desc    Set custom field value for an entity
 * @route   PUT /api/custom-fields/values/:entityId
 */
export const setCustomFieldValues = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { values } = req.body; // Array of { fieldId, value }

    if (!Array.isArray(values)) {
      res.status(400).json({ success: false, message: 'values must be an array of { fieldId, value }' });
      return;
    }

    const results = await Promise.all(
      values.map((v: { fieldId: string; value: string }) =>
        prisma.customFieldValue.upsert({
          where: {
            fieldId_entityId: { fieldId: v.fieldId, entityId: req.params.entityId },
          },
          update: { value: v.value },
          create: { fieldId: v.fieldId, entityId: req.params.entityId, value: v.value },
        })
      )
    );

    res.json({ success: true, data: results });
  } catch (error) {
    logger.error('Set custom field values error:', error);
    res.status(500).json({ success: false, message: 'Error saving values' });
  }
};
