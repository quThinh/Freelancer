import Agenda from 'agenda';
import pkg from 'mongoose';
import  Order  from './models/order.js';
import  Product  from './models/productService.js'
import  Wallet  from './models/wallet.js';
import Transaction from './models/transaction.js';

const {startSession} = pkg;
const agenda = new Agenda({
    db: {
        address: "mongodb+srv://quangthinhhigh:vladimir1@cluster0.ygznx4h.mongodb.net/Freelancer?retryWrites=true&w=majority",
        collection: "agendaJobs"
    }
});
agenda.define('auto complete order', async (job, done) => {
    const order_id = job.attrs.data;
    console.log(`auto complete order ${order_id}`);
    const currentOrder = await Order.findOne({ _id: order_id });
    if (!currentOrder) throw new Error('Order not found');
    if (currentOrder.status !== 2) throw new Error('Order is not in finished');
    const session = await startSession();
    session.startTransaction();
    try {
        const amount = currentOrder.price;
        const fee = Math.round(amount * parseFloat(process.env.FEE_AMOUNT));
        const fromWallet = await WalletModel.findOneAndUpdate(
            { user_id: currentOrder.client_id.toString() },
            { $inc: { available_balance: -amount } },
            { new: true, session },
        );
        if (!fromWallet) throw new Error('CLient Wallet not found');
        const newTransaction = await Transaction.create(
            [
                {
                    wallet_id: fromWallet._id,
                    ammount: amount,
                    direction: TransactionDirection.OUT,
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
    } catch (err) {
        await session.abortTransaction();
        await session.endSession();
        throw err;
    }
    done();
});

agenda.define('set product to expired', async (job, done) => {
    const { product_id } = job.attrs.data;
    console.log(`set product ${product_id} to expired`);
    const currentProduct = await Product.findOne({
        _id: product_id,
        status: { $not: { $eq: 4 } }, //deleted
    });
    if (!currentProduct)
        throw new Error('Product not found or already been deleted');
    await Product.findOneAndUpdate(
        {
            _id: currentProduct._id,
            status: { $not: { $eq: 4 } },
        },
        {
            status: 3, //expired
        },
        { new: true },
    );
    done();
});

export default agenda;
