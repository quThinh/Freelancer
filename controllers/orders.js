import { ObjectId } from 'mongodb';
import Order from '../models/order.js';
import Offer from '../models/offer.js';
import agenda from '../agenda.js';
import Wallet from '../models/wallet.js';
import WalletStatus from '../models/walletStatus.js'
import Transaction from '../models/transaction.js';
import Product from '../models/productService.js'
import pkg from 'mongoose';
import orderComplain from '../models/orderComplain.js';
import { ProductStatus } from '../models/productStatus.js';
import productService from '../models/productService.js';
const { startSession } = pkg;

const getOrdersWithProviderPopulate = async (page,
    limit,
    query,
    selectQuery) => {
    return await Order.find(query)
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'product_id', select: 'name description' })
        .populate({ path: 'provider_id', select: 'fullname' })
        .lean();
}

const getOrdersWithClientPopulate = async (page,
    limit,
    query,
    selectQuery) => {
    return await Order.find(query)
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'product_id', select: 'name description' })
        .populate({ path: 'client_id', select: 'fullname' })
        .lean();
}

const getAllOrder = async (req, res, next) => {
    const role = req.query.role;
    const type = req.query.type;
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query.select;
    const status = req.query.status;
    const user_id = req.user_id;
    const selectQuery = {};
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
    }
    if (role === 'client') {
        selectQuery['client_id'] = 0;
        if (status) {
            if (type === 'job') {
                res.send(await getOrdersWithProviderPopulate(
                    page,
                    limit,
                    {
                        client_id: user_id,
                        status: { $in: status.split(',').map((x) => +x) },
                        type: "job",
                    },
                    selectQuery,
                ));
                return;
            }
            if (type === 'service') {
                res.send(await getOrdersWithProviderPopulate(
                    page,
                    limit,
                    {
                        client_id: user_id,
                        status: { $in: status.split(',').map((x) => +x) },
                        type: "service",
                    },
                    selectQuery,
                ));
                return;
            }
            res.send(await getOrdersWithProviderPopulate(
                page,
                limit,
                {
                    client_id: user_id,
                    status: { $in: status.split(',').map((x) => +x) },
                },
                selectQuery,
            ));
            return;
        }
        res.send(await getOrdersWithProviderPopulate(
            page,
            limit,
            {
                client_id: user_id,
                type: type || { $in: ["job", "service"] },
            },
            selectQuery,
        ));
        return;
    } else if (role === 'provider') {
        selectQuery['provider_id'] = 0;
        if (status) {
            res.send(await getOrdersWithClientPopulate(
                page,
                limit,
                {
                    provider_id: user_id,
                    status: { $in: status.split(',').map((x) => +x) },
                    type: type || { $in: ["job", "service"] },
                },
                selectQuery,
            ));
            return;
        }
        console.log(type, role)
        res.send(await getOrdersWithClientPopulate(
            page,
            limit,
            {
                provider_id: user_id,
                type: type || { $in: ["job", "service"] },
            },
            selectQuery,
        ));
        return;
    }
    throw new Error(
        'You did not specify role or do not have permision to get this order',
    );
}

