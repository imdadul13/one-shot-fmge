import { TelegramChannelConfig, TelegramMCQ, TelegramAnnouncement } from '../types';

// ZERO-MOCK CLEAN ARCHITECTURE:
// Preset channels and mock questions are eliminated.
// The live application starts with 0 channels and 0 questions until a real Telegram account connects.
export const DEFAULT_TELEGRAM_CHANNELS: TelegramChannelConfig[] = [];
export const DEFAULT_TELEGRAM_ANNOUNCEMENTS: TelegramAnnouncement[] = [];
export const INITIAL_TELEGRAM_MCQS: TelegramMCQ[] = [];
