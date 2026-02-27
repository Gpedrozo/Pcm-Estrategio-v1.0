type SessionInfo = {
  userId: string | null;
  empresaId: string | null;
};

export function canAccessApp(session: SessionInfo) {
  return Boolean(session.userId && session.empresaId);
}
