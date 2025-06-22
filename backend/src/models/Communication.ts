/**
 * Communication Model
 * 
 * This model represents communication records in the system, including SMS, email,
 * push notifications, and WhatsApp messages. It handles message content, recipients,
 * scheduling, delivery status, and integration with WhatsApp templates.
 */
import { Model, ModelObject, RelationMappings } from 'objection';
import { v4 as uuidv4 } from 'uuid';
import { BaseModel } from '../config/database';
import User from './User';

// Communication types enum
export enum CommunicationType {
  SMS = 'sms',
  EMAIL = 'email',
  PUSH = 'push',
  WHATSAPP = 'whatsapp',
}

// Communication status enum
export enum CommunicationStatus {
  DRAFT = 'draft',
  SCHEDULED = 'scheduled',
  SENT = 'sent',
  FAILED = 'failed',
}

// Communication priority enum
export enum CommunicationPriority {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  URGENT = 'urgent',
}

// Communication delivery report interface (matches migration)
export interface CommunicationDeliveryReport {
  id: string;
  communicationId: string;
  recipientId?: string;
  recipientContact: string;
  status: 'delivered' | 'failed' | 'pending';
  deliveredAt?: Date;
  failureReason?: string;
  retryCount?: number;
  externalReference?: string;
  providerResponse?: Record<string, any>;
}

export class Communication extends BaseModel {
  // Table name
  static tableName = 'communications';

  // Define properties with TypeScript types
  id!: string;
  title!: string;
  message!: string;
  type!: CommunicationType;
  recipients!: string[]; // Stored as JSONB array of strings
  scheduledDate?: Date;
  sentDate?: Date;
  status!: CommunicationStatus;

  // Extended fields from migration
  templateId?: string;
  messageVariables?: Record<string, any>; // Stored as JSONB
  subject?: string;
  priority?: CommunicationPriority;
  deliveryReports?: CommunicationDeliveryReport[]; // Stored as JSONB
  failureReason?: string;
  retryCount?: number;
  maxRetries?: number;
  deliveredCount?: number;
  failedCount?: number;
  pendingCount?: number;
  deliverySuccessRate?: number;
  isWhatsappTemplate?: boolean;
  whatsappTemplateNamespace?: string;
  whatsappTemplateName?: string;
  whatsappTemplateLanguage?: string;
  whatsappComponents?: string; // Stored as JSON string
  whatsappButtons?: string; // Stored as JSON string
  whatsappCallbackData?: string;
  category?: string;
  campaignId?: string;
  tags?: string[]; // Stored as JSONB array of strings
  attachments?: string[]; // Stored as JSONB array of strings
  hasAttachments?: boolean;
  openCount?: number;
  clickCount?: number;
  lastInteractionDate?: Date;
  trackingData?: Record<string, any>; // Stored as JSONB

  // Audit fields
  createdBy?: string;
  updatedBy?: string;
  sentBy?: string;

  // Timestamps from BaseModel
  createdAt!: Date;
  updatedAt!: Date;
  deletedAt?: Date;

