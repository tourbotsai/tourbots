export function getPlatformAdminUserId(): string {
  const platformAdminUserId = process.env.PLATFORM_ADMIN_USER_ID;

  if (!platformAdminUserId) {
    throw new Error('PLATFORM_ADMIN_USER_ID is not set');
  }

  return platformAdminUserId;
}
