import { ObjectId } from 'mongodb';
import Complaint from '../models/orderComplain.js';
import Order from '../models/order.js'
import pkg from 'mongoose'
const { startSession } = pkg;

const complaintsInfo = async (req, res, next) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const status = req.query.status;
    const select = req.query.select;
    const user_type = req.user_type;
    if (user_type === 'admin') {
        const selectQuery = {};
        if (select) {
            const fieldsArray = select.split(',');
            fieldsArray.forEach((value) => {
                selectQuery[value] = 1;
            });
        }
        if (status) {
            const orderComplaint = await Complaint.find({
                status: { $in: status.split(',').map((x) => +x) },
            })
                .select(selectQuery)
                .skip((page - 1) * limit)
                .limit(limit)
                .populate({
                    path: 'order_id',
                    select: 'provider_id product_id estimated_time price note',
                })
                .populate({ path: 'client_id', select: 'fullname' })
                .populate({ path: 'admin_id', select: 'fullname' })
                .lean();
            res.send(orderComplaint);
            return;
        }
        const orderComplaint = await Complaint.find({})
            .select(selectQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .populate({
                path: 'order_id',
                select: 'provider_id product_id estimated_time price note',
            })
            .populate({ path: 'client_id', select: 'fullname' })
            .populate({ path: 'admin_id', select: 'fullname' })
            .lean();
        res.send(orderComplaint);
        return;
    }
    throw new Error('you do not have permission to view all orders');
}
const orderComplaints = async (req, res, next) => {
    const user_id = req.user_id;
    const orderId = req.params.orderId;
    const user_type = req.user_type;
    const order = await Order.findById(orderId);
    if (!order) {
        throw new Error('order not found');
    }
    if (user_type === 'admin') {
        const orderComplain = await Complaint.findOne({ order_id: orderId }).lean();
        res.send(orderComplain)
        return;
    }
    if (
        order.client_id.toString() !== user_id.toString() &&
        order.provider_id.toString() !== user_id.toString()
    ) {
        throw new Error(
            'you do not have permission to view complain of this order',
        );
    }
    const orderComplain = await Complaint.findOne({ order_id: orderId }).lean();
    res.send(orderComplain)
    return;
}

const myComplaints = async (req, res, next) => {
    const user_id = req.user_id;
    const user_type = req.user_type;
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query.select;
    const status = req.query.status;
    const selectQuery = {};
    if (select) {
      const fieldsArray = select.split(',');
      fieldsArray.forEach((value) => {
        selectQuery[value] = 1;
      });
    }
    const orderComplains =
      await Complaint.find({ client_id: user_id, status: { $in: status.split(',').map((x) => +x) }})
      .select(selectQuery)
      .skip((page - 1) * limit)
      .limit(limit)
      .populate({
        path: 'order_id',
        select: 'provider_id product_id estimated_time price note',
      })
      .lean();
    if (!orderComplains) {
      return null;
    }
    res.send(orderComplains);
}
const resolvedComplaint = async (req, res, next) => {
    const user_id = req.user_id;
    const user_type = req.user_type;
    const orderComplainId = req.params.orderComplainId;
    const orderComplain = await Complaint.findById(orderComplainId)
    .populate({
      path: 'order_id',
      select: 'provider_id product_id estimated_time price note',
    })
    .populate({ path: 'client_id', select: 'fullname' })
    .populate({ path: 'admin_id', select: 'fullname' })
    .lean();
    if (!orderComplain) {
        throw new Error('order complain not found');
    }
    if (user_type !== 'admin') {
        throw new Error('you do not have permission to resolve order complain');
    }
    const newComplain = await Complaint.findByIdAndUpdate(
        orderComplainId,
        {
          admin_id: user_id,
          status: 2,
        },
        { new: true },
      );
    res.send(newComplain);
    return;
}
const specificComplaint = async (req, res, next) => {
    const user_id = req.user_id;
    const user_type = req.user_type;
    const orderComplainId = req.params.orderComplainId;
    const orderComplain =
        await Complaint.findById(orderComplainId)
        .populate({
          path: 'order_id',
          select: 'provider_id product_id estimated_time price note',
        })
        .populate({ path: 'client_id', select: 'fullname avatar' })
        .populate({ path: 'admin_id', select: 'fullname avatar' })
        .lean();
    if (!orderComplain) {
        throw new Error('order complain not found');
    }
    if (user_type === 'admin') {
        res.send(orderComplain);
        return;
    }
    if (orderComplain.client_id.toString() !== user_id.toString()) {
        throw new Error(
            'you do not have permission to view complain of this order',
        );
    }
    res.send(orderComplain);
    return;
}





const complaints = {
    complaintsInfo,
    orderComplaints,
    myComplaints,
    resolvedComplaint,
    specificComplaint
}
export default complaints;  