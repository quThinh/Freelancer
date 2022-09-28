import Wallet from '../models/wallet.js';
import pkg from 'mongoose';
import Transaction from '../models/transaction.js';
import adminBank from '../models/adminBank.js';
import formatDate from '../util/formatDate.js'
const { startSession } = pkg;

const myWallet = async (req, res, next) => {
  const user_type = req.user_type;
  const user_id = req.user_id;
  if (user_type === "client") {
    const myWallet = await Wallet.findOne({ user_id }).lean().populate('user_id', 'fullname');
    res.send(myWallet)
    return;
  }
  throw new Error('you are admin, you can not view your wallet')
}

const getSpecificUserWallet = async (req, res, next) => {
  const user_type = req.user_type;
  const user_id = req.user_id;
  if (user_type === 'admin') {
    const userWallet = await Wallet.findOne({ user_id }).lean().populate('user_id', 'fullname');
    res.send(userWallet)
    return;
  }
  throw new Error('you do not have permission to view this wallet');
}

const getUsersWallet = async (req, res, next) => {
  const user_type = req.user_type;
  const page = req.query.page;
  const limit = req.query.limit;
  const select = req.query.select;
  const status = req.query.status;
  if (user_type === 'admin') {
    const selectQuery = {};
    if (select) {
      const fieldsArray = select.split(',');
      fieldsArray.forEach((value) => {
        selectQuery[value] = 1;
      });
    }
    let data;
    let total;
    if (status) {
      data = await Wallet.find({ status: { $in: status.split(',').map((x) => +x) } })
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .populate('user_id', 'fullname');
      total = await Wallet.countDocuments({
        status: { $in: status.split(',').map((x) => +x) },
      });
    } else {
      data = await Wallet.find({})
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean()
        .populate('user_id', 'fullname');
      total = await Wallet.countDocuments();
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
  throw new Error('you do not have permission to view other wallets');
}

const depositMoney = async (req, res, next) => {
  const user_id = req.user_id;
  const amount = req.body.amount;
  const bank = req.body.bank;
  const content = req.body.content;
  const sender_name = req.body.sender_name;
  const sender_account = req.body.sender_account;
  const sender_bank = req.body.sender_bank;
  const sender_bank_branch = req.body.sender_bank_branch;
  const currentWallet = await Wallet.findOne({ user_id }).lean().populate('user_id', 'fullname');
  if (!currentWallet) {
    res.status(404).send({
      success: false,
      message: 'wallet not found',
    });
    return;
  }
  if (currentWallet.status === 0) {
    res.status(400).send({
      success: false,
      message: 'wallet is not actived',
    });
    return;
  }

  if (currentWallet.status === 2) {
    res.status(400).send({
      success: false,
      message: 'wallet is blocked',
    });
    return;
  }

  const existingTransaction = await Transaction.findOne({
    wallet_id: currentWallet._id,
    type: 'EXTERNAL',
    direction: 0,  //in
    status: 0,     //pending
  });
  if (existingTransaction) {
    res.status(400).send({
      success: false,
      message: 'you have a pending deposit transaction',
    });
    return;
  }

  const currentAdminBank = await adminBank.findById(bank);
  if (!currentAdminBank) {
    res.status(404).send({
      success: false,
      message: 'bank not found',
    });
    return;
  }
  const session = await startSession();
  session.startTransaction();
  try {
    const newWallet = await Wallet.findOne({
      user_id: user_id,
    });
    if (!newWallet) {
      throw new Error('wallet not found');
    }
    const currentContent = `Nap tien vao vi tien ${newWallet._id}. So Bi: ${amount
      }. Nap vao tai khoan ${bank}. Noi dung: ${content
      }. Tu tai khoan: ${sender_account
      }, ngan hang: ${sender_bank}${sender_bank_branch ? ', chi nhanh: ' : ''
      }${sender_bank_branch}, nguoi gui: ${sender_name}`;
    const newTransaction = await Transaction.create(
      [
        {
          wallet_id: newWallet._id,
          content: currentContent,
          type:"EXTERNAL",
          direction: 0,   //direction IN
          amount: amount,
          fee: 0,
          currentContent,
          refference_code: bank,
        },
      ],
      { session },
    );
    if (!newTransaction) {
      throw new Error('transaction not created');
    }
    await session.commitTransaction();
    session.endSession();
    res.send({
      success: true,
      message: 'deposit successfully, please wait for the incoming money.',
      wallet: newWallet,
    });
    return;
  } catch (error) {
    console.log(error)
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}



const withdrawMoney = async (req, res, next) => {
  const user_id = req.user_id;
  const amount = req.body.amount;
  const bank = req.body.bank;
  const ownerName = req.body.ownerName;
  const accountNumber = req.body.accountNumber;
  const wallet = await Wallet.findOne({ user_id }).lean().populate('user_id', 'fullname')
  if (!wallet) {
    res.status(400).send('wallet not found');
    return;
  }
  if (wallet.status === 0) {
    res.status(400).send('wallet is not actived');
    return;
  }
  if (wallet.status === 2) {
    res.status(400).send('wallet is blocked');
    return;
  }
  if (wallet.available_balance < amount) {
    res.status(400).send('insufficient available balance');
    return;
  }
  const existingTransaction = await Transaction.findOne({
    wallet_id: wallet._id,
    type: "EXTERNAL",
    direction: 1,
    status: 0,   //pending
  });
  if (existingTransaction) {
    res.status(400).send('you have a pending withdraw transaction');
    return;
  }
  const session = await startSession();
  session.startTransaction();
  try {
    const newWallet = await Wallet.findOneAndUpdate(
      { user_id },
      { $inc: { available_balance: -amount } },
      { new: true, session },
    );
    if (!newWallet) {
      throw new Error('wallet not found');
    }
    const content = `Rut tien tu vi tien ${newWallet._id}. So Bi: ${amount}. Ngan hang: ${bank}. So tai khoan: ${accountNumber}. Ten chu tai khoan: ${ownerName}.`;
    const newTransaction = await Transaction.create(
      [
        {
          wallet_id: newWallet._id,
          direction: 1,   //out
          type: "EXTERNAL",
          amount: amount,
          fee: 0,
          content,
          refference_code: `${wallet._id}_${formatDate(new Date())}`,
        },
      ],
      { session },
    );
    if (!newTransaction) {
      throw new Error('transaction not created');
    }
    await session.commitTransaction();
    session.endSession();
    res.send(newWallet)
    return;
  } catch (error) {
    await session.abortTransaction();
    session.endSession();
    throw error;
  }
}

async function changeWalletStatus(
  user_id,
  newStatus,
) {
  try {
    const wallet = await Wallet.findOneAndUpdate(
      { user_id },
      { $set: { status: newStatus } },
      { new: true },
    );
    return [wallet, ''];
  } catch (err) {
    return [null, err.message];
  }
}

const lockWallet = async (req, res, next) => {
  const lock_user_id = req.params.user_id;
  const admin_id = req.user_id;
  const user_type = req.user_type;
  if (user_type !== 'admin') {
    throw new Error('you do not have permission to lock wallet');
  }
  const wallet = await Wallet.findOne({ lock_user_id }).lean().populate('user_id', 'fullname');
  if (!wallet) {
    throw new Error('wallet not found');
  }
  if(Number(wallet.status) === 2){
    throw new Error('wallet has already been blocked')
  }
  await Wallet.findOneAndUpdate(
    { lock_user_id },
    { $set: { status: 2 } },
    { new: true },)
    .then((newWallet) => {
      res.send(newWallet);
    })
    .catch((err) => {
      throw new Error(err)
    })
  return;
}

const unlockWallet = async (req, res, next) => {
  const unlock_user_id = req.params.user_id;
  const admin_id = req.user_id;
  const user_type = req.user_type;
  if (user_type !== 'admin') {
    throw new Error('you do not have permission to unlock wallet');
  }
  const wallet = await Wallet.findOne({ unlock_user_id }).lean().populate('user_id', 'fullname');
  if (!wallet) {
    throw new Error('wallet not found');
  }
  if(Number(wallet.status) === 1){
    throw new Error('wallet has already been unlocked.')
  }
  await Wallet.findOneAndUpdate(
    { unlock_user_id },
    { $set: { status: 1 } },
    { new: true },)
    .then((newWallet) => {
      res.send(newWallet);
    })
    .catch((err) => {
      throw new Error(err)
    })
  return;
}

const wallets = {
  myWallet,
  getSpecificUserWallet,
  getUsersWallet,
  depositMoney,
  withdrawMoney,
  lockWallet,
  unlockWallet,
}
export default wallets;  