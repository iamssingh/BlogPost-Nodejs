const Asset = require('../models').AssetMst;
const AssetMst = require('../models').AssetMst;
const { Op } = require('sequelize');
const lodash = require('lodash');
const sequelize = require('sequelize');
const AssetTxns = require('../models').AssetTxns;
const AssetTxnDetails = require('../models').AssetTxnsDetails;
const ClientCustomerMst = require('../models').ClientCustomerMst;
const TabParameters = require('../models').TabParameters;
const TicketMst = require('../models').TicketMst;
const AssetWashDocs = require('../models').AssetWashOutDoc;
const YardsMst = require('../models').YardsMst;
const ClientMst = require('../models').ClientMst;
const TicketTxns = require('../models').TicketTxns;
module.exports = {
    async saveAsset(req, res) {
        try {
            await Asset.create({
                ...req.body,
                client_id: req.body.client_id,
                created_by: req.body.user_id,
            });
            return res.status(200).send({
                success: true,
                message: 'Added asset',
            });
        } catch (e) {
            res.status(400).send({
                success: false,
                message: e.message,
            });
        }
    },

    async searchAsset(req, res) {
        try {
            let statusTabs = await TabParameters.findAll({
                where: {
                    param_key: ['asset_txns_status'],
                    param_name: ['Checkout'],
                },
                attributes: ['param_value'],
                raw: true,
            });
            let statuses = statusTabs.map((val, index) => {
                return val.param_value;
            });

            // Fetched all the asset txns where, last asset txns record is in checkout state.
            const assetIds = await AssetTxns.findAll({
                where: {
                    client_cust_id: req.params.custId,
                    client_id: req.body.client_id,
                    status: {
                        [Op.in]: statuses,
                    },
                    asset_txns_id:{
                        [Op.in]: sequelize.literal(`(
                            SELECT MAX(asset_txns_id) 
                            FROM assets_txns inner_table 
                            WHERE AssetTxns.asset_id=inner_table.asset_id
                        )`)
                    }                    
                },
                attributes: [
                    [
                        sequelize.literal('GROUP_CONCAT(DISTINCT asset_id)'),
                        'allowed_assets',
                    ],
                ],
                raw: true,
            });
            let allowed_assets = [];
            console.log(assetIds);
            if (assetIds[0].allowed_assets != null) {
                allowed_assets = assetIds[0].allowed_assets.split(',');
            }
            // const ticketAssetIds = await TicketMst.findAll({
            //     where: {
            //         client_cust_id: req.params.custId,
            //         client_id: req.body.client_id,
            //         status: {
            //             [Op.in]: statuses,
            //         },
            //     },
            //     attributes: [
            //         [
            //             sequelize.literal('GROUP_CONCAT(DISTINCT asset_id)'),
            //             'allowed_assets',
            //         ],
            //     ],
            //     raw: true,
            // });
            // let allowed_assets_for_ticket = [];
            // if (ticketAssetIds[0].allowed_assets != null) {
            //     allowed_assets_for_ticket = ticketAssetIds[0].allowed_assets.split(',');
            // }
            // console.log(ticketAssetIds);
            // allowed_assets = lodash.intersectionWith(allowed_assets_for_ticket, allowed_assets, lodash.isEqual);
            // console.log('allowed_assets:' + allowed_assets);


            const assetList = await Asset.findAll({
                where: {
                    client_cust_id: req.params.custId,
                    client_id: req.body.client_id,
                    [Op.and]: [{
                        asset_id: {
                            [Op.in]: allowed_assets,
                        },
                        // asset_id: {
                        //   [Op.in]: allowed_assets_for_ticket,
                        // },
                    }],
                },
                attributes: ['asset_id', 'equipment_no'],
                include: [{
                    model: TabParameters,
                    as: 'equipment_type_details',
                    attributes: ['param_name', 'param_value'],
                }],
                raw: true,
            });

            return res.status(200).send({
                success: true,
                message: 'list of assets',
                data: assetList,
            });
        } catch (e) {
            return res.status(400).send({
                success: false,
                data: [],
                message: e.message,
            });
        }
    },

    async EquipmentCheckIn(req, res) {
        try {
            const tab_statuses= [];
            const tab_statuses_by_desc= [];
            const tab_statuses_desc_by_value= [];
            const assetTxnDetailFields = [];
            for (const key in req.body) {
                if (
                    key == 'manifest' ||
                    key == 'trucking_carrier' ||
                    key == 'generator' ||
                    key == 'email' ||
                    key == 'number'
                ) {
                    assetTxnDetailFields.push({ key, value: req.body[key] });
                }
            }

            const {client_id,estimate,user_id,coordinates,equipment_type,quantity,equipment_no}=req.body;
             
            const statusTabs = await TabParameters.findAll({
                where: {
                    param_key: ['asset_txns_status','equipment_type','ticket_status','doc_type'],
                    [Op.or]: [{
                        param_name: ['Check-In','Bulk','Release to Yard','Inspection Pending'],
                    },{
                        param_description:['Safety Sheets (SDS)','Bulk/ Other - Pumps','Bulk/ Other - Hoses','Bulk/ Other - Berm']
                    }]
                },
                attributes: ['param_name','param_value','param_description'],
                order: [
                    ['param_value', 'DESC']
                ],
                raw:true
            });

            for(let index = 0; index < statusTabs.length; index++) {
                tab_statuses[statusTabs[index]['param_name']] = statusTabs[index]['param_value'];
                tab_statuses_by_desc[statusTabs[index]['param_description']] = statusTabs[index]['param_value'];
                tab_statuses_desc_by_value[statusTabs[index]['param_value']] = statusTabs[index]['param_description'];
            }

            console.log(tab_statuses);
            console.log(tab_statuses_by_desc);
            // return res.send(statusTabs);

            // const statusTabs = await TabParameters.findOne({
            //     where: {
            //         param_key: 'asset_txns_status',
            //         param_name: 'Check-In',
            //     },
            //     attributes: ['param_value'],
            //     order: [
            //         ['param_value', 'DESC']
            //     ],
            // });

            // const statusTabsEquipType = await TabParameters.findAll({
            //     where: {
            //         param_key: 'equipment_type',
            //         param_name: 'Bulk/ Other - Berm',
            //     },
            //     attributes: ['param_value'],
            //     order: [
            //         ['param_value', 'DESC']
            //     ],
            // });

            const checkType = statusTabs.find((val, ind) => {
                return val.param_value === equipment_type;
            });

            if (!checkType && !equipment_no) {
                return res.status(200).send({
                    success: false,
                    message: 'Equipment number is required',
                });
            }

            const client=await ClientMst.findByPk(client_id);

            const approveCheckIn=async(assetTxnId,client_id,coordinates,assetTxnDetails,estimate,user_id)=>{
                let coords = {
                  type: 'Point',
                  coordinates: (coordinates!==undefined ? coordinates : [0,0]),
                };
                let cust_id = assetTxnDetails.client_cust_id;
                let ticketCount = await TicketMst.max('ticket_ref_id', {
                  where: {
                    client_id: client_id,
                  },
                });
                if (isNaN(ticketCount)) {
                  ticketCount = client.last_ticket_number;
                }
                ticketCount++;
                let estimate_price = (estimate===undefined ? 0 : estimate);
                let invoice_price = 0;
                // let statusTabs = await TabParameters.findOne({
                //   where: {
                //     param_key: 'asset_txns_status',
                //     param_name: 'Release to Yard',
                //   },
                //   attributes: ['param_value'],
                //   order: [['param_value', 'DESC']],
                // });
                assetTxnDetails.status = tab_statuses['Release to Yard']
                assetTxnDetails.updated_by = user_id;
                assetTxnDetails.save();
          
                // statusTabs = await TabParameters.findOne({
                //   where: {
                //     param_key: 'ticket_status',
                //     param_name: 'Inspection Pending',
                //   },
                //   attributes: ['param_value', 'param_name'],
                //   order: [['param_value', 'DESC']],
                // });
                const ticketDetails = await TicketMst.create({
                  ticket_ref_id: ticketCount,
                  client_id: client_id,
                  client_cust_id: cust_id,
                  asset_id: assetTxnDetails.asset_id,
                  asset_txns_id: assetTxnDetails.asset_txns_id,
                  description: assetTxnDetails.remark,
                  po_id: assetTxnDetails.po_id,
                  estimate_price: estimate_price,
                  invoice_price: invoice_price,
                  quantity: (quantity===undefined ? 1 : quantity),
                  discount: 0,
                  created_by: assetTxnDetails.created_by,
                  updated_by: user_id,
                  status: tab_statuses['Inspection Pending'],
                });
                const ticketObj = ticketDetails.get({ plain: true });
                await TicketTxns.create({
                  client_id: client_id,
                  client_cust_id: cust_id,
                  asset_id: assetTxnDetails.asset_id,
                  asset_txns_id: assetTxnDetails.asset_txns_id,
                  ticket_id: ticketObj.ticket_id,
                  parameter_name: 'ticket_created',
                  parameter_value: ticketObj.ticket_id,
                  remark:
                    assetTxnDetails && assetTxnDetails.remark
                      ? assetTxnDetails.remark
                      : 'NO REMARK',
                  coordinates: coords,
                  approved_by:user_id,
                  created_by:user_id,
                });
          
                await AssetTxnDetails.create({
                  asset_txns_id: assetTxnDetails.asset_txns_id,
                  asset_id: assetTxnDetails.asset_id,
                  field_name: 'equipment_status',
                  field_value:
                    'equipment_accepted_for_further_wash_inspection_at_approval',
                  remark:
                    assetTxnDetails && assetTxnDetails.remark
                      ? assetTxnDetails.remark
                      : 'NO REMARK',
                  created_by: user_id,
                });
          
                return res.status(200).send({
                    success: true,
                    message: 'Ticket created successfully.',
                    data: []
                });
            };

            if (!req.body.asset_id) {
                let equipNo = equipment_no;
                if (
                    (checkType && !equipment_no) ||
                    equipment_no.length === 0
                ) {
                    const BulkItemCheck = await AssetMst.findAll({
                        where: {
                            client_id: client_id,
                            equipment_type: equipment_type,
                            equipment_no: sequelize.where(
                                sequelize.fn('LOWER', sequelize.col('equipment_no')),
                                'LIKE',
                                'BULK' + '%'
                            ),
                            client_cust_id: req.body.client_cust_id,
                        },
                        order: [
                            ['created_at', 'DESC']
                        ],
                        raw: true,
                    });
                    if (BulkItemCheck!==undefined && BulkItemCheck.length > 0) {
                        const newID = BulkItemCheck[0].equipment_no.split('-');
                        equipNo = `BULK-${req.body.client_cust_id}-${parseInt(newID[2]) +
              1}`;
                    } else {
                        equipNo = `BULK-${req.body.client_cust_id}-1`;
                    }
                }

                const assetCheck = await Asset.findOne({
                    where: {
                        client_id: client_id,
                        equipment_no: equipNo,
                        equipment_type: equipment_type,
                        client_cust_id: req.body.client_cust_id,
                    },
                });
                if (assetCheck) {
                    return res.status(200).send({
                        success: false,
                        message: 'Asset already exists',
                    });
                }

                const asset = await Asset.create({
                    client_cust_id: req.body.client_cust_id,
                    equipment_no: equipNo,
                    equipment_type: equipment_type,
                    remark: 'ASSET ADDED',
                    status: 1,
                    owner: req.body.owner ? req.body.owner : null,
                    client_id: client_id,
                    created_by: user_id,
                });

                const assetTx = await AssetTxns.create({
                    client_id: client_id,
                    client_cust_id: req.body.client_cust_id,
                    asset_id: asset.asset_id,
                    asset_type: equipment_type,
                    quantity: (quantity===undefined ? 1 : quantity),
                    location_id: req.body.location_id,
                    po_id: req.body.po_id ? req.body.po_id : null,
                    last_known: req.body.last_known ? req.body.last_known : null,
                    driver_name: req.body.driver_name ? req.body.driver_name : null,
                    job_site: req.body.job_site ? req.body.job_site : null,
                    remark: req.body.remark ? req.body.remark : null,
                    created_by: req.body.user_id,
                    status: tab_statuses['Check-In'],
                });

                const assetTxnData = await assetTxnDetailFields.map((val, index) => {
                    return {
                        asset_txns_id: assetTx.dataValues.asset_txns_id,
                        asset_id: asset.asset_id,
                        created_by: req.body.user_id,
                        field_name: val.key,
                        field_value: val.value,
                    };
                });
                assetTxnData.push({
                    asset_txns_id: assetTx.dataValues.asset_txns_id,
                    asset_id: asset.asset_id,
                    field_name: 'equipment_status',
                    field_value: 'equipment_checked_in',
                    created_by: req.body.user_id,
                });
                let result = await AssetTxnDetails.bulkCreate(assetTxnData, {
                    returning: true,
                });
                if (req.body.sds!==undefined && req.body.sds?.length>0) {
                    const coordinates = {
                        type: 'Point',
                        coordinates: req.body.coordinates,
                    };
                    // const statusTabsDocType = await TabParameters.findOne({
                    //     where: {
                    //         param_key: 'doc_type',
                    //         param_description: 'Safety Sheets (SDS)',
                    //     },
                    //     attributes: ['param_value', 'param_description'],
                    // });
                    const assetDocData = req.body.sds.map((val, index) => {
                        return {
                            asset_txns_id: assetTx.dataValues.asset_txns_id,
                            asset_id: asset.asset_id,
                            client_cust_id: req.body.client_cust_id,
                            client_id: req.body.client_id,
                            created_by: req.body.user_id,
                            doc_path: val,
                            flag: 1,
                            coordinates: coordinates,
                            doc_type: tab_statuses_by_desc['Safety Sheets (SDS)'],
                            doc_name: tab_statuses_desc_by_value[tab_statuses_by_desc['Safety Sheets (SDS)']],
                        };
                    });
                    await AssetWashDocs.bulkCreate(assetDocData, {
                        returning: true,
                    });
                }

                if (result) {
                    if(client.prewash_check>0) 
                        await approveCheckIn(assetTx.dataValues.asset_txns_id,client_id,coordinates,assetTx,estimate,user_id);
                    else 
                        return res.status(200).send({
                            success: true,
                            message: 'succesfully added & checked in asset',
                            data: { assetTxnId: assetTx.dataValues.asset_txns_id },
                        });
                }
            } 
            else if (req.body.asset_id) {
                const assetCheck = await Asset.findOne({
                    where: {
                        client_id: req.body.client_id,
                        equipment_no: req.body.equipment_no,
                        equipment_type: equipment_type,
                        asset_id: req.body.asset_id,
                        client_cust_id: req.body.client_cust_id,
                    },
                });
                if (!assetCheck) {
                    return res.status(200).send({
                        success: false,
                        message: 'Asset does not exists',
                    });
                }
                const assetTx = await AssetTxns.create({
                    client_id: req.body.client_id,
                    client_cust_id: req.body.client_cust_id,
                    asset_id: req.body.asset_id,
                    asset_type: equipment_type,
                    quantity: (quantity===undefined ? 1 : quantity),
                    location_id: req.body.location_id,
                    po_id: req.body.po_id ? req.body.po_id : null,
                    last_known: req.body.last_known ? req.body.last_known : null,
                    driver_name: req.body.driver_name ? req.body.driver_name : null,
                    job_site: req.body.job_site ? req.body.job_site : null,
                    remark: req.body.remark ? req.body.remark : null,
                    created_by: req.body.user_id,
                    status: tab_statuses['Check-In'],
                });

                const assetTxnData = await assetTxnDetailFields.map((val, index) => {
                    return {
                        asset_txns_id: assetTx.dataValues.asset_txns_id,
                        asset_id: req.body.asset_id,
                        created_by: req.body.user_id,
                        field_name: val.key,
                        field_value: val.value,
                    };
                });
                assetTxnData.push({
                    asset_txns_id: assetTx.dataValues.asset_txns_id,
                    asset_id: req.body.asset_id,
                    field_name: 'equipment_status',
                    field_value: 'equipment_checked_in',
                    created_by: req.body.user_id,
                });
                let result = await AssetTxnDetails.bulkCreate(assetTxnData, {
                    returning: true,
                });
                if (req.body.sds!==undefined && req.body.sds?.length > 0) {
                    const coordinates = {
                        type: 'Point',
                        coordinates: req.body.coordinates,
                    };
                    // const statusTabsDocType = await TabParameters.findOne({
                    //     where: {
                    //         param_key: 'doc_type',
                    //         param_description: 'Safety Sheets (SDS)',
                    //     },
                    //     attributes: ['param_value', 'param_description'],
                    // });
                    const assetDocData = req.body.sds.map((val, index) => {
                        return {
                            asset_txns_id: assetTx.dataValues.asset_txns_id,
                            asset_id: req.body.asset_id,
                            client_cust_id: req.body.client_cust_id,
                            client_id: req.body.client_id,
                            created_by: req.body.user_id,
                            doc_path: val,
                            flag: 1,
                            coordinates: coordinates,
                            doc_type: tab_statuses_by_desc['Safety Sheets (SDS)'],
                            doc_name: tab_statuses_desc_by_value[tab_statuses_by_desc['Safety Sheets (SDS)']],
                        };
                    });
                    await AssetWashDocs.bulkCreate(assetDocData, {
                        returning: true,
                    });
                }

                if (result) {
                    if(client.prewash_check>0) 
                        await approveCheckIn(assetTx.dataValues.asset_txns_id,client_id,coordinates,assetTx,estimate,user_id);
                    else 
                        return res.status(200).send({
                            success: true,
                            message: 'succesfully checked in asset',
                            data: assetTx.dataValues.asset_txns_id,
                        });
                }
            }
        } catch (e) {
            return res.status(400).send({
                success: false,
                message: e.message,
                data:[]
            });
        }
    },

    async RejectEquipmentCheckIn(req, res) {
        try {
            if (!req.body.asset_txns_id) {
                return res.status(200).send({
                    message: 'asset transaction id is required',
                    success: false,
                });
            }
            let changeStatusTab = await TabParameters.findOne({
                where: {
                    param_key: 'asset_txns_status',
                    param_name: 'Check-In',
                },
                attributes: ['param_value'],
            });

            const astTxn = await AssetTxns.findOne({
                where: {
                    asset_txns_id: req.body.asset_txns_id,
                    client_id: req.body.client_id,
                    status: changeStatusTab.param_value,
                },
                raw: true,
            });

            if (!astTxn) {
                return res.status(200).send({
                    message: 'Not a valid transaction',
                });
            }

            changeStatusTab = await TabParameters.findOne({
                where: {
                    param_key: 'asset_txns_status',
                    param_name: 'Rejected',
                },
                attributes: ['param_value'],
            });

            const result = await AssetTxns.update({
                status: changeStatusTab.param_value,
            }, {
                where: {
                    asset_txns_id: req.body.asset_txns_id,
                    client_id: req.body.client_id,
                },
            });

            const finResult = await AssetTxnDetails.create({
                asset_txns_id: req.body.asset_txns_id,
                asset_id: astTxn.asset_id,
                field_name: 'equipment_status',
                field_value: 'equipment_rejected_at_approval',
                remark: req.body.remark ? req.body.remark : null,
                created_by: req.body.user_id,
            });

            if (result && finResult) {
                return res.status(200).send({
                    message: 'Successfully rejected',
                    success: true,
                });
            } else if (!result || !finResult) {
                return res.status(200).send({
                    message: 'Failed to update asset transaction status',
                    success: false,
                });
            }
        } catch (e) {
            return res.status(400).send({
                success: false,
                message: e.message,
            });
        }
    },
    
    async EditEquipmentCheckIn(req, res) {
        try {
            if (!req.body.po_id) {
                return res.status(200).send({
                    message: 'PO ID IS REQUIRED TO GENERATE TICKET',
                    success: false,
                });
            }
            const assetID = req.body.asset_id;
            const assetTxnID = req.body.asset_txns_id;
            delete req.body['asset_id'];
            delete req.body['asset_txns_id'];
            const assetTxnDetailFields = [];
            let changeStatusTab = await TabParameters.findOne({
                where: {
                    param_key: 'asset_txns_status',
                    param_name: 'Check-In',
                },
                attributes: ['param_value'],
            });

            const astTxn = await AssetTxns.findOne({
                where: {
                    asset_txns_id: assetTxnID,
                    client_id: req.body.client_id,
                    status: changeStatusTab.param_value,
                },
                raw: true,
            });

            if (!astTxn) {
                return res.status(200).send({
                    message: 'Not a valid transaction',
                    success: false,
                });
            }
            for (const key in req.body) {
                if (
                    key == 'manifest' ||
                    key == 'trucking_carrier' ||
                    key == 'generator' ||
                    key == 'email' ||
                    key == 'number'
                ) {
                    assetTxnDetailFields.push({ key, value: req.body[key] });
                }
            }

            if (req.body.owner) {
                await Asset.update({
                    owner: req.body.owner,
                    updated_by: req.body.user_id,
                }, {
                    where: { asset_id: assetID },
                });
            }

            const updatedAssetTxn = await AssetTxns.update({
                remark: req.body.remark ? req.body.remark : null,
                job_site: req.body.job_site ? req.body.job_site : null,
                po_id: req.body.po_id,
                last_known: req.body.last_known ? req.body.last_known : null,
                driver_name: req.body.driver_name ? req.body.driver_name : null,
                location_id: req.body.location_id,
                updated_by: req.body.user_id,
            }, {
                where: {
                    asset_txns_id: assetTxnID,
                    client_id: req.body.client_id,
                },
            });

            if (!updatedAssetTxn) {
                return res.status(200).send({
                    message: 'Failed to update asset transactions',
                    success: false,
                });
            }

            if (req.body.manifest) {
                const findManifest = await AssetTxnDetails.findOne({
                    where: {
                        asset_txns_id: assetTxnID,
                        field_name: 'manifest',
                    },
                });
                if (findManifest) {
                    await AssetTxnDetails.update({
                        field_value: req.body.manifest,
                        updated_by: req.body.user_id,
                    }, {
                        where: {
                            asset_txns_id: assetTxnID,
                            field_name: 'manifest',
                        },
                    });
                } else {
                    await AssetTxnDetails.create({
                        asset_txns_id: assetTxnID,
                        asset_id: assetID,
                        field_name: 'manifest',
                        field_value: req.body.manifest,
                        created_by: req.body.user_id,
                    });
                }
            }

            if (req.body.generator) {
                const findGenerator = await AssetTxnDetails.findOne({
                    where: {
                        asset_txns_id: assetTxnID,
                        field_name: 'generator',
                    },
                });
                if (findGenerator) {
                    await AssetTxnDetails.update({
                        field_value: req.body.generator,
                        updated_by: req.body.user_id,
                    }, {
                        where: {
                            asset_txns_id: assetTxnID,
                            field_name: 'generator',
                        },
                    });
                } else {
                    await AssetTxnDetails.create({
                        asset_txns_id: assetTxnID,
                        asset_id: assetID,
                        field_name: 'generator',
                        field_value: req.body.generator,
                        created_by: req.body.user_id,
                    });
                }
            }
            if (req.body.number) {
                const findNumber = await AssetTxnDetails.findOne({
                    where: {
                        asset_txns_id: assetTxnID,
                        field_name: 'number',
                    },
                });
                if (findNumber) {
                    await AssetTxnDetails.update({
                        field_value: req.body.number,
                        updated_by: req.body.user_id,
                    }, {
                        where: {
                            asset_txns_id: assetTxnID,
                            field_name: 'number',
                        },
                    });
                } else {
                    await AssetTxnDetails.create({
                        asset_txns_id: assetTxnID,
                        asset_id: assetID,
                        field_name: 'number',
                        field_value: req.body.number,
                        created_by: req.body.user_id,
                    });
                }
            }

            if (req.body.email) {
                const findEmail = await AssetTxnDetails.findOne({
                    where: {
                        asset_txns_id: assetTxnID,
                        field_name: 'email',
                    },
                });
                if (findEmail) {
                    await AssetTxnDetails.update({
                        field_value: req.body.email,
                        updated_by: req.body.user_id,
                    }, {
                        where: {
                            asset_txns_id: assetTxnID,
                            field_name: 'email',
                        },
                    });
                } else {
                    await AssetTxnDetails.create({
                        asset_txns_id: assetTxnID,
                        asset_id: assetID,
                        field_name: 'email',
                        field_value: req.body.email,
                        created_by: req.body.user_id,
                    });
                }
            }

            if (req.body.trucking_carrier) {
                const findTruckingCarrier = await AssetTxnDetails.findOne({
                    where: {
                        asset_txns_id: assetTxnID,
                        field_name: 'trucking_carrier',
                    },
                });
                if (findTruckingCarrier) {
                    await AssetTxnDetails.update({
                        field_value: req.body.trucking_carrier,
                        updated_by: req.body.user_id,
                    }, {
                        where: {
                            asset_txns_id: assetTxnID,
                            field_name: 'trucking_carrier',
                        },
                    });
                } else {
                    await AssetTxnDetails.create({
                        asset_txns_id: assetTxnID,
                        asset_id: assetID,
                        field_name: 'trucking_carrier',
                        field_value: req.body.trucking_carrier,
                        created_by: req.body.user_id,
                    });
                }
            }
            // const finResult = await AssetTxnDetails.create({
            //     asset_txns_id: assetTxnID,
            //     asset_id: assetID,
            //     field_name: 'equipment_status',
            //     field_value: 'equipment_accepted_for_further_wash_inspection_at_approval',
            //     created_by: req.body.user_id,
            // });

            return res.status(200).send({
                message: 'Successfully updated asset transactions',
                success: true,
                data: {
                    asset_txns_id: assetTxnID,
                },
            });
        } catch (e) {
            return res.status(400).send({
                success: false,
                message: e.message,
            });
        }
    },

    async getCheckInAssetData(req, res) {
        try {
            let result = {};
            if (!req.params.assetTxnId) {
                return res.status(200).send({
                    message: 'AssetTxn is required',
                    success: false,
                });
            }
            const assetTxn = await AssetTxns.findOne({
                where: {
                    asset_txns_id: req.params.assetTxnId,
                },
                attributes: [
                    'client_cust_id',
                    'asset_id',
                    'remark',
                    'job_site',
                    'driver_name',
                    'last_known',
                    'po_id',
                    'location_id',
                    'quantity'
                ],
            });

            const assetMstData = await Asset.findOne({
                where: {
                    asset_id: assetTxn.asset_id,
                },
                attributes: ['equipment_no', 'equipment_type', 'owner'],
            });
            const assetTxnDetailsData = await AssetTxnDetails.findAll({
                where: {
                    asset_txns_id: req.params.assetTxnId,
                    asset_id: assetTxn.asset_id,
                },
                attributes: ['field_name', 'field_value'],
                raw: true,
            });
            const txndetail = {};
            assetTxnDetailsData.map((val, index) => {
                if (val.field_name == 'manifest') {
                    txndetail['manifest'] = val.field_value;
                }
                if (val.field_name == 'generator') {
                    txndetail['generator'] = val.field_value;
                }
                if (val.field_name == 'trucking_carrier') {
                    txndetail['trucking_carrier'] = val.field_value;
                }
                if (val.field_name == 'email') {
                    txndetail['email'] = val.field_value;
                }
                if (val.field_name == 'number') {
                    txndetail['number'] = val.field_value;
                }
            });
            const assetDocs = await AssetWashDocs.findAll({
                where: {
                    client_id: req.body.client_id,
                    asset_txns_id: req.params.assetTxnId,
                    asset_id: assetTxn.asset_id,
                },
                attributes: ['doc_id', 'doc_type', 'doc_name', 'doc_path'],
                raw: true,
            });
            if (assetDocs) {
                console.log(assetDocs);
            }
            result = {
                ...assetTxn.dataValues,
                ...assetMstData.dataValues,
                ...txndetail,
                assetDocs: assetDocs,
            };

            return res.status(200).send({
                data: result,
                message: 'asset txn details fetched',
                success: true,
            });
        } catch (e) {
            return res.status(400).send({
                success: false,
                message: e.message,
            });
        }
    },

    async getCheckedInEquipmentList(req, res, next) {
        try {
            let statusTabs = await TabParameters.findAll({
                where: {
                    param_key: 'asset_txns_status',
                    // param_name: ['Check-In', 'Release to Yard', 'Checkout'],
                    param_name: ['Rejected', 'Wash-Complete'],
                },
                attributes: [
                    [sequelize.literal('GROUP_CONCAT(param_value)'), 'allowed_types'],
                ],
                raw: true,
                order: [
                    ['param_value', 'DESC']
                ],
            });
            let allowedAssets = await AssetTxns.findAll({
                where: {
                    status: statusTabs[0].allowed_types.split(','),
                    client_id: req.body.client_id,
                },
                raw: true,
                attributes: [
                    [sequelize.literal('GROUP_CONCAT(asset_id)'), 'allowed_assets'],
                ],
            });

            if (allowedAssets[0].allowed_assets == null) {
                return res.status(200).send({
                    message: 'No equipment exists!.',
                    success: true,
                    data: [],
                });
            }
            console.log(allowedAssets[0].allowed_assets.split(','));
            let assetList = await AssetMst.findAll({
                where: {
                    asset_id: allowedAssets[0].allowed_assets.split(','),
                    client_id: req.body.client_id,
                },
                attributes: [
                    'asset_id',
                    'equipment_type',
                    'equipment_no'
                ],
                raw: true,
                nest: true,
                include: [{
                        model: TabParameters,
                        as: 'equipment_type_details',
                        attributes: ['param_value', 'param_name'],
                    },
                    {
                        model: ClientCustomerMst,
                        as: 'customer_details',
                        attributes: ['clients_cust_id', 'name'],
                    },
                    {
                        model: TicketMst,
                        as: 'ticket_details',
                        attributes: ['ticket_id', 'ticket_ref_id', 'status'],
                        where: {
                            parent_id: {
                                [Op.eq]: 0,
                            },
                        },
                        order: [
                            ['ticket_id', 'DESC']
                        ],
                    },
                    {
                        model: AssetTxns,
                        as: 'asset_txns',
                        attributes: ['asset_txns_id', 'status'],
                        where: [{
                            status: statusTabs[0].allowed_types.split(','),
                        }, ],
                        include: [{
                            model: YardsMst,
                            as: 'yard_details',
                            attributes: ['name', 'address'],
                        }, ],
                    },
                    // include: [{
                    // }, ],
                ],
                group: ['asset_id']
            });

            return res.status(200).send({
                message: 'Equipments listed.',
                success: true,
                data: assetList,
            });
        } catch (error) {
            return res.status(400).send({
                success: false,
                message: error.message,
            });
        }
    },

    async EquipmentCheckOut(req, res, next) {
        try {
            let asset_txns_id = req.body.asset_txns_id;
            let details = req.body.details;
            let assetTxns = await AssetTxns.findOne({
                where: {
                    asset_txns_id: asset_txns_id,
                },
            });

            const assetTxnDetails = [];
            assetTxnDetails.push({
                asset_txns_id: asset_txns_id,
                asset_id: assetTxns.asset_id,
                field_name: 'equipment_status',
                field_value: 'equipment_checked_out',
                created_by: req.body.user_id,
            });
            details.forEach((element, index) => {
                assetTxnDetails.push({
                    asset_txns_id: asset_txns_id,
                    asset_id: assetTxns.asset_id,
                    field_name: element.key,
                    field_value: element.value,
                    created_by: req.body.user_id,
                });
            });
            await AssetTxnDetails.bulkCreate(assetTxnDetails);

            const statusTabs = await TabParameters.findAll({
                where: {
                    param_key: 'asset_txns_status',
                    param_name: 'Checkout',
                },
                raw: true,
                attributes: ['param_value'],
                order: [
                    ['param_value', 'DESC']
                ],
            });

            assetTxns.status = statusTabs[0].param_value;
            assetTxns.updated_by = req.body.user_id;
            assetTxns.save();

            return res.status(200).send({
                success: true,
                message: 'Checked-out succesfully.',
                data: [],
            });
        } catch (e) {
            return res.status(400).send({
                success: false,
                message: e.message,
                data: [],
            });
        }
    },
};