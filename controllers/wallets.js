import Wallet from '../models/wallet.js';
import pkg from 'mongoose';
import Transaction from '../models/transaction.js';
const { startSession } = pkg;

const myWallet = async (req, res, next) => {
    const user_type = req.user_type;
    const user_id = req.user_id;
    if (user_type === "client") {
        const myWallet = await Wallet.findOne({ user_id }).lean().populate('user_id', 'fullname');
        res.send({ myWallet: myWallet, message: "get my wallet successfully." })
        return;
    }
    throw new Error('you are admin, you can not view your wallet')
}

const getSpecificUserWallet = async (req, res, next) => {
    const user_type = req.user_type;
    const user_id = req.user_id;
    if (user_type === 'admin') {
        const userWallet = await Wallet.findOne({ user_id }).lean().populate('user_id', 'fullname');
        res.send({ userWallet: userWallet, message: "get user's wallet successfully." })
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
            total = await WalletModel.countDocuments({
                status: { $in: status.split(',').map((x) => +x) },
            });
        } else {
            data = await Wallet.find({})
                .select(selectQuery)
                .skip((page - 1) * limit)
                .limit(limit)
                .lean()
                .populate('user_id', 'fullname');
            total = await WalletModel.countDocuments();
        }

        return {
            paginationInfo: {
                page,
                limit,
                total,
            },
            data,
        };
    }
    throw new Error('you do not have permission to view other wallets');
}

const depositMoney = async(req, res, next) => {
    const user_id = req.user_id;
    const amount = req.body.amount;
    const bank = req.body.bank;
    const content = req.body.content;
    const sender_name = req.body.sender_name;
    const sender_account = req.body.sender_account;
    sender_bank= req.body.sender_bank;
    // sender_bank_branch = req.body.sender_bank_branch;
    const wallet = await Wallet.findOne({user_id}).lean().populate('user_id', 'fullname')
      if (!wallet) {
        return {
          success: false,
          message: 'wallet not found',
        };
      }
      if (wallet.status === 0)
        return {
          success: false,
          message: 'wallet is not actived',
        };
      if (wallet.status === 2)
        return {
          success: false,
          message: 'wallet is blocked',
        };
      const existingTransaction = await Transaction.findOne({
        wallet_id: wallet._id,
        type: 'EXTERNAL',
        direction: 0,  //in
        status: 0,     //pending
      });
      if (existingTransaction) {
        return {
          success: false,
          message: 'you have a pending deposit transaction',
        };
      }
      const adminBank = await AdminBank.findById(depositDto.bank);
      if (!adminBank) {
        return {
          success: false,
          message: 'bank not found',
        };
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
        const content = `Nap tien vao vi tien ${newWallet._id}. So Bi: ${
          amount
        }. Nap vao tai khoan ${depositDto.bank}. Noi dung: ${
          depositDto.content
        }. Tu tai khoan: ${
          depositDto.sender_account
        }, ngan hang: ${depositDto.sender_bank}${
          depositDto.sender_bank_branch ? ', chi nhanh: ' : ''
        }${depositDto.sender_bank_branch}, nguoi gui: ${depositDto.sender_name}`;
        const newTransaction = await ExternalTransModel.create(
          [
            {
              wallet_id: newWallet._id,
              direction: TransactionDirection.IN,
              ammount: depositDto.amount,
              fee: 0,
              content,
              refference_code: depositDto.bank,
            },
          ],
          { session },
        );
        if (!newTransaction) {
          throw new Error('transaction not created');
        }
        await session.commitTransaction();
        session.endSession();
        return {
          success: true,
          message: 'deposit success',
          wallet: newWallet,
        };
      } catch (error) {
        await session.abortTransaction();
        session.endSession();
        throw error;
      }
}

const wallets = {
    myWallet,
    getSpecificUserWallet,
    getUsersWallet,
    depositMoney,
    // withdrawMoney,
    // lockWallet,
    // unlockWallet,
}
export default wallets;  