  // JSON Schema for validation
  static jsonSchema = {
    type: 'object',
    required: ['title', 'message', 'type', 'recipients', 'status'],

    properties: {
      id: { type: 'string', format: 'uuid' },
      title: { type: 'string', minLength: 1, maxLength: 255 },
      message: { type: 'string', minLength: 1 },
      type: { type: 'string', enum: Object.values(CommunicationType) },
      recipients: { type: 'array', items: { type: 'string' } },
      scheduledDate: { type: ['string', 'null'], format: 'date-time' },
      sentDate: { type: ['string', 'null'], format: 'date-time' },
      status: { type: 'string', enum: Object.values(CommunicationStatus) },

      templateId: { type: ['string', 'null'] },
      messageVariables: { type: ['object', 'null'] },
      subject: { type: ['string', 'null'], maxLength: 255 },
      priority: { type: ['string', 'null'], enum: Object.values(CommunicationPriority) },
      deliveryReports: { type: ['array', 'null'], items: { type: 'object' } }, // More detailed schema for delivery reports can be added
      failureReason: { type: ['string', 'null'] },
      retryCount: { type: ['integer', 'null'], minimum: 0 },
      maxRetries: { type: ['integer', 'null'], minimum: 0 },
      deliveredCount: { type: ['integer', 'null'], minimum: 0 },
      failedCount: { type: ['integer', 'null'], minimum: 0 },
      pendingCount: { type: ['integer', 'null'], minimum: 0 },
      deliverySuccessRate: { type: ['number', 'null'], minimum: 0, maximum: 100 },
      isWhatsappTemplate: { type: ['boolean', 'null'] },
      whatsappTemplateNamespace: { type: ['string', 'null'] },
      whatsappTemplateName: { type: ['string', 'null'] },
      whatsappTemplateLanguage: { type: ['string', 'null'] },
      whatsappComponents: { type: ['string', 'null'] }, // Stored as JSON string
      whatsappButtons: { type: ['string', 'null'] }, // Stored as JSON string
      whatsappCallbackData: { type: ['string', 'null'] },
      category: { type: ['string', 'null'] },
      campaignId: { type: ['string', 'null'] },
      tags: { type: ['array', 'null'], items: { type: 'string' } },
      attachments: { type: ['array', 'null'], items: { type: 'string' } },
      hasAttachments: { type: ['boolean', 'null'] },
      openCount: { type: ['integer', 'null'], minimum: 0 },
      clickCount: { type: ['integer', 'null'], minimum: 0 },
      lastInteractionDate: { type: ['string', 'null'], format: 'date-time' },
      trackingData: { type: ['object', 'null'] },

      createdBy: { type: ['string', 'null'], format: 'uuid' },
      updatedBy: { type: ['string', 'null'], format: 'uuid' },
      sentBy: { type: ['string', 'null'], format: 'uuid' },

      createdAt: { type: 'string', format: 'date-time' },
      updatedAt: { type: 'string', format: 'date-time' },
      deletedAt: { type: ['string', 'null'], format: 'date-time' },
    },
  };

  // Modifiers for common query patterns
  static modifiers = {
    // Active communications only
    active(query: any) {
      query.where('status', CommunicationStatus.SENT);
    },

    // Scheduled communications
    scheduled(query: any) {
      query.where('status', CommunicationStatus.SCHEDULED);
    },

    // Failed communications
    failed(query: any) {
      query.where('status', CommunicationStatus.FAILED);
    },

    // Draft communications
    draft(query: any) {
      query.where('status', CommunicationStatus.DRAFT);
    },

    // Filter by type
    byType(query: any, type: CommunicationType) {
      query.where('type', type);
    },

    // Default select (excludes sensitive fields if any)
    defaultSelect(query: any) {
      query.select(
        'id',
        'title',
        'message',
        'type',
        'recipients',
        'scheduledDate',
        'sentDate',
        'status',
        'templateId',
        'subject',
        'failureReason',
        'retryCount',
        'maxRetries',
        'deliveredCount',
        'failedCount',
        'pendingCount',
        'deliverySuccessRate',
        'isWhatsappTemplate',
        'whatsappTemplateNamespace',
        'whatsappTemplateName',
        'whatsappTemplateLanguage',
        'whatsappComponents',
        'whatsappButtons',
        'whatsappCallbackData',
        'category',
        'campaignId',
        'tags',
        'attachments',
        'hasAttachments',
        'openCount',
        'clickCount',
        'lastInteractionDate',
        'createdAt',
        'updatedAt'
      );
    },
  };

  // Relationships
  static get relationMappings(): RelationMappings {
    return {
      createdByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'communications.createdBy',
          to: 'users.id',
        },
      },

      updatedByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'communications.updatedBy',
          to: 'users.id',
        },
      },

      sentByUser: {
        relation: Model.BelongsToOneRelation,
        modelClass: User,
        join: {
          from: 'communications.sentBy',
          to: 'users.id',
        },
      },
    };
  }

  // Hooks
  async $beforeInsert(): Promise<void> {
    await super.$beforeInsert();
    if (!this.id) {
      this.id = uuidv4();
    }
    // Set default status if not provided
    if (!this.status) {
      this.status = this.scheduledDate ? CommunicationStatus.SCHEDULED : CommunicationStatus.DRAFT;
    }
    // Ensure JSONB fields are stringified if they are objects/arrays
    if (this.recipients && typeof this.recipients !== 'string') {
      this.recipients = JSON.stringify(this.recipients) as any;
    }
    if (this.deliveryReports && typeof this.deliveryReports !== 'string') {
      this.deliveryReports = JSON.stringify(this.deliveryReports) as any;
    }
    if (this.messageVariables && typeof this.messageVariables !== 'string') {
      this.messageVariables = JSON.stringify(this.messageVariables) as any;
    }
    if (this.whatsappComponents && typeof this.whatsappComponents !== 'string') {
      this.whatsappComponents = JSON.stringify(this.whatsappComponents) as any;
    }
    if (this.whatsappButtons && typeof this.whatsappButtons !== 'string') {
      this.whatsappButtons = JSON.stringify(this.whatsappButtons) as any;
    }
    if (this.tags && typeof this.tags !== 'string') {
      this.tags = JSON.stringify(this.tags) as any;
    }
    if (this.attachments && typeof this.attachments !== 'string') {
      this.attachments = JSON.stringify(this.attachments) as any;
    }
    if (this.trackingData && typeof this.trackingData !== 'string') {
      this.trackingData = JSON.stringify(this.trackingData) as any;
    }
  }

  async $beforeUpdate(): Promise<void> {
    await super.$beforeUpdate();
    // Ensure JSONB fields are stringified if they are objects/arrays
    if (this.recipients && typeof this.recipients !== 'string') {
      this.recipients = JSON.stringify(this.recipients) as any;
    }
    if (this.deliveryReports && typeof this.deliveryReports !== 'string') {
      this.deliveryReports = JSON.stringify(this.deliveryReports) as any;
    }
    if (this.messageVariables && typeof this.messageVariables !== 'string') {
      this.messageVariables = JSON.stringify(this.messageVariables) as any;
    }
    if (this.whatsappComponents && typeof this.whatsappComponents !== 'string') {
      this.whatsappComponents = JSON.stringify(this.whatsappComponents) as any;
    }
    if (this.whatsappButtons && typeof this.whatsappButtons !== 'string') {
      this.whatsappButtons = JSON.stringify(this.whatsappButtons) as any;
    }
    if (this.tags && typeof this.tags !== 'string') {
      this.tags = JSON.stringify(this.tags) as any;
    }
    if (this.attachments && typeof this.attachments !== 'string') {
      this.attachments = JSON.stringify(this.attachments) as any;
    }
    if (this.trackingData && typeof this.trackingData !== 'string') {
      this.trackingData = JSON.stringify(this.trackingData) as any;
    }
  }

  // Static methods for common queries
  static async findByType(type: CommunicationType): Promise<Communication[]> {
    return this.query().where('type', type).orderBy('createdAt', 'desc');
  }

  static async findByStatus(status: CommunicationStatus): Promise<Communication[]> {
    return this.query().where('status', status).orderBy('createdAt', 'desc');
  }

  static async findScheduled(): Promise<Communication[]> {
    return this.query()
      .where('status', CommunicationStatus.SCHEDULED)
      .where('scheduledDate', '<=', new Date())
      .orderBy('scheduledDate', 'asc');
  }

  static async findFailed(): Promise<Communication[]> {
    return this.query().where('status', CommunicationStatus.FAILED).orderBy('createdAt', 'desc');
  }

  static async getDeliveryStats(): Promise<{
    total: number;
    sent: number;
    failed: number;
    scheduled: number;
    draft: number;
    deliveryRate: number;
  }> {
    const result = await this.query()
      .select(
        this.raw('COUNT(id) as total'),
        this.raw(`COUNT(CASE WHEN status = '${CommunicationStatus.SENT}' THEN 1 END) as sent`),
        this.raw(`COUNT(CASE WHEN status = '${CommunicationStatus.FAILED}' THEN 1 END) as failed`),
        this.raw(`COUNT(CASE WHEN status = '${CommunicationStatus.SCHEDULED}' THEN 1 END) as scheduled`),
        this.raw(`COUNT(CASE WHEN status = '${CommunicationStatus.DRAFT}' THEN 1 END) as draft`)
      )
      .first();

    const total = Number(result?.total || 0);
    const sent = Number(result?.sent || 0);
    const failed = Number(result?.failed || 0);
    const scheduled = Number(result?.scheduled || 0);
    const draft = Number(result?.draft || 0);
    const deliveryRate = total > 0 ? (sent / total) * 100 : 0;

    return { total, sent, failed, scheduled, draft, deliveryRate };
  }
}

// Export type for Communication model instances
export type CommunicationShape = ModelObject<Communication>;

export default Communication;
