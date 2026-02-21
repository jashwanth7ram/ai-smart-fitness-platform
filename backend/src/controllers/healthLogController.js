/**
 * Health Log Controller
 * CRUD for nutrition, activity, sleep, weight
 */
import HealthLog from '../models/HealthLog.js';

export const createLog = async (req, res, next) => {
  try {
    const log = await HealthLog.create({ ...req.validated, user: req.user.id });
    res.status(201).json({ success: true, data: { log } });
  } catch (error) {
    next(error);
  }
};

export const getLogs = async (req, res, next) => {
  try {
    const { type, startDate, endDate, limit = 30, page = 1 } = req.query;
    const query = { user: req.user.id };

    if (type) query.type = type;
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const logs = await HealthLog.find(query)
      .sort({ date: -1 })
      .skip(skip)
      .limit(parseInt(limit, 10))
      .lean();

    const total = await HealthLog.countDocuments(query);
    res.json({
      success: true,
      data: { logs, total, page: parseInt(page, 10), totalPages: Math.ceil(total / limit) },
    });
  } catch (error) {
    next(error);
  }
};

export const getLogById = async (req, res, next) => {
  try {
    const log = await HealthLog.findOne({ _id: req.params.id, user: req.user.id });
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found.' });
    }
    res.json({ success: true, data: { log } });
  } catch (error) {
    next(error);
  }
};

export const updateLog = async (req, res, next) => {
  try {
    const log = await HealthLog.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true, runValidators: true }
    );
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found.' });
    }
    res.json({ success: true, data: { log } });
  } catch (error) {
    next(error);
  }
};

export const deleteLog = async (req, res, next) => {
  try {
    const log = await HealthLog.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!log) {
      return res.status(404).json({ success: false, error: 'Log not found.' });
    }
    res.json({ success: true, data: { id: req.params.id } });
  } catch (error) {
    next(error);
  }
};
