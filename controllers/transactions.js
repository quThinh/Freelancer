import Transaction from '../models/transaction.js';
import wallet from '../models/wallet.js';
import Order from '../models/order.js'
import AdminBank from '../models/adminBank.js'
import pkg from 'mongoose'
const { startSession } = pkg;
const external = async (req, res, next) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query?.select;
    const user_id = req.user_id;
    const selectQuery = {};
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
    }
    const currentWallet = await wallet.findOne({ user_id });
    if (!currentWallet) {
        res.status(404).send({ message: "Can't found!" })
        return;
    }
    const currentTransaction = await Transaction.find({ wallet_id: currentWallet._id, type: "EXTERNAL" })
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    res.send(currentTransaction)
    return;
}
const internal = async (req, res, next) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query?.select;
    const user_id = req.user_id;
    const selectQuery = {};
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
    }
    const currentWallet = await wallet.findOne({ user_id });
    if (!wallet) {
        res.status(404).send({ message: "Can't found!" })
        return;
    }
    console.log(currentWallet._id)
    const currentTransaction = await Transaction.find({ wallet_id: currentWallet._id, type: "INTERNAL" })
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    res.send(currentTransaction);
    return;
}

async function getTransactions(
    page,
    limit,
    query,
    selectQuery,
) {
    if (Object.keys(query).length) {
        const transactions = await Transaction.find(query)
            .select(selectQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean()
            .populate('wallet_id', 'user_id')
            .populate('user_id');
        return transactions;
    }
    return await Transaction.find()
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .populate({
            path: 'wallet_id',
            select: 'user_id',
            populate: {
                path: 'user_id',
                select: 'fullname avatar',
            },
        });
}

const adminGetList = async (req, res, next) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query?.select;
    const user_type = req.user_type;
    if (user_type !== 'admin') {
        throw new Error('You are not authorized to perform this action');
    }
    const selectQuery = {};
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
    }
    const data = await getTransactions(
        page,
        limit,
        {},
        selectQuery,
    );
    const total = await Transaction.countDocuments({});
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

const specificTransaction = async (req, res, next) => {
    const transaction_id = req.params.transaction_id;
    const user_type = req.user_type;
    const user_id = req.user_id;
    if (user_type === 'admin') {
        await Transaction.findOne({ _id: transaction_id }).lean()
        .then((transac) => {
            res.send(transac);
        })
        .catch((err) => {
            throw new Error(err)
        })
        return;
    }
    const currentWallet = await wallet.findOne({ user_id });
    if (!currentWallet) {
        throw new Error("Can't found wallet.")
    }
    const currentTransaction = await Transaction.findOne({ _id: transaction_id }).lean();
    if (!currentTransaction) {
        throw new Error("Can't found transaction.")
    }
    if (currentTransaction.wallet_id.toString() !== currentWallet._id.toString()) {
        throw new Error('You are not authorized to perform this action');
    }
    res.send(currentTransaction);
    return;
}

const orderTransaction = async (req, res, next) => {
    const user_type = req.user_type;
    const user_id = req.user_id;
    const order_id = req.params.order_id;
    if (user_type === 'admin') {
        res.send(await Transaction.find({ order_id: order_id, type: "INTERNAL" }).lean());
        return;
    }
    const currentWallet = await wallet.findOne({ user_id });
    if (!currentWallet) {
        throw new Error("Can't found wallet.")
    }
    const currentTransactions = (await Transaction.find({
        order_id,
        wallet_id: currentWallet.id,
        type: "INTERNAL"
    }).lean());
    res.send(currentTransactions);
    return;
}

