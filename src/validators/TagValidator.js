const joi = require('joi');

const tagAddValidator = async (req, res, next) => {
  const tagAddValidatorSchema = joi.object({
    title: joi.string().required(),
    details: joi.string().optional(),
  });
  const data = req.body;
  try {
    await tagAddValidatorSchema.validateAsync(data, {
      allowUnknown: true,
    });
  } catch (err) {
    return res.status(422).json({
      success: false,
      message: err.message,
      data: [],
    });
  }
  next();
};

const tagUpdateValidator = async (req, res, next) => {
  const tagUpdateValidatorSchema = joi.object({
    id: joi.number().required(),
    title: joi.string().required(),
    details: joi.string().optional(),
  });
  const data = req.body;
  try {
    await tagUpdateValidatorSchema.validateAsync(data, {
      allowUnknown: true,
    });
  } catch (err) {
    return res.status(422).json({
      success: false,
      message: err.message,
      data: [],
    });
  }
  next();
};
module.exports = {
  tagAddValidator,
  tagUpdateValidator,
};
