export const formatAnalytics = (sessions) => {

  return sessions.map(session => ({
    id: session._id,
    subject: session.subject,
    durationMinutes: session.durationMinutes,
    date: session.date,
    source: session.source
  }));
};