/**
 * Centralized enum definitions for the application
 * This file serves as the single source of truth for all enum values
 * Placed in amplify/config to be accessible by both amplify schema and src components
 */

export const CLUB_TYPE_VALUES = [
  'Public',
  'First Responders Only',
  'Veteran Only',
  'Law Enforcement Only',
  'Fire Fighters Only'
] as const;

export type ClubType = typeof CLUB_TYPE_VALUES[number];
