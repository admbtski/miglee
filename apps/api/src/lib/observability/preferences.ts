/**
 * Notification Preferences / Mute / Block Observability
 */

import { getMeter } from '@appname/observability/metrics';
import type { Counter } from '@opentelemetry/api';
import { logger } from '../pino';

// Lazy initialization
let _meter: ReturnType<typeof getMeter> | null = null;

function meter() {
  if (!_meter) _meter = getMeter('preferences');
  return _meter;
}

let _preferencesUpdated: Counter | null = null;
let _mutesCreated: Counter | null = null;
let _mutesRemoved: Counter | null = null;
let _blocksCreated: Counter | null = null;
let _blocksRemoved: Counter | null = null;

function preferencesUpdated() {
  if (!_preferencesUpdated) {
    _preferencesUpdated = meter().createCounter('preferences.updated', { description: 'Notification preference updates', unit: '1' });
  }
  return _preferencesUpdated;
}

function mutesCreated() {
  if (!_mutesCreated) {
    _mutesCreated = meter().createCounter('preferences.mutes.created', { description: 'Mutes created', unit: '1' });
  }
  return _mutesCreated;
}

function mutesRemoved() {
  if (!_mutesRemoved) {
    _mutesRemoved = meter().createCounter('preferences.mutes.removed', { description: 'Mutes removed', unit: '1' });
  }
  return _mutesRemoved;
}

function blocksCreated() {
  if (!_blocksCreated) {
    _blocksCreated = meter().createCounter('preferences.blocks.created', { description: 'User blocks created', unit: '1' });
  }
  return _blocksCreated;
}

function blocksRemoved() {
  if (!_blocksRemoved) {
    _blocksRemoved = meter().createCounter('preferences.blocks.removed', { description: 'User blocks removed', unit: '1' });
  }
  return _blocksRemoved;
}

export type MuteTarget = 'event' | 'dm_thread';
export type PreferenceChannel = 'email' | 'push' | 'in_app';

interface PreferenceUpdateContext {
  userId: string;
  channel?: PreferenceChannel;
  changedFields?: string[];
}

export function trackPreferencesUpdated(ctx: PreferenceUpdateContext): void {
  preferencesUpdated().add(1, { channel: ctx.channel || 'all' });
  logger.debug({ preferences: 'updated', userId: ctx.userId, channel: ctx.channel, changedFields: ctx.changedFields }, 'Notification preferences updated');
}

interface MuteContext {
  userId: string;
  target: MuteTarget;
  targetId: string;
}

export function trackMuteCreated(ctx: MuteContext): void {
  mutesCreated().add(1, { target: ctx.target });
  logger.debug({ preferences: 'mute.created', userId: ctx.userId, target: ctx.target, targetId: ctx.targetId }, `Mute created: ${ctx.target}`);
}

export function trackMuteRemoved(ctx: MuteContext): void {
  mutesRemoved().add(1, { target: ctx.target });
  logger.debug({ preferences: 'mute.removed', userId: ctx.userId, target: ctx.target, targetId: ctx.targetId }, `Mute removed: ${ctx.target}`);
}

interface BlockContext {
  blockerId: string;
  blockedId: string;
}

export function trackBlockCreated(ctx: BlockContext): void {
  blocksCreated().add(1, {});
  logger.info({ preferences: 'block.created', blockerId: ctx.blockerId, blockedId: ctx.blockedId }, 'User blocked');
}

export function trackBlockRemoved(ctx: BlockContext): void {
  blocksRemoved().add(1, {});
  logger.info({ preferences: 'block.removed', blockerId: ctx.blockerId, blockedId: ctx.blockedId }, 'User unblocked');
}

export function correlatePreferencesWithDelivery(userId: string, notificationType: string, delivered: boolean, reason?: string): void {
  if (!delivered && reason) {
    logger.debug({ correlation: 'preferences_delivery', userId, notificationType, delivered, reason }, `Notification not delivered: ${reason}`);
  }
}
