/**
 * Supervisor Data Services
 * 
 * This module exports all supervisor-specific data services that use the /supervisor/ API prefix.
 * These services are designed for supervisor role users and provide filtered access to survey data
 * based on the supervisor's assigned dzongkhags.
 */

export * from './supervisor-survey.dataservice';
export * from './supervisor-survey-enumeration-area.dataservice';
export * from './supervisor-survey-enumeration-area-household-listing.dataservice';
export * from './supervisor-survey-enumerator.dataservice';
export * from './supervisor-sampling.dataservice';

