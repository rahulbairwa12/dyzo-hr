import React from 'react';
import { getStatusByCode } from '../../utils/taskStatusStyles';

/**
 * StatusBadge - A reusable component for displaying task status badges
 * 
 * @param {Object} props - Component props
 * @param {string} props.status - The status code
 * @param {string} props.size - Size variant ('sm', 'md', 'lg')
 * @param {string} props.className - Additional CSS classes
 * @returns {JSX.Element} - Rendered component
 */
const StatusBadge = ({ status, statusInfo, size = 'md', className = '' }) => {
  
  // Size variants
  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-xs',
    md: 'px-2 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  };
  
  // Get the status info from the status code if statusInfo is not provided directly
  const actualStatusInfo = statusInfo || getStatusByCode(status);
  
  return (
    <span 
      className={`inline-block font-medium text-white rounded-md ${sizeClasses[size]} ${className}`}
      style={{ backgroundColor: actualStatusInfo.color }}
    >
      {actualStatusInfo.label || actualStatusInfo.name}
    </span>
  );
};

export default StatusBadge; 