const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken');
const {Op} = require ('sequelize');
const moment = require ('moment');
const response = {
  success: true,
  message: 'success',
  data: [],
};
module.exports = {
  async list (req, res, next) {
    try {
      
      response.success = true;

      response.data = serviceList;

      response.message = 'Service listed.';
      return res.status (200).json ({...response, status: 200});
    } catch (e) {
      response.success = false;
      response.data = [];
      response.message = err.message;
      return res.status (400).json (response);
    }
  },

  async details (req, res, next) {
    try {
      const data = [];
      response.data = data;
      response.success = true;
      response.message = 'Service details fetched.';
      return res.status (200).json ({...response, status: 200});
    } catch (err) {
      response.success = false;
      response.message = err.message;
      return res.status (400).json (err.message);
    }
  },

  async update (req, res) {
    try {
      response.data = [];
      response.success = true;
      response.message = 'Service updated successfully.';
      return res.status (200).json ({...response, status: 200});
    } catch (err) {
      response.success = false;
      response.message = err.message;
      return res.status (400).json (err.message);
    }
  },
  
  async delete(req,res, next){
    try {
      let {client_id,user_id}=req.body;
      let {id}=req.params;
      const service=await Model.findByPk(id);
      await service.update({
        deleted_by:user_id
      })
      await service.destroy();
      return res.status (200).send({
        data: [],
        message: 'Service deleted',
        success: true,
      });
    } catch (e) {
      response.success = false;
      response.data = [];
      response.message = e.message;
      return res.status (400).json (response);
    }
  },
}