const acceptTransaction = async (req, res, next) => {
    const user_type = req.user_type;
    const user_id = req.user_id;
    const transaction_id = req.params.transaction_id;
    if (user_type !== 'admin') {
        throw new Error('You are not authorized to perform this action');
    }
    const session = await startSession();
    session.startTransaction();
    try {
        const currenttransaction = await Transaction.findOne(
            {
                _id: transaction_id,
                type: "INTERNAL"
            }
        ).session(session);
        if (!currenttransaction) {
            console.log(currenttransaction)
            throw new Error('Transaction not found');
        }
        if (currenttransaction.status !== 0) {   //pending
            console.log(currenttransaction)
            throw new Error('Transaction already accepted');
        }
        await Transaction.updateOne(
            { _id: transaction_id, type: "INTERNAL" },
            { status: 1, admin_id: user_id },   //confirmed
            { session },
        );
        const currentWallet = await wallet.findByIdAndUpdate(
            currenttransaction.wallet_id,
            { $inc: { balance: -currenttransaction.amount } },
            { session },
        );
        if (!currentWallet) {
            throw new Error('Wallet not found');
        }
        const order = await Order.findById(currenttransaction.order_id).session(
            session,
        );
        if (!order) {
            throw new Error('Order not found');
        }
        const provider_wallet = await wallet.findOneAndUpdate(
            { user_id: order.provider_id },
            {
                $inc: {
                    balance: currenttransaction.amount - currenttransaction.fee,
                    available_balance: currenttransaction.amount - currenttransaction.fee,
                },
            },
            { session },
        );
        if (!provider_wallet) {
            throw new Error('Provider wallet not found');
        }
        const newTransaction = await Transaction.create(
            [
                {
                    admin_id: user_id,
                    type: "INTERNAL",
                    wallet_id: provider_wallet._id,
                    amount: currenttransaction.amount,
                    direction: 0,
                    fee: currenttransaction.fee,
                    order_id: currenttransaction.order_id,
                    status: 1,  //confirmed
                    content: `Thanh toan don hang ${currenttransaction.order_id} voi so Bi: ${currenttransaction.amount
                        } - Phi giao dich: ${currenttransaction.fee} Bi. Thoi gian: ${new Date()}`,
                },
            ],
            { session },
        );
        if (!newTransaction) throw new Error('Transaction not created');
        await session.commitTransaction();
        session.endSession();
        res.send(newTransaction[0])
        return;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
const acceptWithdraw = async (req, res, next) => {
    const user_id = req.user_id;
    const user_type = req.user_type;
    const transaction_id = req.params.transaction_id;
    if (user_type !== 'admin') {
        throw new Error('You are not authorized to perform this action');
    }
    const session = await startSession();
    session.startTransaction();
    try {
        const transaction = await Transaction.findOne(
            { _id: transaction_id, type: "EXTERNAL" }
        ).session(session);
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.status !== 0) {   //pending
            console.log(transaction)
            throw new Error('Transaction already accepted');
        }
        const newTransaction = await Transaction.findOneAndUpdate(
            { _id: transaction_id, type: "EXTERNAL" },
            { status: 1, admin_id: user_id },  //confirmed
            { session, new: true },
        );
        const currentWallet = await wallet.findByIdAndUpdate(
            transaction.wallet_id,
            { $inc: { balance: -transaction.amount } },
            { session },
        );
        if (!currentWallet) {
            throw new Error('Wallet not found');
        }
        await session.commitTransaction();
        session.endSession();
        res.send(newTransaction);
        return;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
const acceptDeposit = async (req, res, next) => {
    const user_id = req.user_id;
    const user_type = req.user_type;
    const transaction_id = req.params.transaction_id;
    if (user_type !== 'admin') {
        throw new Error('You are not authorized to perform this action');
    }
    const session = await startSession();
    session.startTransaction();
    try {
        const transaction = await Transaction.findOne(
            { _id: transaction_id, type: "EXTERNAL" }
        ).session(session);
        console.log(transaction)
        if (!transaction) {
            throw new Error('Transaction not found');
        }
        if (transaction.status !== 0) {  //pending
            throw new Error('Transaction already accepted');
        }
        const existingBank = await AdminBank.findById(
            transaction.refference_code,
        ).session(session);
        if (!existingBank) {
            throw new Error('Bank not found');
        }
        if (existingBank.admin_id.toString() !== user_id.toString()) {
            throw new Error('You are not authorized to perform this action');
        }
        const newTransaction = await Transaction.findOneAndUpdate(
            { _id: transaction_id, type: "EXTERNAL" },
            { status: 1, admin_id: user_id },
            { session, new: true },
        );
        const currentWallet = await wallet.findByIdAndUpdate(
            transaction.wallet_id,
            {
                $inc: {
                    balance: transaction.amount,
                    available_balance: transaction.amount,
                },
            },
            { session },
        );
        if (!currentWallet) {
            throw new Error('Wallet not found');
        }
        await session.commitTransaction();
        session.endSession();
        res.send(newTransaction);
        return;
    } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
    }
}
const adminDepositHistory = async (req, res, next) => {
    const user_id = req.user_id;
    const user_type = req.user_type;
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query?.select;
    if (user_type !== 'admin') {
        throw new Error('You are not authorized to perform this action');
    }
    const adminBank = await AdminBank.findOne({ admin_id: user_id });
    if (!adminBank) {
        throw new Error('You have no bank account');
    }
    const selectQuery = {};
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
    }
    const data = await Transaction.find({
        type: "EXTERNAL",
        direction: 0,   //in
        refference_code: adminBank.id.toString(),
    })
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();
    const total = await Transaction.countDocuments({
        type: "EXTERNAL",
        direction: 0,  //in
        refference_code: adminBank.id.toString(),
    });
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


const adminBanks = {
    external,
    internal,
    adminGetList,
    specificTransaction,
    orderTransaction,
    acceptTransaction,
    acceptWithdraw,
    acceptDeposit,
    adminDepositHistory
}
export default adminBanks;