const acceptOffer = async (req, res, next) => {
    const user_id = req.user_id;
    const note = req.body.note;
    const job_offer_id = req.params.job_offer_id;
    const offer = await Offer.findById(job_offer_id)
    const job = await Product.findById(offer?.job_id)
    console.log(offer)
    if (
        !job ||
        job.status === 2 ||     //inactive
        job.status === 3        //expired
    )
        throw new Error('Job not found');
    if (
        !offer ||
        offer.status !== 0 ||   //pending
        user_id.toString() !== job.user_id.toString()
    ) {
        console.log(user_id, job)
        throw new Error('Offer not found or you do not have permision to accept');
    }

    const checkWallet = await Wallet.findOne({
        user_id,
    });
    if (!checkWallet || checkWallet.status === 0) {
        throw new Error('CLient Wallet not found');
    }
    if (checkWallet.status === WalletStatus.LOCKED) {
        throw new Error('CLient Wallet is blocked');
    }
    if (checkWallet.available_balance < offer.offer_price) {
        throw new Error('insufficient available balance');
    }
    const session = await startSession();
    session.startTransaction();
    try {
        const newOrder = await Order.create(
            [
                {
                    product_id: job._id.toString(),
                    client_id: user_id,
                    provider_id: offer.provider_id.toString(),
                    type: "job",
                    price: offer.offer_price,
                    note,
                    estimated_time: offer.offer_finish_estimated_time,
                },
            ],
            { session },
        );
        await Offer.findByIdAndUpdate(
            job_offer_id,
            { status: 1 },
            { session },
        );
        await Offer.updateMany(
            { job_id: job._id.toString(), status: 0 },
            { status: 2 },
            { session },
        );
        await session.commitTransaction();
        session.endSession();
        const returnObject = (await Order.findById(
            newOrder[0]._id.toString(),
        ).lean())
        return res.status(200).send({ message: "Accept offer successfully!" });
    } catch (err) {
        console.log(err)
        await session.abortTransaction();
        await session.endSession();
        throw err;
    }
}

const cancelOrder = async (req, res, next) => {
    const order_id = req.params.order_id;
    const cancel_note = req.body.note;
    const user_id = req.user_id;
    const user_type = req.user_type;
    const currentOrder = await Order.findById(new ObjectId(order_id));
    if (!currentOrder) throw new Error('Order not found');
    const newCancelNote = `${cancel_note} (by ${user_type} ${user_id})`;
    if (user_type === 'admin') {
        if (
            currentOrder.status !== 0 &&
            currentOrder.status !== 1
        )
            throw new Error('Order is not in pending or confirmed');
        const jobs = await agenda.jobs({
            name: 'auto complete order',
            data: order_id,
        });
        if (jobs.length > 0) {
            jobs[0].remove();
        }
        const session = await startSession();
        session.startTransaction();
        try {
            const newOrder = await Order.findByIdAndUpdate(
                order_id,
                { status: 7, cancel_note: newCancelNote },
                { session, new: true },
            );
            await session.commitTransaction();
            session.endSession();
            res.send({ message: "Cancel order successfully." })
            return newOrder;
        } catch (err) {
            await session.abortTransaction();
            await session.endSession();
            throw err;
        }
    }
    if (user_type === 'client') {
        if (currentOrder.client_id.toString() === user_id.toString()) {
            if (currentOrder.status !== 0)
                throw new Error('Order is not in pending');
            const session = await startSession();
            session.startTransaction();
            try {
                const newOrder = await Order.findByIdAndUpdate(
                    new ObjectId(order_id),
                    { status: 5, cancel_note: newCancelNote },
                    { session, new: true },
                );
                await session.commitTransaction();
                session.endSession();
                res.send({ message: "Cancel order successfully." })
                return newOrder;
            } catch (err) {
                await session.abortTransaction();
                await session.endSession();
                throw err;
            }
        }
        if (currentOrder.provider_id.toString() === user_id.toString()) {
            if (
                currentOrder.status !== 0 &&
                currentOrder.status !== 1
            )
                throw new Error('Order is not in pending or confirmed');
            const jobs = await agenda.jobs({
                name: 'auto complete order',
                data: order_id,
            });
            if (jobs.length > 0) {
                jobs[0].remove();
            }
            const session = await startSession();
            session.startTransaction();
            try {
                const newOrder = await Order.findByIdAndUpdate(
                    order_id,
                    { status: 6, cancel_note: newCancelNote },
                    { session, new: true },
                );
                await session.commitTransaction();
                session.endSession();
                res.send({ message: "Cancel order successfully." })
                return newOrder;
            } catch (err) {
                await session.abortTransaction();
                await session.endSession();
                throw err;
            }
        }
        throw new Error('You do not have permision to cancel this order');
    }
    throw new Error('You do not have permision to cancel this order');
}

