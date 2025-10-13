/**
 * Centralized enum definitions for the application
 * This file serves as the single source of truth for all enum values
 * Placed in amplify/config to be accessible by both amplify schema and src components
 */

// Club Types
export const CLUB_TYPE_VALUES = [
  'Public',
  'First_Responders_Only',
  'Veteran_Only',
  'Law_Enforcement_Only',
  'Fire_Fighters_Only'
] as const;

export type ClubType = typeof CLUB_TYPE_VALUES[number];

export const CLUB_TYPE_DESCRIPTIONS: Record<string, string> = {
  'Public': 'Open to all riders regardless of background or service history',
  'First_Responders_Only': 'Membership restricted to first responders including law enforcement, firefighters, and emergency medical personnel',
  'Veteran_Only': 'Membership restricted to military veterans who have served in any branch of the armed forces',
  'Law_Enforcement_Only': 'Membership restricted to current and former law enforcement officers',
  'Fire_Fighters_Only': 'Membership restricted to current and former firefighters and fire service personnel'
};

// Shop Services
export const SHOP_SERVICE_VALUES = [
  'Custom_Builds',
  'Repairs',
  'Fabrication',
  'Paint_And_Body',
  'Performance_Tuning',
  'Restoration',
  'Welding',
  'Sales',
  'Service',
  'Parts',
  'Financing',
  'Accessories',
  'Customization',
  'Apparel',
  'Dyno_Testing',
  'Racing_Prep',
  'Upholstery',
  'Engine_Rebuilds',
  'Detailing'
] as const;

export type ShopService = typeof SHOP_SERVICE_VALUES[number];

export const SHOP_SERVICE_DESCRIPTIONS: Record<string, string> = {
  'Custom_Builds': 'Custom motorcycle and vehicle builds from the ground up',
  'Repairs': 'General maintenance and repair services',
  'Fabrication': 'Custom metal fabrication and welding',
  'Paint_And_Body': 'Professional paint and bodywork services',
  'Performance_Tuning': 'Engine tuning and performance upgrades',
  'Restoration': 'Classic vehicle restoration services',
  'Welding': 'Professional welding services',
  'Sales': 'New and used vehicle sales',
  'Service': 'Routine maintenance and service',
  'Parts': 'Parts sales and ordering',
  'Financing': 'Vehicle financing options',
  'Accessories': 'Aftermarket accessories and upgrades',
  'Customization': 'Vehicle customization services',
  'Apparel': 'Riding gear and branded apparel',
  'Dyno_Testing': 'Dynamometer testing and tuning',
  'Racing_Prep': 'Race vehicle preparation and setup',
  'Upholstery': 'Custom upholstery and interior work',
  'Engine_Rebuilds': 'Complete engine rebuild services',
  'Detailing': 'Professional detailing services'
};
