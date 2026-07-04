export type UserRole = 'MANAGER' | 'ENGINEER' | 'UNKNOWN';

export function determineUserRole(email: string | undefined): UserRole {
  if (!email) return 'UNKNOWN';
  const e = email.toLowerCase().replace(/\s+/g, '');
  
  if (e === 'parthu3915@gmail.com' || e === 'admin') {
    return 'MANAGER';
  }
  
  if (e === 'parthsarathi3915@gmail.com' || e === 'parthuepicgames@gmail.com') {
    return 'ENGINEER';
  }
  
  return 'UNKNOWN'; // Default to unknown if not strictly matched, or could default to engineer/manager
}
