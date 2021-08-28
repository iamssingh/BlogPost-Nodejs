const joi = require('joi');

const poAddValidator = async (req, res, next) => {
  const poAddValidatorSchema = joi.object({
    services: joi.array().optional(),
    client_cust_id: joi.number().required(),
    po_no: joi.string().required(),
    po_value: joi.number().precision(2).optional().required(),
    remark: joi.string().optional().empty(''),
    issue_date: joi.string().required(),
    expiry_date: joi.string().required(),
    coordinates: joi.array().required(),
  });
  const data = req.body;
  try {
    await poAddValidatorSchema.validateAsync(data, {
      allowUnknown: true,
      convert: false,
    });
  } catch (err) {
    if (err) {
      return res.status(422).json({
        success: false,
        message: err.details[0].message,
        data: [],
      });
    }
  }
  next();
};

const poUpdateValidator = async (req, res, next) => {
  const poUpdateValidatorSchema = joi.object({
    po_id: joi.number().required(),
    services: joi.array().optional(),
    po_no: joi.string().optional(),
    po_value: joi.number().precision(2).optional(),
    remark: joi.string().optional(),
    issue_date: joi.string().optional(),
    expiry_date: joi.string().optional(),
    coordinates: joi.array().required(),
  });
  const data = req.body;
  try {
    await poUpdateValidatorSchema.validateAsync(data, {
      allowUnknown: true,
      convert: false,
    });
  } catch (err) {
    if (err) {
      return res.status(422).json({
        success: false,
        message: err.details[0].message,
        data: [],
      });
    }
  }
  next();
};
module.exports = {
  poAddValidator,
  poUpdateValidator,
};
