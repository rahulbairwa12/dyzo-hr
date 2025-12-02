/**
 * Standardized Task Status Styling
 * 
 * This file provides consistent styling for task statuses across the application.
 * It includes colors, labels, and styling functions for different components.
 */

// Task status definitions with standardized colors and labels
export const TASK_STATUSES = [
  { status: 'not_started_yet', color: '#dc3464', label: 'Not Started Yet' }, 
  { status: 'pending', color: '#3490dc', label: "Pending" }, 
  { status: 'in_progress', color: '#ee951d', label: "In Progress" }, 
  { status: 'completed', color: '#03ac66', label: "Completed" }, 
  { status: 'testing', color: '#ffa500', label: "Testing" }, 
  { status: 'on_hold', color: '#d9a902', label: 'On Hold' }, 
  { status: 'stuck', color: '#d8314b', label: 'Stuck' }, 
  { status: 'under_review', color: '#6f42c1', label: 'Under Review' }, 
  { status: 'archived', color: '#6c757d', label: 'Archived' }, 
];

// Mapping for backward compatibility with existing code
export const TASK_STATUS_MAPPING = {
  not_started_yet: { color: '#dc3464', label: 'Not Started Yet' },
  pending: { color: '#3490dc', label: "Pending" },
  in_progress: { color: '#ee951d', label: "In Progress" },
  completed: { color: '#03ac66', label: "Completed" },
  testing: { color: '#ffa500', label: "Testing" },
  on_hold: { color: '#d9a902', label: 'On Hold' },
  stuck: { color: '#d8314b', label: 'Stuck' },
  stack: { color: '#d8314b', label: 'Stuck' }, // For backward compatibility
  under_review: { color: '#6f42c1', label: 'Under Review' },
  archived: { color: '#6c757d', label: 'Archived' },
  archive: { color: '#6c757d', label: 'Archived' }, // For backward compatibility
};

/**
 * Get status details by status code
 * @param {string} statusCode - The status code to look up
 * @returns {Object} - The status object with color and label
 */
export const getStatusByCode = (statusCode) => {
  return TASK_STATUS_MAPPING[statusCode] || TASK_STATUS_MAPPING.pending;
};

/**
 * Get all available statuses
 * @returns {Array} - Array of status objects
 */
export const getAllStatuses = () => {
  return TASK_STATUSES;
};

/**
 * Generate CSS class for a status badge
 * @param {string} statusCode - The status code
 * @returns {string} - CSS class for the badge
 */
export const getStatusBadgeClass = (statusCode) => {
  const status = getStatusByCode(statusCode);
  return `inline-block px-2 py-1 text-xs font-medium text-white rounded-md`;
};

/**
 * Generate inline style for a status badge
 * @param {string} statusCode - The status code
 * @returns {Object} - Style object for the badge
 */
export const getStatusBadgeStyle = (statusCode) => {
  const status = getStatusByCode(statusCode);
  return { backgroundColor: status.color };
};

/**
 * Generate a complete status badge component
 * @param {string} statusCode - The status code
 * @returns {Object} - Style and class properties for the badge
 */
export const getStatusBadge = (statusCode) => {
  return {
    className: getStatusBadgeClass(statusCode),
    style: getStatusBadgeStyle(statusCode),
    label: getStatusByCode(statusCode).label
  };
};

export default {
  TASK_STATUSES,
  TASK_STATUS_MAPPING,
  getStatusByCode,
  getAllStatuses,
  getStatusBadgeClass,
  getStatusBadgeStyle,
  getStatusBadge
}; 