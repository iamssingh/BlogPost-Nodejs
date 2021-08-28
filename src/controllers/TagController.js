const TicketMst = require('../models').TicketMst;
const TabParameters = require('../models').TabParameters;
const TicketTxns = require('../models').TicketTxns;
const AssetMst = require('../models').AssetMst;
const YardsMst = require('../models').YardsMst;
const AssetTxns = require('../models').AssetTxns;
const AssetTxnsDetails = require('../models').AssetTxnsDetails;
const TicketDetails = require('../models').TicketDetails;
const ClientCustomerMst = require('../models').ClientCustomerMst;
const ServiceMst = require('../models').ServiceMst;
const ClientCustomerPoMst = require('../models').ClientCustomerPoMst;
const AssetWashOutDoc = require('../models').AssetWashOutDoc;
const AssetWashDocs = require('../models').AssetWashOutDoc;

const { Op } = require('sequelize');
const response = {
    success: true,
    message: 'success',
    data: [],
};
const sequelize = require('sequelize');
module.exports = {
    async list(req, res, next) {
        let { client_id, status, attributes, limit, offset } = req.body;
        let where = {
            client_id: client_id,
            parent_id: {
                [Op.lt]: 1,
            },
        };
        let txnStatusTabs = {};
        if (status != undefined) {
            where.status = status;
        } else {
            txnStatusTabs = await TabParameters.findAll({
                where: {
                    param_key: 'asset_txns_status',
                    param_name: ['Checkout'],
                },
                attributes: ['param_value'],
                raw: true,
            });
            let statusTabs = await TabParameters.findAll({
                where: {
                    param_key: 'ticket_status',
                    param_name: {
                        [Op.notIn]: ['Closed to Hold', 'Deleted'],
                    },
                },
                attributes: [
                    [
                        sequelize.literal('GROUP_CONCAT(param_value)'),
                        'allowed_ticket_statuses',
                    ],
                ],
                raw: true,
            });
            if (statusTabs[0].allowed_ticket_statuses != null) {
                where.status = statusTabs[0].allowed_ticket_statuses.split(',');
            }
        }

        let includes = [];
        let basic = [];

        if (attributes.basic != undefined && attributes.basic.length > 0) {
            basic = attributes.basic;
        }
        if (attributes.ticket_status != undefined && attributes.ticket_status.length > 0) {
            module.exports.dataAssociation(includes, TabParameters, 'ticket_status', attributes.ticket_status);
        }
        if (attributes.asset_details != undefined && attributes.asset_details.length > 0) {
            module.exports.dataAssociation(includes, AssetMst, 'asset_details', attributes.asset_details);
        }
        if (attributes.customer_details != undefined && attributes.customer_details.length > 0) {
            module.exports.dataAssociation(includes, ClientCustomerMst, 'customer_details', attributes.customer_details);
        }
        if (attributes.po_details != undefined && attributes.po_details.length > 0) {
            module.exports.dataAssociation(includes, ClientCustomerPoMst, 'po_details', attributes.po_details);
        }
        if (attributes.sub_tickets != undefined && attributes.sub_tickets.length > 0) {
            module.exports.dataAssociation(includes, TicketMst, 'sub_tickets', attributes.sub_tickets);
        }
        if (attributes.ticket_txns_details != undefined && attributes.ticket_txns_details.length > 0) {
            let attr = attributes.ticket_txns_details;
            if (attr.includes("days_alert")) {
                let index = attr.indexOf('days_alert');
                (index > -1 ? attr.splice(index, 1) : '');
                attr.push([
                    sequelize.fn(
                        'datediff',
                        sequelize.fn('NOW'),
                        sequelize.col('ticket_txns_details.created_at')
                    ),
                    'days_alert',
                ]);
            }
            module.exports.dataAssociation(includes, TicketTxns, 'ticket_txns_details', [...attr]);
        }
        if (attributes.asset_txns_details != undefined) {
            let attr = attributes.asset_txns_details.basic;
            if (attr != undefined && attr.includes("check_in")) {
                let index = attr.indexOf('check_in');
                (index > -1 ? attr.splice(index, 1) : '');
                attr.push(['created_at', 'check_in']);
            }
            if (attr != undefined && attr.includes("ten_days_alert")) {
                let index = attr.indexOf('ten_days_alert');
                (index > -1 ? attr.splice(index, 1) : '');
                attr.push([
                    sequelize.fn(
                        'datediff',
                        sequelize.fn('NOW'),
                        sequelize.col('asset_txns_details.created_at')
                    ),
                    'ten_days_alert',
                ]);
            }

            let innerInc = [];
            if (attributes.asset_txns_details.asset_type_details != undefined && attributes.asset_txns_details.asset_type_details.length > 0) {
                module.exports.dataAssociation(innerInc, TabParameters, 'asset_type_details', attributes.asset_txns_details.asset_type_details);
            }
            if (attributes.asset_txns_details.yard_details != undefined && attributes.asset_txns_details.yard_details.length > 0) {
                module.exports.dataAssociation(innerInc, YardsMst, 'yard_details', attributes.asset_txns_details.yard_details);
            }
            if (attributes.asset_txns_details.asset_txns_details != undefined && attributes.asset_txns_details.asset_txns_details.length > 0) {
                module.exports.dataAssociation(innerInc, AssetTxnsDetails, 'asset_txns_details', attributes.asset_txns_details.asset_txns_details);
            }
            module.exports.dataAssociation(includes, AssetTxns, 'asset_txns_details', [
                    'asset_type',
                    'location_id',
                    'asset_txns_id',
                    ...attr
                ], {
                    status: {
                        [Op.notIn]: [
                            txnStatusTabs.length > 0 ?
                            `${txnStatusTabs[0].param_value}` :
                            '',
                        ],
                    },
                },
                innerInc,
                true);
        }
        let total = await TicketMst.count({
            where: where,
            include: [{
                model: AssetTxns,
                as: 'asset_txns_details',
                where: {
                    status: {
                        [Op.notIn]: [
                            txnStatusTabs.length > 0 ?
                            `${txnStatusTabs[0].param_value}` :
                            '',
                        ],
                    },
                }
            }]
        });
        TicketMst.findAndCountAll({
                where: where,
                limit: limit,
                offset: offset,
                order: [
                    ['created_at', 'DESC']
                ],
                attributes: [...basic, "created_at"],
                include: includes
            })
            .then((result) => {
                response.success = true;
                result.count = total;
                response.data = result;
                response.message = 'Ticket listed';
                res.status(200).json(response);
            })
            .catch((err) => {
                response.success = false;
                response.data = [];
                response.message = err.message;
                res.status(400).json(response);
            });
    },
    async add(req, res, next) {
        try {
            let data = Object.assign({}, req.body);
            delete data.userdetails;
            delete data.client_id;
            let clientdata = await TicketMst.create({
                ...data,
                created_by: req.body.user_id,
            });

            return res.status(200).send({
                success: true,
                message: 'Ticket added successfully',
                data: clientdata,
            });
        } catch (err) {
            response.success = false;
            response.message = err;
            return res.status(404).json(err.message);
        }
    },

    async update(req, res, next) {
        try {
            let data = Object.assign({}, req.body);

            delete data.id;
            delete data.client_id;
            await TicketMst.update({
                ...data,
                updated_by: req.body.user_id,
            }, {
                where: {
                    client_id: req.body.id,
                },
            });
            response.success = true;
            response.data = data;
            response.message = 'Ticket Updated successfully.';
            return res.status(200).json({
                ...response,
                status: 200,
            });
        } catch (err) {
            response.success = false;
            response.message = err;

            return res.status(404).json(err.message);
        }
    },

    async updateticketdetails(req, res, next) {
        // const transaction = await sequelize.transaction();
        try {

            // Fetched all required params
            let {client_cust_id,asset_txns_id,user_id,asset_id,coordinates,quantity,ticket_id,asset_type,equipment_no,owner,txns_details,washout_docs,ticket_details,client_id} = req.body;
            coordinates={
                type: 'Point',
                coordinates: coordinates,
            };
            const tab_statuses= [];
            const tab_statuses_by_desc= [];
            const tab_statuses_desc_by_value= [];

            // Fetch all tab statues for further uses
            const statusTabs = await TabParameters.findAll({
                where: {
                    param_key: ['asset_txns_status','equipment_type','ticket_status','doc_type'],
                    [Op.or]: [{
                        param_name: ['Check-In','Bulk','Release to Yard','Inspection Pending'],
                    },{
                        param_description:['Safety Sheets (SDS)','Bulk/ Other - Pumps','Bulk/ Other - Hoses','Bulk/ Other - Berm','Pre Wash Images','Post Wash Images']
                    }]
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
                tab_statuses_by_desc[statusTabs[index]['param_description']] = statusTabs[index]['param_value'];
                tab_statuses_desc_by_value[statusTabs[index]['param_value']] = statusTabs[index]['param_description'];
            }

           
            if(asset_id===undefined){
                // Created asset, if no asset exists
                let equipNo = equipment_no;
                if (
                    (tab_statuses_desc_by_value[equipment_no]  && !equipment_no) ||
                    equipment_no.length === 0
                ) {
                    const BulkItemCheck = await AssetMst.findAll({
                        where: {
                            client_id: client_id,
                            equipment_type: asset_type,
                            equipment_no: sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('equipment_no')),
                                'LIKE',
                                'BULK' + '%'
                            ),
                            client_cust_id: client_cust_id,
                        },
                        order: [
                            ['created_at', 'DESC']
                        ],
                        raw: true,
                    });
                    if (BulkItemCheck!==undefined && BulkItemCheck.length > 0) {
                        const newID = BulkItemCheck[0].equipment_no.split('-');
                        equipNo = `BULK-${client_cust_id}-${parseInt(newID[2]) + 1}`;
                    } else {
                        equipNo = `BULK-${client_cust_id}-1`;
                    }
                }

                const assetCheck = await AssetMst.findOne({
                    where: {
                        client_id: client_id,
                        equipment_no: equipNo,
                        equipment_type: asset_type,
                        client_cust_id: client_cust_id,
                    },
                });
                if (assetCheck) {
                    return res.status(200).send({
                        success: false,
                        message: 'Asset already exists',
                    });
                }

                const asset = await AssetMst.create({
                    client_cust_id: client_cust_id,
                    equipment_no: equipNo,
                    equipment_type: asset_type,
                    remark: 'ASSET ADDED',
                    status: 1,
                    owner: owner ? owner : null,
                    client_id: client_id,
                    created_by: user_id
                });                
                asset_id=asset.asset_id;
                req.body.asset_id=asset_id;
            }
            else {
                
                // Updated asset, if asset exists
                const assetDetails=await AssetMst.findByPk(asset_id);
                for (const key of ['owner','client_cust_id']) {
                    if(req.body[key]!==undefined)
                        assetDetails[`${key}`]=req.body[key];
                }
                assetDetails.equipment_type=req.body['asset_type'];
                await assetDetails.save();
            } 

            // Created/Updated asset_txns_details if they exists in request body.
            if(txns_details!==undefined){
                await Promise.all(txns_details.map(async (element) => {
                    if(element.id) {
                        await AssetTxnsDetails.update({
                            asset_id:asset_id,
                            created_by:user_id,
                            field_name:element.key,
                            field_value:element.value 
                        },{
                            where:{
                                id:element.id
                            }
                        });
                    }
                    else {
                        await AssetTxnsDetails.create({
                            asset_txns_id: asset_txns_id,
                            asset_id: asset_id,
                            field_name: element.key,
                            field_value: element.value,
                            created_by: user_id,
                        });
                    }
                }));
            }

            // Created/Updated ticket_details if they exists in request body.
            if(ticket_details!==undefined){
                await Promise.all(ticket_details.map(async (element) => {
                    if(element.id) {
                        await TicketDetails.update({
                            asset_id:asset_id,
                            created_by:user_id,
                            client_cust_id:client_cust_id,
                            field_name:element.field_name,
                            field_value:element.field_value 
                        },{
                            where:{
                                id:element.id
                            }
                        });
                    }
                    else {
                        await TicketDetails.create({
                            client_id: client_id,
                            client_cust_id: client_cust_id,
                            ticket_id: ticket_id,
                            field_name:element.field_name,
                            field_value:element.field_value, 
                            created_by: user_id, 
                        });
                    }
                }));
            }

            let doctype,docname,docdata,remark,innerticket_id;

            // Created/Updated washout_docs if they exists in request body.
            if(washout_docs!==undefined){
                await Promise.all(washout_docs.map(async (element) => {
                if(element.id) {
                    await AssetWashDocs.update({
                        asset_id: asset_id,
                        client_cust_id: client_cust_id,
                        created_by: user_id,
                        doc_path: element.doc_path,
                        flag: 1,
                        coordinates: coordinates,
                        remark:element.remark,
                    },{
                        where:{
                            doc_id:element.id
                        }
                    });
                }
                else {
                    remark='';
                    innerticket_id='';
                    if(element.doc_name==='Safety Sheets (SDS)'){
                        doctype=tab_statuses_by_desc['Safety Sheets (SDS)'];
                        docname=tab_statuses_desc_by_value[doctype];
                    }
                    else if(element.doc_name==='Pre Wash Images'){
                        doctype=tab_statuses_by_desc['Pre Wash Images'];
                        docname=tab_statuses_desc_by_value[doctype];
                        remark=element.remark;
                        innerticket_id=element.ticket_id;
                    }
                    else if(element.doc_name==='Post Wash Images'){
                        doctype=tab_statuses_by_desc['Post Wash Images'];
                        docname=tab_statuses_desc_by_value[doctype];
                        remark=element.remark;
                        innerticket_id=element.ticket_id;
                    }

                    docdata={
                        asset_txns_id: asset_txns_id,
                        asset_id: asset_id,
                        client_cust_id: client_cust_id,
                        client_id: client_id,
                        created_by: user_id,
                        doc_path: element.doc_path,
                        flag: 1,
                        coordinates: coordinates,
                        doc_type:doctype,
                        doc_name:docname
                    };
                    if(innerticket_id) docdata.ticket_id=innerticket_id;
                    if(remark) docdata.remark=remark;
                    await AssetWashDocs.create(docdata);
                }
                }));
            }

            // Update Asset checkin data. 
            let checkin_data={
                asset_id:asset_id,
                created_by:user_id
            };
            for (const key of ['asset_type','location_id','po_id','last_known','driver_name','job_site','remark','created_at','quantity','asset_id','client_cust_id']) {
                if(req.body[key]!==undefined)
                    checkin_data[`${key}`]=req.body[key];
            }
            await AssetTxns.update({
                ...checkin_data
            },{
                where:{
                    asset_txns_id:asset_txns_id
                }
            });

            // Update ticket data. 
            let ticketdata={};
            if(ticket_id) {
                for (const key of ['asset_id','asset_txns_id','po_id','ticket_remark','quantity','client_cust_id']) {
                    if(req.body[key]!==undefined) {
                        if(key==='ticket_remark') ticketdata['remark']=req.body['ticket_remark'];
                        else ticketdata[`${key}`]=req.body[key];
                    }
                }
                await TicketMst.update({
                    ...ticketdata
                },{
                    where:{
                        [Op.or]:[
                            {ticket_id:ticket_id},
                            {parent_id:ticket_id}
                        ]
                    }
                });
            }
            // await transaction.commit();

            response.success = true;
            response.data = [checkin_data,ticketdata];
            response.message = 'Ticket details updated successfully.';
            return res.status(200).json({
                ...response,
                status: 200,
            });
        } catch (err) {
            // await transaction.rollback();

            response.success = false;
            response.message = err.message;

            return res.status(404).json(response);
        }
    },

    async detail(req, res, next) {
        if (req.params.ticket_id === undefined) {
            response.success = false;
            response.message = 'Ticket id is required';
            return res.status(400).json(response);
        }
        TicketMst.findAll({
                where: {
                    ticket_id: req.params.ticket_id,
                    client_id: req.body.client_id,
                },
                order: [
                    ['created_at', 'DESC']
                ],
                attributes: [
                    'ticket_id',
                    'ticket_ref_id',
                    'estimate_price',
                    'invoice_price',
                    'created_at',
                    'remark',
                    'status_remark',
                    'certificate_no',
                    'quantity'
                ],
                include: [{
                        model: TabParameters,
                        as: 'ticket_status',
                        attributes: ['param_value', 'param_description'],
                    },
                    {
                        model: AssetTxns,
                        as: 'asset_txns_details',
                        required: true,
                        attributes: [
                            'asset_txns_id',
                            'quantity',
                            'last_known',
                            'driver_name',
                            'job_site',
                            'remark', ['created_at', 'check_in'],
                            [
                                sequelize.fn(
                                    'datediff',
                                    sequelize.fn('NOW'),
                                    sequelize.col('asset_txns_details.created_at')
                                ),
                                'ten_days_alert',
                            ],
                        ],
                        include: [{
                                model: AssetWashOutDoc,
                                as: 'asset_washout_docs',
                                attributes: [
                                    'doc_id',
                                    'doc_name',
                                    'doc_id',
                                    'doc_type',
                                    'doc_path',
                                    'remark',
                                ],
                                include: [{
                                    model: TabParameters,
                                    as: 'document_type',
                                    attributes: ['param_value', 'param_description'],
                                }],
                            },
                            {
                                model: TabParameters,
                                as: 'asset_type_details',
                                attributes: ['param_value', 'param_description','parent_id'],
                            },
                            {
                                model: YardsMst,
                                as: 'yard_details',
                                attributes: ['id','name', 'address', 'coordinates'],
                            },
                            {
                                model: AssetTxnsDetails,
                                as: 'asset_txns_details',
                                attributes: ['id','field_name', 'field_value'],
                            },
                        ],
                    },
                    {
                        model: AssetMst,
                        as: 'asset_details',
                        attributes: ['equipment_no', 'asset_id', 'equipment_type', 'owner'],
                    },
                    {
                        model: ClientCustomerMst,
                        as: 'customer_details',
                        attributes: ['name', 'clients_cust_ref_id', 'clients_cust_id'],
                    },
                    {
                        model: ClientCustomerPoMst,
                        as: 'po_details',
                        attributes: ['po_id','po_no', 'po_value'],
                    },
                    {
                        model: TicketMst,
                        as: 'sub_tickets',
                        attributes: [
                            'ticket_id',
                            'ticket_ref_id',
                            'description',
                            'service_id',
                            'sub_service_id',
                            'service_mst_id',
                            'estimate_price',
                            'invoice_price',
                            'discount',
                            'quantity'
                        ],
                        include: [{
                            model: TabParameters,
                            as: 'services',
                            attributes: ['param_name','param_value','param_description'],
                        },{
                            model: ServiceMst,
                            as: 'sub_service_details',
                            attributes: ['id','service_id','sub_service_id','price','tax','category','service_group_id'],
                        },{
                            model: TabParameters,
                            as: 'sub_services',
                            attributes: ['param_name','param_value','param_description'],
                        }
                    ],
                    },
                    {
                        model: TicketTxns,
                        as: 'ticket_txns_details',
                        attributes: [
                            'parameter_name',
                            'created_at', [
                                sequelize.fn(
                                    'datediff',
                                    sequelize.fn('NOW'),
                                    sequelize.col('ticket_txns_details.created_at')
                                ),
                                'days_alert',
                            ],
                        ],
                    },
                    {
                        model: TicketDetails,
                        as: 'ticket_details',
                        attributes: ['id','field_name', 'field_value', 'remark', 'created_at'],
                    },
                ],
            })
            .then((result) => {
                if (result.length > 0) {
                    response.success = true;
                    response.data = result;
                    response.message = 'Ticket details fetched.';
                } else {
                    (response.success = false), (response.message = 'No Details Found');
                    response.data = [];
                }

                res.status(200).json(response);
            })
            .catch((err) => {
                response.success = false;
                response.data = [];
                response.message = err.message;
                res.status(400).json(response);
            });
    },

    async statusUpdate(req, res, next) {
        try {
            let user_id = req.body.user_id;
            let status_remark = req.body.remark;
            let coordinates = { type: 'Point', coordinates: req.body.coordinates };
            let id = req.body.id;
            let status = req.body.status;
            let ticketDetails = await TicketMst.findByPk(id);
            ticketDetails.status = status;
            ticketDetails.status_remark = status_remark;
            ticketDetails.updated_by = user_id;
            ticketDetails.save();
            let statusTabs = await TabParameters.findAll({
                where: {
                    param_key: 'ticket_status',
                    param_name: ['Cancelled/Abandon'],
                    param_value: status,
                },
                attributes: ['param_value'],
                raw: true,
            });
            if (statusTabs.length > 0) {
                statusTabs = await TabParameters.findAll({
                    where: {
                        param_key: 'asset_txns_status',
                        param_name: ['Rejected'],
                    },
                    attributes: ['param_value'],
                    raw: true,
                });
                await AssetTxns.update({
                    status: statusTabs[0].param_value,
                    updated_by: req.body.user_id,
                }, {
                    where: {
                        asset_txns_id: ticketDetails.asset_txns_id,
                    },
                });
            }

            await TicketTxns.create({
                client_id: req.body.client_id,
                client_cust_id: ticketDetails.client_cust_id,
                asset_id: ticketDetails.asset_id,
                asset_txns_id: ticketDetails.asset_txns_id,
                ticket_id: id,
                parameter_name: statusTabs.length > 0 ? 'ticket_rejected' : 'ticket_updated',
                parameter_value: status_remark,
                remark: status_remark,
                coordinates: coordinates,
                approved_by: user_id,
                created_by: user_id,
            });

            response.success = true;
            response.data = ticketDetails;
            response.message = 'Ticket Status Updated successfully.';
            return res.status(200).json({
                ...response,
                status: 200,
            });
        } catch (err) {
            response.success = false;
            response.message = err;

            return res.status(404).json(err.message);
        }
    },

    async updateEstimate(req, res, next) {
        try {
            let ticket_id = req.body.ticket_id;
            let estimation = req.body.price;
            let ticketDetails = await TicketMst.findByPk(ticket_id);
            let coordinates = { type: 'Point', coordinates: req.body.coordinates };
            ticketDetails.estimate_price = estimation;
            ticketDetails.updated_by = req.body.user_id;
            ticketDetails.save();

            await TicketTxns.create({
                client_id: req.body.client_id,
                client_cust_id: ticketDetails.client_cust_id,
                asset_id: ticketDetails.asset_id,
                asset_txns_id: ticketDetails.asset_txns_id,
                ticket_id: ticket_id,
                parameter_name: 'ticket_estimation_updated',
                parameter_value: estimation,
                remark: 'Ticket Estimation Updated.',
                coordinates: coordinates,
                created_by: req.body.user_id,
            });

            response.success = true;
            response.data = [];
            response.message = 'Estimation updated';
            return res.status(200).json(response);
        } catch (error) {
            response.success = false;
            response.data = [];
            response.message = error.message;
            return res.status(400).json(response);
        }
    },

    async estimationSent(req, res, next) {
        try {
            let ticket_id = req.body.ticket_id;
            let email = req.body.email;
            const ticketDetails = await TicketMst.findByPk(ticket_id);
            await TicketDetails.create({
                client_id: req.body.client_id,
                client_cust_id: ticketDetails.client_cust_id,
                ticket_id: ticket_id,
                field_name: 'estimation_sent',
                field_value: email,
                created_by: req.body.user_id,
            });
            response.success = true;
            response.data = [];
            response.message = 'Estimation sent.';
            return res.status(200).json(response);
        } catch (error) {
            response.success = false;
            response.data = [];
            response.message = error.message;
            return res.status(400).json(response);
        }
    },

    dataAssociation(dataArr, model, alias, attr, where = null, include = null, required = null) {
        let data = {
            model: model,
            as: alias,
            attributes: attr,
        };
        if (where != null) {
            data.where = where;
        }
        if (include != null) {
            data.include = include;
        }
        if (required != null) {
            data.required = required;
        }
        dataArr.push(data);
    },

    async editWashOutCertificateNo(req,res){
        try{
          const [ticketId,certificateNumber] = [req.params.id,req.body.certificateNumber]
          if(!ticketId || !certificateNumber){
             const message = req.params.id ? 'certificateNumber is required in request body':'ticket id parameter is required';
             return res.status(400).send({message,status:400,success:false})
          }
          const ticket = await TicketMst.findOne({where:{
              ticket_id:ticketId,
              client_id:req.body.client_id
          }});
          
          if(!ticket){
            return res.status(400).send({message:'no ticket found by the given id',status:400,success:false})
          }
        
          const ticketUniqeCheck = await TicketMst.findOne({
              where:{
                  client_id:req.body.client_id,
                  certificate_no:certificateNumber
              }
          })
          if(ticketUniqeCheck){
            return res.status(400).send({message:'The given certificate number is identical in the DB for the ticket, To update please use a unique certificate number',status:400,success:false})
          }else{ 
           const updateTicket = await TicketMst.update({
                certificate_no : certificateNumber
            }, {
                where: {
                    client_id: req.body.client_id,
                    ticket_id:ticketId
                },
            });
            
              if(updateTicket){
                return res.status(200).send({
                    message:'Successfully updated ceritifcate number',
                    success:true,
                    status:200
                })
              } 
          }
        }catch(e){
            return res.status(500).send({message:e.message,status:500,success:false})
        }
    },

    async editWashOutCertificateServices(req,res){
      try{
        const [ticketId,serviceId,serviceStatus] = [req.params.id,req.body.serviceId,req.body.serviceStatus]
        const allowedArr = [34000,37000,38000,41000,42000,43000]
        if(!ticketId || !serviceId || serviceStatus === undefined){
             const message = !req.params.id ? 'ticket id parameter is required':!req.body.serviceId?'service id in request body is required':'serviceStatus in request body is required';
             return res.status(400).send({message,status:400,success:false})
        }
        if(!allowedArr.includes(serviceId)){
            return res.status(400).send({message:'Invalid service id',status:400,success:false})
        }
        const ticket = await TicketMst.findOne({where:{
            ticket_id:ticketId,
            client_id:req.body.client_id
        }});
        if(!ticket){
            return res.status(400).send({message:'no ticket found by the given id',status:400,success:false})
        }
        const ticketDetails = await TicketDetails.findOne({where:{
            client_id:req.body.client_id,
            client_cust_id:ticket.client_cust_id,
            ticket_id:ticketId,
            field_name:'certificate_services'
        }})
        if(!ticketDetails){
            if(!serviceStatus){
                return res.status(400).send({message:'service status is false, invalid request as there is no entry found to remove the service.',status:400,success:false})
            }else{
                const newTicketDetails = await TicketDetails.create({
                    client_id: req.body.client_id,
                    client_cust_id: ticket.client_cust_id,
                    ticket_id: ticketId,
                    field_name: 'certificate_services',
                    field_value: `[${serviceId}]`,
                    created_by: req.body.user_id, 
                })
                if(newTicketDetails){
                    return res.status(200).send({message:'service added successfully',status:200,success:true}) 
                }else{
                    return res.status(400).send({message:'failed to add service',status:400,success:false}) 
                }
            }
        }else{
          const services = JSON.parse(ticketDetails.field_value)
            if(serviceStatus){
             
              if(services.includes(serviceId)){
                return res.status(400).send({message:'Service already exists',status:400,success:false}) 
              }else{
                services.push(serviceId)
                const updateTicketDetails = await TicketDetails.update({
                    field_value: JSON.stringify(services),
                }, {where:{
                    client_id:req.body.client_id,
                    client_cust_id:ticket.client_cust_id,
                    ticket_id:ticketId,
                    field_name:'certificate_services'
                }})
                if(updateTicketDetails){
                    return res.status(200).send({message:'service added successfully',status:200,success:true}) 
                }else{
                    return res.status(400).send({message:'problem adding service',status:400,success:false}) 
                }
              }
           }else{
            if(!services.includes(serviceId)){
                return res.status(400).send({message:'Service does not exists',status:400,success:false}) 
              }else{
                const filterArr = services.filter(val => val !==serviceId)
                
                const updateTicketDetails = await TicketDetails.update({
                    field_value: JSON.stringify(filterArr),
                }, {
                    where:{
                    client_id:req.body.client_id,
                    client_cust_id:ticket.client_cust_id,
                    ticket_id:ticketId,
                    field_name:'certificate_services'
                }})
                if(updateTicketDetails){
                    return res.status(200).send({message:'service removed successfully',status:200,success:true}) 
                }else{
                    return res.status(400).send({message:'problem removing service',status:400,success:false}) 
                }
              }
           }
        }        
      }catch(e){
        return res.status(500).send({message:e.message,status:500,success:false})
      }
    },

    async cancelAssetCheckIn(req,res){
        try {
            const {asset_txns_id,client_id}=req.body;

            if(!asset_txns_id){
                throw new Error('asset_txns_id is required');
            }

            const tab_statuses= [];

            // Fetch all tab statues for further uses.
            const statusTabs = await TabParameters.findAll({
                where: {
                    param_key:['asset_txns_status','ticket_status'],
                    [Op.or]: [{
                        param_name: ['Cancelled/Abandon','Rejected'],
                    }]
                },
                attributes: ['param_name','param_value'],
                order: [
                    ['param_value', 'DESC']
                ],
                raw:true
            });

            console.log(statusTabs);

            // Saved all tabs data in array structure for easy uses.
            for(let index = 0; index < statusTabs.length; index++) {
                tab_statuses[statusTabs[index]['param_name']] = statusTabs[index]['param_value'];
            }

            // Update Check-in status to Cancelled/Abandon.
            await AssetTxns.update({
                status: tab_statuses['Rejected'],
            },
            {
                where:{
                    asset_txns_id:asset_txns_id,
                    client_id:client_id
                }
            });

            await TicketMst.update({
                status: tab_statuses['Cancelled/Abandon'],
            },
            {
                where:{
                    asset_txns_id:asset_txns_id,
                    client_id:client_id
                }
            });
            response.success = true;
            response.message = 'Asset Check-in cancelled successfully.';
            return res.status(200).json(response);
        } catch (err) {
            response.success = false;
            response.message = err.message;
            return res.status(404).json(response);
        }
    }
};