const completeOrder = async (req, res, next) => {
    const order_id = req.params.order_id;
    const user_id = req.user_id;
    const user_type = req.user_type;
    const currentOrder = await Order.findById(order_id);
    console.log(user_type)
    if (!currentOrder) throw new Error('Order not found');
    if (currentOrder.status !== 2)
        throw new Error('Order is not in finished');
    if (user_type === 'admin') {
        const session = await startSession();
        session.startTransaction();
        try {
            const amount = currentOrder.price;
            const fee = Math.round(amount * parseFloat(process.env.FEE_AMOUNT));
            const checkWallet = await Wallet.findOne({
                user_id: currentOrder.client_id.toString(),
            });
            if (!checkWallet || checkWallet.status === WalletStatus.NEW) {
                throw new Error('CLient Wallet not found');
            }
            if (checkWallet.status === WalletStatus.LOCKED) {
                throw new Error('CLient Wallet is blocked');
            }
            if (checkWallet.available_balance < amount) {
                throw new Error('insufficient available balance');
            }
            const fromWallet = await Wallet.findOneAndUpdate(
                { user_id: currentOrder.client_id.toString() },
                { $inc: { available_balance: -amount } },
                { new: true, session },
            );

            if (currentOrder.type === "service") {
                await productService.findByIdAndUpdate(
                    currentOrder.product_id.toString(),
                    { $inc: { sold_time: 1 } },
                    { session },
                );
            }
            const newTransaction = await Transaction.create(
                [
                    {
                        type: "INTERNAL",
                        wallet_id: fromWallet._id,
                        amount: amount,
                        direction: 1,
                        fee,
                        order_id,
                        content: `Thanh toan don hang ${order_id} voi so Bi: ${amount} - Phi giao dich: ${fee} Bi. Thoi gian: ${new Date()}`,
                    },
                ],
                { session },
            );
            if (!newTransaction) throw new Error('Transaction not created');
            const newOrder = await Order.findByIdAndUpdate(
                order_id,
                { status: 3 },
                { session, new: true },
            );
            if (!newOrder) throw new Error('Order not updated');
            await session.commitTransaction();
            session.endSession();
            const jobs = await agenda.jobs({
                name: 'auto complete order',
                data: order_id,
            });
            if (jobs.length > 0) {
                jobs[0].remove();
            }
            return newOrder;
        } catch (err) {
            await session.abortTransaction();
            await session.endSession();
            throw err;
        }
    }
    if (user_type === 'client') {
        if (currentOrder.client_id.toString() === user_id.toString()) {
            const session = await startSession();
            session.startTransaction();
            try {
                const amount = currentOrder.price;
                const fee = Math.round(amount * parseFloat(process.env.FEE_AMOUNT));
                const fromWallet = await Wallet.findOneAndUpdate(
                    { user_id },
                    { $inc: { available_balance: -amount } },
                    { new: true, session },
                );
                if (!fromWallet) throw new Error('CLient Wallet not found');
                const newTransaction = await Transaction.create(
                    [
                        {
                            wallet_id: fromWallet._id,
                            type: "INTERNAL",
                            amount: amount,
                            direction: 1,  //out
                            fee,
                            order_id,
                            content: `Thanh toan don hang ${order_id} voi so Bi: ${amount} - Phi giao dich: ${fee} Bi. Thoi gian: ${new Date()}`,
                        },
                    ],
                    { session },
                );
                if (!newTransaction) throw new Error('Transaction not created');
                const newOrder = await Order.findByIdAndUpdate(
                    order_id,
                    { status: 3 },  //paid
                    { session, new: true },
                );
                if (!newOrder) throw new Error('Order not updated');
                await session.commitTransaction();
                session.endSession();
                const jobs = await agenda.jobs({
                    name: 'auto complete order',
                    data: order_id,
                });
                if (jobs.length > 0) {
                    jobs[0].remove();
                }
                res.send({ message: "completed order." })
                return newOrder;
            } catch (err) {
                console.log(err)
                await session.abortTransaction();
                await session.endSession();
                throw err;
            }
        }
        throw new Error('You do not have permision to complete this order');
    }
    throw new Error('You do not have permision to complete this order');
}
const complainOrder = async (req, res, next) => {
    const order_id = req.params.order_id;
    const user_id = req.user_id;
    const complain = req.body.complain;
    const user_type = req.user_type;
    const currentOrder = await Order.findById(order_id);
    if (!currentOrder) throw new Error('Order not found');
    if (currentOrder.status !== 2)
        throw new Error('Order is not in finished');
    if (user_type === 'admin') {
        return Order.findByIdAndUpdate(order_id, { status: 4 });
    }
    if (user_type === 'client') {
        if (currentOrder.client_id.toString() === user_id.toString()) {
            const session = await startSession();
            session.startTransaction();
            try {
                const complainToCreate = new orderComplain(
                    {
                        order_id,
                        client_id: user_id,
                        complain: complain,
                        status: 0,
                    },
                    { session },
                );
                //   if (images) {
                //     const imageStringArray: string[] = [];
                //     images.forEach(async (singleImage) => {
                //       try {
                //         const form = new FormData();
                //         form.append('objectType', 'order');
                //         form.append('objectId', complainToCreate._id.toString());
                //         form.append('file', createReadStream(singleImage.path));
                //         const mediaResponse = await axios.post<string>(
                //           `${process.env.MEDIA_ROOT_URL}/file`,
                //           form,
                //           {
                //             headers: { ...form.getHeaders() },
                //           },
                //         );
                //         imageStringArray.push((await mediaResponse).data);
                //       } catch (e) {
                //         throw new BadRequestError(e.message);
                //       } finally {
                //         unlink(singleImage.path, () => null);
                //       }
                //     });
                //     if (imageStringArray.length)
                //       complainToCreate.images = imageStringArray;
                //   }
                await complainToCreate.save();
                const newOrder = await Order.findByIdAndUpdate(
                    order_id,
                    { status: 4 },
                    { session },
                );
                await session.commitTransaction();
                session.endSession();
                res.send({ message: "Send complaint successfully." })
                return newOrder;
            } catch (err) {
                await session.abortTransaction();
                await session.endSession();
                throw err;
            }
        }
        throw new Error('You do not have permision to complain this order');
    }
    throw new Error('You do not have permision to complain this order');
}

