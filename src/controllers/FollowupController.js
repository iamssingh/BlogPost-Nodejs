const bcrypt = require ('bcrypt');
const jwt = require ('jsonwebtoken');
const ServiceMst = require ('../models').ServiceMst;
const TabParameters = require ('../models').TabParameters;
const TicketMst = require('../models').TicketMst;
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
      const serviceList = await ServiceMst.findAll ({
        where: {
          client_id: req.body.client_id,
          status: {
            [Op.ne]: null,
          },
        },
        attributes: [
          'id',
          'client_id',
          'service_group_id',
          'sub_service_id',
          'category',
          'parent_id',
          'service_id',
          'name',
          'price',
          'tax',
          'price_valid_from',
          'price_valid_till',
          'remark',
          'status',
        ],
        include: [
          {
            model: TabParameters,
            as: 'service_group_name',
            attributes: ['param_description', 'param_value'],
          },
          {
            model: TabParameters,
            as: 'service_name',
            attributes: ['param_description', 'param_value'],
          },
          {
            model: TabParameters,
            as: 'sub_service_name',
            attributes: ['param_description', 'param_value'],
          }
        ],
      });
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

  async allservicesList (req, res, next) {
    try {
      let { status }=req.params;
      const tab_statuses= [];

      // Fetch all tab statues for further uses
      const statusTabs = await TabParameters.findAll({
          where: {
              param_key: 'service_group'
          },
          attributes: ['param_name','param_value','param_description'],
          order: [
              ['param_value', 'DESC']
          ],
          raw:true
      });

      // Saved all tabs data in array structure for easy uses
      for(let index = 0; index < statusTabs.length; index++) {
          tab_statuses[statusTabs[index]['param_name']] = statusTabs[index]['param_value'];
      }
      let currentDate = moment ().toISOString ();
      let {client_id}=req.body;
      let result = await ServiceMst.findAll({
        where: {
          client_id: client_id,
          service_group_id:(status==='post' ? tab_statuses['Consumable'] : (status==='pre' ?[tab_statuses['Other Service'] ,tab_statuses['Cleaning'] ,tab_statuses['Additional Services']] :[tab_statuses['Other Service'] ,tab_statuses['Cleaning'] ,tab_statuses['Additional Services'] ,tab_statuses['Consumable'] ]) ),
          price_valid_till: {
            [Op.gte]: currentDate,
          },
          status: '1',
        },
        attributes: [
          'service_group_id',
          'parent_id',
          'sub_service_id',
          'service_id',
          'price',
          'tax',
          'price_valid_from',
          'price_valid_till',
          'status',
          'id',
          'category'
        ],
        // plain: true,
        raw: true,
        include: [
          {
            model: TabParameters,
            as: 'service_group_name',
            attributes: ['param_description', 'param_value'],
          },
          {
            model: TabParameters,
            as: 'service_name',
            attributes: ['param_description', 'param_value'],
          },
          {
            model: TabParameters,
            as: 'sub_service_name',
            attributes: ['param_description', 'param_value'],
          }
        ],
        order: [['parent_id', 'ASC']],
      });
      response.success = true;
      response.data = result;
      response.message = 'Services listed.';
      if (req.url == '/yard/services/list') {
        return response.data;
      }
      else return res.status (200).json ({...response, status: 200});
    } catch (error) {
      response.success = false;
      response.data = [];
      response.message = error.message;
      return res.status (400).json (response);
    }
  },

  // async add (req, res, next) {
  //   try {
  //     let data = Object.assign ({}, req.body);
  //     let services = data.services;
  //     var currentDate = moment ().toISOString ();
  //     let serviceCount = await ServiceMst.count ({
  //       where: {
  //         client_id: req.body.client_id,
  //         price_valid_till: {
  //           [Op.gte]: currentDate,
  //         },
  //         service_group_id: services[0].service_group_id,
  //       },
  //     });
  //     if (serviceCount > 0) {
  //       throw Error ('Service already exists.');
  //     }
  //     let service_group_ids = [];
  //     const serviceData = [];
  //     const parentData = [];
  //     await services.forEach (async (element, index) => {
  //       element.client_id = req.body.client_id;
  //       if (!service_group_ids.includes (element.service_group_id)) {
  //         service_group_ids.push (element.service_group_id);
  //         parentData.push ({...element, created_by: req.body.user_id});
  //       }
  //     });
  //     let result = await ServiceMst.bulkCreate (parentData, {returning: true});
  //     result.forEach ((element, index) => {
  //       services.forEach ((innerElement, innerIndex) => {
  //         if (innerElement.service_group_id == element.service_group_id) {
  //           serviceData.push ({
  //             ...innerElement,
  //             parent_id: element.id,
  //             created_by: req.body.user_id,
  //             client_id: element.client_id,
  //           });
  //         }
  //       });
  //     });
  //     const childData = await ServiceMst.bulkCreate (serviceData, {
  //       returning: true,
  //     });
  //     response.data = [];
  //     response.success = true;
  //     response.message = 'Service added successfully.';
  //     return res.status (200).json ({...response, status: 200});
  //   } catch (err) {
  //     response.success = false;
  //     response.data = [];
  //     response.message = err.message;
  //     return res.status (400).json (response);
  //   }
  // },

  async details (req, res, next) {
    try {
      const data = await ServiceMst.findAll ({
        where: {
          client_id: req.body.client_id,
          parent_id: {
            [Op.ne]: null,
          },
        },
        attributes: [
          'id',
          'client_id',
          'service_group_id',
          'parent_id',
          'service_id',
          'name',
          'price',
          'tax',
          'price_valid_from',
          'price_valid_till',
          'remark',
          'status',
        ],
        include: [
          {
            model: TabParameters,
            as: 'service_group_name',
            attributes: ['param_description', 'param_value'],
          },
          {
            model: TabParameters,
            as: 'service_name',
            attributes: ['param_description', 'param_value'],
          },
        ],
      });
      response.data = data;
      response.success = true;
      response.message = 'Service details fetched.';
      return res.status (200).json ({...response, status: 200});
    } catch (err) {
      response.success = false;
      response.message = err;
      return res.status (400).json (err.message);
    }
  },

  async update (req, res) {
    try {
      let {id,price,tax} = req.body;
      await ServiceMst.update(
        {
          price:price,
          tax:tax 
        },
        {
          where: {
            id: id,
          },
        }
      );
      response.data = [];
      response.success = true;
      response.message = 'Service updated successfully.';
      return res.status (200).json ({...response, status: 200});
    } catch (err) {
      response.success = false;
      response.message = err;
      return res.status (400).json (err.message);
    }
  },
  
  async serviceAdd (req, res) {
    try {
      let {client_id,service_group_id,service_id,sub_service_id,price_valid_from,category}=req.body;
      let currentDate = moment(price_valid_from).toISOString();
      let serviceCount = await ServiceMst.count({
        where: {
          client_id:client_id,
          price_valid_till: {
            [Op.gte]: currentDate,
          },
          service_id: service_id,
          service_group_id: service_group_id,
          sub_service_id: (sub_service_id!==undefined?sub_service_id:null),
          category: category,
        },
      });

      if (serviceCount > 0) {
        return res.status (200).send ({
          data: [],
          message: 'Service Already Exists',
          success: false,
        });
      }
      const serviceAdd = await ServiceMst.create({
        ...req.body,
        created_by: client_id,
        status: 1,
      });
      return res.status (200).send ({
        data: {...serviceAdd.dataValues},
        message: 'Service Added',
        success: true,
      });
    } catch (err) {
      response.success = false;
      response.data = [];
      response.message = err.message;
      return res.status (400).json (response);
    }
  },

  async changeServiceStatus (req, res) {
    try {
      if (!req.body.serviceID && !req.body.status) {
        throw Error ('Service id is required');
      }
      const serviceID = req.body.serviceID;
      const changeStatus = await ServiceMst.update (
        {
          status: req.body.status,
        },
        {
          where: {
            id: serviceID,
            client_id: req.body.client_id,
          },
        }
      );
      if (changeStatus) {
        return res
          .status (200)
          .send ({message: 'status changed', success: true});
      }
    } catch (e) {
      response.success = false;
      response.data = [];
      response.message = e.message;
      return res.status (400).json (response);
    }
  },

  async delete(req,res, next){
    try {
      let {client_id,user_id}=req.body;
      let {id}=req.params;
      const service=await ServiceMst.findByPk(id);

      let ticketExists=await TicketMst.count({
        where:{
          [Op.or]:[{
              client_id:client_id,
              service_mst_id:id
            },{
              client_id:client_id,
              service_mst_id:{
                [Op.is]: null
              },
              service_id:service.service_id
          }]
        }
      });

      if(ticketExists>0){
        throw Error ('Cannot be deleted, This service is being used already.');
      }
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
  async getWashoutCertificateClientMstServices(req,res){
    try{
      const serviceList = await ServiceMst.findAll ({
        where: {
          client_id: req.body.client_id,
        },
        attributes: [],
        group: ['service_id'],
        include: [
          {
            model: TabParameters,
            as: 'service_name',
            attributes: ['param_description', 'param_value','parent_id','param_key','param_name'],
          }
        ],
        raw:true
      });
      const sortData = serviceList.map((val,index) =>{
        return {
          param_description:val['service_name.param_description'],
          param_key:val['service_name.param_key'],
          param_name:val['service_name.param_name'],
          param_value:val['service_name.param_value'],
          parent_id:val['service_name.parent_id']
          }
      })
       return res.status(200).send({data:sortData,status:200,success:true})
    }catch(e){
      return res.status(500).send({message:e.message,status:500,success:false})
    }
  }
    
}
