/**
 * CRM Extensible Architecture
 *
 * Prepared for future lead capture, tagging, and contact management
 * from both Bio Links and Instagram Comment-to-DM conversations.
 */

export type LeadSource = "BIO_LINK" | "INSTAGRAM_DM" | "CAMPAIGN" | "MANUAL" | "IMPORT";

export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "CONVERTED" | "LOST";

export interface Contact {
  id: string;
  workspaceId: string;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  instagramUsername?: string | null;
  instagramId?: string | null;
  source: LeadSource;
  sourceId?: string | null; // Profile ID, Automation ID, or Link ID
  status: LeadStatus;
  tags: string[];
  customFields?: Record<string, unknown>;
  lastInteractionAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface CaptureLeadInput {
  workspaceId: string;
  source: LeadSource;
  sourceId?: string;
  interactionKey?: string;
  name?: string;
  email?: string;
  phone?: string;
  instagramUsername?: string;
  instagramId?: string;
  tags?: string[];
  customFields?: Record<string, unknown>;
}
