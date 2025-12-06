/**
 * General Utilities
 * Common utility functions used across the application
 */

/**
 * Combines class names using clsx and tailwind-merge
 * Useful for conditional styling in React components
 */
export function cn(...inputs: (string | undefined | null | boolean)[]): string {
	// Simple implementation - can be enhanced with clsx and tailwind-merge if needed
	return inputs.filter(Boolean).join(" ");
}

