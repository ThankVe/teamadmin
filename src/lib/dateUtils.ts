 // Utility functions for handling dates without timezone issues
 
 /**
  * Parse a date string (YYYY-MM-DD) to local Date object
  * This avoids UTC conversion issues when parsing date strings
  */
 export function parseDateString(dateStr: string): Date {
   const [year, month, day] = dateStr.split('-').map(Number);
   return new Date(year, month - 1, day);
 }
 
 /**
  * Format a date to YYYY-MM-DD string using local date components
  */
 export function formatDateString(date: Date): string {
   const year = date.getFullYear();
   const month = String(date.getMonth() + 1).padStart(2, '0');
   const day = String(date.getDate()).padStart(2, '0');
   return `${year}-${month}-${day}`;
 }
 
 /**
  * Format a date string to Thai locale display
  */
 export function formatThaiDate(dateStr: string, options?: Intl.DateTimeFormatOptions): string {
   const date = parseDateString(dateStr);
   const defaultOptions: Intl.DateTimeFormatOptions = {
     year: 'numeric',
     month: 'long',
     day: 'numeric',
   };
   return date.toLocaleDateString('th-TH', options || defaultOptions);
 }
 
 /**
  * Format a date string to short Thai locale display
  */
 export function formatThaiDateShort(dateStr: string): string {
   return formatThaiDate(dateStr, { day: 'numeric', month: 'short' });
 }