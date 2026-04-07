export function toGlobalPhoneNumber(
  phoneNumber: string,
): string {
  const globalNumber = phoneNumber.replace(/[^0-9+]/g, '');
  if (globalNumber.startsWith('01')) {
    return `+82${globalNumber.slice(1)}`;
  }
  if (!globalNumber.startsWith('+')) {
    return `+${globalNumber}`;
  }
  return globalNumber;
}