const getSpecificOrder = async (req, res, next) => {
    const order_id = req.params.order_id;
    const specificOrder = await Order.findById(order_id).lean();
    console.log(specificOrder)
    if (!specificOrder) throw new Error('Can not find the order or it is not exist')
    res.send(specificOrder)
    return;
}

const confirmOrder = async (req, res, next) => {
    const order_id = req.params.order_id;
    const currentOrder = await Order.findById(order_id).lean();
    const user_type = req.user_type;
    const user_id = req.user_id;
    if (!currentOrder) throw new Error('Order not found');
    if (currentOrder.status !== 0)
        throw new Error('Order is not in pending');
    if (user_type === 'admin') {
        return Order.findOneAndUpdate(
            order_id,
            { status: 1 } //accepted
        );
    }
    if (user_type === 'client') {
        if (currentOrder.provider_id.toString() === user_id.toString()) {
            Order.findOneAndUpdate(
                order_id,
                { status: 1 }//accepted
            );
            res.send({ message: "Confirm successfully!" })
            return;
        }
        throw new Error('You do not have permision to confirm this order');
    }
    throw new Error('You do not have permision to confirm this order');
}

const requestService = async (req, res, next) => {
    const user_id = req.user_id;
    const service_id = req.params.service_id;
    const note = req.body.note;
    const price = req.body.price;
    const service = await productService.findOne({ _id: service_id, type: "service" });
    const existOrder = await Order.findOne({ product_id: new ObjectId(service_id), status: { $lt: 3 } })
    if (existOrder) {
        res.status(400).send({ message: "you have requested this service!" })
        return;
    }
    if (
        !service ||
        service.status === 2 || //inactive
        service.status === 3 //expired
    )
        throw new Error('Service not found');
    if (service.user_id.toString() === user_id)
        throw new Error('You cannot request your own service');
    let currentPrice;
    if (service.lower_bound_fee === service.upper_bound_fee)
        currentPrice = service.lower_bound_fee;
    else currentPrice = price || service.lower_bound_fee;
    const checkWallet = await Wallet.findOne({
        user_id: user_id
    });
    if (!checkWallet || checkWallet.status === WalletStatus.NEW) { //New
        throw new Error('CLient Wallet not found');
    }
    if (checkWallet.status === WalletStatus.LOCKED) { //locked
        throw new Error('CLient Wallet is blocked');
    }
    if (checkWallet.available_balance < price) {
        throw new Error('insufficient available balance');
    }

    const session = await startSession();
    session.startTransaction();
    try {
        const newOrder = await Order.create(
            [
                {
                    product_id: service_id,
                    client_id: user_id,
                    provider_id: service.user_id.toString(),
                    type: "service",
                    price,
                    note: note,
                    estimated_time: service.finish_estimated_time,
                },
            ],
            { session },
        );
        if (!newOrder || !newOrder[0]) throw new Error('Error creating order');
        await productService.findByIdAndUpdate(
            service_id,
            { status: 1 }, //active
            { session },
        );
        await session.commitTransaction();
        session.endSession();
        const returnObject = (await Order.findById(
            newOrder[0]._id.toString(),
        ).lean());
        res.send(returnObject)
    } catch (err) {
        console.log(err)
        await session.abortTransaction();
        await session.endSession();
        throw err;
    }
}

