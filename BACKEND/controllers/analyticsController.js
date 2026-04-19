import StudySession from '../models/studySessionModel.js';

export const getAnalyticsData = async (req, res) => {
  try {
    const { timeframe } = req.query; 
    let startDate = new Date();

    if (timeframe === 'daily') {
      startDate.setHours(0, 0, 0, 0); 
    } else if (timeframe === 'weekly') {
      startDate.setDate(startDate.getDate() - 7); 
    } else if (timeframe === 'monthly') {
      startDate.setMonth(startDate.getMonth() - 1); 
    } else {
      startDate = new Date(0); 
    }

    const sessions = await StudySession.find({
      user: req.user.id,
      date: { $gte: startDate }
    }).sort({ date: 1 });

    res.status(200).json(sessions);

  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const saveStudySession = async (req, res) => {
  try {
    const { subject, durationMinutes } = req.body;

    if (!subject || !durationMinutes) {
      return res.status(400).json({ message: 'Please provide subject and duration' });
    }

    const newSession = await StudySession.create({
      user: req.user.id,
      subject,
      durationMinutes
    });

    res.status(201).json(newSession);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};