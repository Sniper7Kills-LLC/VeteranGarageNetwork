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

// Association Relationship Types
export const ASSOCIATION_RELATIONSHIP_VALUES = [
  'Sponsor',
  'Partner',
  'Affiliated',
  'Supporter',
  'Other',
] as const;

export type AssociationRelationship = typeof ASSOCIATION_RELATIONSHIP_VALUES[number];

export const ASSOCIATION_RELATIONSHIP_DESCRIPTIONS: Record<string, string> = {
  'Sponsor': 'Provides financial or material support to the organization',
  'Partner': 'Collaborative relationship with shared goals and mutual benefits',
  'Affiliated': 'Officially connected or associated with the organization',
  'Supporter': 'Actively supports the organization through various means',
  'Other': 'Custom relationship type not covered by standard categories'
};

// Event Categories
export const EVENT_CATEGORY_VALUES = [
  'Meetup',
  'Ride', 
  'Show',
  'Workshop',
  'Parade'
] as const;

export type EventCategory = typeof EVENT_CATEGORY_VALUES[number];

export const EVENT_CATEGORY_DESCRIPTIONS: Record<string, string> = {
  'Meetup': 'Casual gatherings, coffee meets, and social events',
  'Ride': 'Group rides with planned routes and waypoints',
  'Show': 'Vehicle shows, exhibitions, and display events',
  'Workshop': 'Educational workshops, training sessions, and skill-building events',
  'Parade': 'Parades, ceremonies, and commemorative events'
};

// Event-Chapter Relationship Types
export const EVENT_RELATIONSHIP_VALUES = [
  'Hosted_By',
  'Sponsored_By',
  'Supported_By',
  'Affiliated_With',
  'Other',
] as const;

export type EventRelationship = typeof EVENT_RELATIONSHIP_VALUES[number];

export const EVENT_RELATIONSHIP_DESCRIPTIONS: Record<string, string> = {
  'Hosted_By': 'Chapter is the primary organizer and host of this event',
  'Sponsored_By': 'Chapter provides financial or material sponsorship',
  'Supported_By': 'Chapter actively supports and promotes this event',
  'Affiliated_With': 'Chapter is officially associated with this event',
  'Other': 'Custom relationship type not covered by standard categories'
};

// Route Point Types
export const ROUTE_POINT_TYPE_VALUES = [
  'Start',
  'End',
  'Stop',
  'Join_In'
] as const;

export type RoutePointType = typeof ROUTE_POINT_TYPE_VALUES[number];

export const ROUTE_POINT_TYPE_DESCRIPTIONS: Record<string, string> = {
  'Start': 'Starting point of the route',
  'End': 'Final destination of the route',
  'Stop': 'Planned stop or waypoint along the route',
  'Join_In': 'Point where additional riders can join the group'
};