const finishMentor = async (req, res, next) => {
    const user_type = req.user_type;
    const user_id = req.user_id;
    const order_id = req.params.order_id;
    const currentOrder = await Order.findById(order_id);
    if (!currentOrder) throw new Error('Order not found');
    if (currentOrder.status !== 1)   //accepted
        throw new Error('Order is not in confirmed');
    if (user_type === 'admin') {
        await agenda.schedule('in 72 hours', 'auto complete order', order_id);
        Order.findByIdAndUpdate(
            order_id,
            2,   //finished
        );
        res.send("Finished the order, wait for the client.")
        return;
    }
    console.log(user_id)
    if (user_type === 'client') {
        if (currentOrder.provider_id.toString() === user_id.toString()) {
            await agenda.schedule('in 72 hours', 'auto complete order', order_id);
            await Order.findByIdAndUpdate(
                order_id,
                { status: 2 },
            );
            res.send("Finished the order, wait for the client.")
            return;
        }
        throw new Error('You do not have permision to finish this order');
    }
    throw new Error('You do not have permision to finish this order');
}

const getAllOrderAdmin = async (req, res, next) => {
    const user_type = req.user_type;
    const page = req.query.page;
    const limit = req.query.limit;
    const status = req.query.status
    if (user_type === 'admin') {
        let data;
        let total = 0;
        if (status) {
            data =
                await Order.find({})
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .populate({ path: 'product_id', select: 'name description' })
                    .populate({ path: 'provider_id', select: 'fullname avatar' })
                    .populate({ path: 'client_id', select: 'fullname avatar' })
                    .lean().catch((err) => {
                        console.log(err)
                    });
            total = await Order.countDocuments({
                status: { $in: status.split(',').map((x) => +x) }, //if have status
            });
        } else {
            data =
                await Order.find({})
                    .skip((page - 1) * limit)
                    .limit(limit)
                    .populate({ path: 'product_id', select: 'name description' })
                    .populate({ path: 'provider_id', select: 'fullname avatar' })
                    .populate({ path: 'client_id', select: 'fullname avatar' })
                    .lean();
            total = await Order.countDocuments();
        }

        res.send({
            paginationInfo: {
                page,
                limit,
                total,
            },
            data,
        });
        return;
    }
    throw new Error(
        'You did not specify role or do not have permision to get all orders',
    );
}
const orders = {
    getAllOrder,
    acceptOffer,
    cancelOrder,
    completeOrder,
    complainOrder,
    getSpecificOrder,
    confirmOrder,
    requestService,
    finishMentor,
    getAllOrderAdmin,
}
export default orders;  