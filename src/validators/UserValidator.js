const joi = require('joi');
const sequelize = require('sequelize');

const loginValidation = async (req, res, next) => {
  const loginValidationSchema = joi.object({
    email: joi.string().required(),
    password: joi.string().required(),
  });
  try {
    const data = req.body;
    await loginValidationSchema.validateAsync(data, {
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

const registerValidation = async (req, res, next) => {
  const registerValidationSchema = joi.object({
    username: joi.string().required(),
    email: joi.string().required(),
    name: joi.string().required(),
    password: joi.string().required(),
    profile_pic: joi.string().optional()
  });
  try {
    const data = req.body;
    await registerValidationSchema.validateAsync(data, {
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

const changePasswordValidation=async(req,res,next)=>{
  const changePasswordValidationSchema = joi.object({
    id:joi.number().required(),
    old_password:joi.string().required(),
    new_password:joi.string().required(),
    confirm_password:joi.string().required().valid(joi.ref('new_password')),
  });
  const data = req.body;
  try {
    await changePasswordValidationSchema.validateAsync(data,{
      allowUnknown:true
    });
  }
  catch(error){
    return res.status(422).json({
      success: false,
      message: error.message,
      data: [],
    });
  }
  next();  
}

module.exports = {
  loginValidation,
  registerValidation,
  changePasswordValidation
};
