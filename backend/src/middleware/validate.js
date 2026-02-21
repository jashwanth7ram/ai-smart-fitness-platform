/**
 * Request Validation Middleware (Joi)
 */
export const validate = (schema) => (req, res, next) => {
  const toValidate = { ...req.body, ...req.params, ...req.query };
  const { error, value } = schema.validate(toValidate, { abortEarly: false });

  if (error) {
    const errors = error.details.map((d) => d.message).join('; ');
    return res.status(400).json({ success: false, error: errors });
  }

  req.validated = value;
  next();
};
