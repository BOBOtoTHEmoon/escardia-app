/**
 * Parse date string like "21 Oct 2025" and time string like "9:35 PM"
 * Returns a Date object with both date and time
 */
export const parseDateTime = (dateStr: string, timeStr: string): Date => {
  // Parse date: "21 Oct 2025"
  const dateParts = dateStr.trim().split(' ');
  
  if (dateParts.length !== 3) {
    console.warn('Invalid date format:', dateStr);
    return new Date();
  }

  const day = parseInt(dateParts[0]);
  const monthStr = dateParts[1];
  const year = parseInt(dateParts[2]);

  const months: { [key: string]: number } = {
    Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5,
    Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11,
  };

  const month = months[monthStr];
  if (month === undefined) {
    console.warn('Invalid month:', monthStr);
    return new Date();
  }

  // Parse time: "9:35 PM" or "9:35 AM"
  if (!timeStr) {
    console.warn('No time provided');
    return new Date(year, month, day, 0, 0, 0);
  }

  // ✅ FIX: More robust time parsing
  const timeStrCleaned = timeStr.trim().toUpperCase();
  
  // Check for AM/PM
  const isPM = timeStrCleaned.includes('PM');
  const isAM = timeStrCleaned.includes('AM');
  
  if (!isPM && !isAM) {
    console.warn('Invalid time format (no AM/PM):', timeStr);
    return new Date(year, month, day, 0, 0, 0);
  }

  // Remove AM/PM and get just the time part
  const timeOnly = timeStrCleaned.replace('AM', '').replace('PM', '').trim();
  
  // Split by colon
  const timeParts = timeOnly.split(':');
  if (timeParts.length !== 2) {
    console.warn('Invalid time format (no colon):', timeStr);
    return new Date(year, month, day, 0, 0, 0);
  }

  let hour = parseInt(timeParts[0]);
  const minute = parseInt(timeParts[1]);

  // Validate
  if (isNaN(hour) || isNaN(minute)) {
    console.warn('Invalid hour/minute:', timeStr);
    return new Date(year, month, day, 0, 0, 0);
  }

  // Convert to 24-hour format
  if (isPM && hour !== 12) {
    hour += 12;
  } else if (isAM && hour === 12) {
    hour = 0;
  }

  const result = new Date(year, month, day, hour, minute, 0);
  console.log(`✅ Parsed: "${dateStr} ${timeStr}" → ${result.toLocaleString()}`);
  
  return result;
};

/**
 * Calculate booking status based on current time vs start/end times
 */
export const calculateBookingStatus = (
  startDateStr: string,
  startTimeStr: string,
  endDateStr: string,
  endTimeStr: string
): 'upcoming' | 'ongoing' | 'completed' => {
  const now = new Date();
  const startDateTime = parseDateTime(startDateStr, startTimeStr);
  const endDateTime = parseDateTime(endDateStr, endTimeStr);

  console.log(`🕐 Now: ${now.toLocaleString()}`);
  console.log(`🕐 Start: ${startDateTime.toLocaleString()}`);
  console.log(`🕐 End: ${endDateTime.toLocaleString()}`);

  if (now < startDateTime) {
    console.log('✅ Status: upcoming');
    return 'upcoming';
  } else if (now >= startDateTime && now <= endDateTime) {
    console.log('✅ Status: ongoing');
    return 'ongoing';
  } else {
    console.log('✅ Status: completed');
    return 'completed';
  }
};

/**
 * Check if a car is available for the given date/time range
 */
export const isCarAvailable = (
  requestedStart: Date,
  requestedEnd: Date,
  bookingStartDateStr: string,
  bookingStartTimeStr: string,
  bookingEndDateStr: string,
  bookingEndTimeStr: string
): boolean => {
  const bookingStart = parseDateTime(bookingStartDateStr, bookingStartTimeStr);
  const bookingEnd = parseDateTime(bookingEndDateStr, bookingEndTimeStr);

  // Check if ranges overlap
  return requestedEnd <= bookingStart || requestedStart >= bookingEnd;
};

/**
 * Format date for display
 */
export const formatDate = (date: Date): string => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
};

/**
 * Format time for display (12-hour format)
 */
export const formatTime = (date: Date): string => {
  let hours = date.getHours();
  const minutes = date.getMinutes();
  const period = hours >= 12 ? 'PM' : 'AM';
  
  hours = hours % 12;
  hours = hours ? hours : 12; // 0 should be 12
  
  const minutesStr = minutes < 10 ? `0${minutes}` : minutes;
  
  return `${hours}:${minutesStr} ${period}`;
};


