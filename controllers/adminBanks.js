import mongoose from 'mongoose';
import adminBank from '../models/adminBank.js';

const myAdminBankList = async (req, res, next) => {
    const user_id = req.user_id;
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query.select;
    const selectQuery = {};
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
    }
    try {
        const data = await adminBank.find(select)
            .select(selectQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .lean();
        const total = await adminBank.countDocuments({ user_id });
        res.send({
            paginationInfo: {
                page,
                limit,
                // total,
            },
            data: data,
        });
        return;
    } catch (e) {
        if (e instanceof ForbiddenError) throw new ForbiddenError(e.message);
        throw new BadRequestError(e.message);
    }
}

const createAdminBank = async (req, res, next) => {
    const user_id = req.user_id;
    const bank_name = req.body.bank_name;
    const bank_branch = req.body.bank_branch;
    const account_number = req.body.account_number;
    const account_name = req.body.account_name;
    const user_type = req.user_type;
    if (user_type === 'admin') {
        const currentAdminBank = await adminBank.create({
            admin_id: user_id,
            bank_name,
            bank_branch,
            account_number,
            account_name,
        })
        res.send(currentAdminBank)
        return;
    }
    throw new Error('You do not have permission to create an admin bank')
}

const deleteById = async(req, res, next) => {
    const user_id = req.user_id;
    const id = req.params.id;
    const deleteAdminBank = await adminBank.findById(id);
    if (!deleteAdminBank) throw new BadRequestError('admin bank not found');
    if (deleteAdminBank.admin_id.toString() !== user_id.toString())
      throw new Error('you are not allowed to delete this bank');
    await deleteAdminBank.remove();
    res.send({message: 'admin bank deleted'})
    return;
}

const allAdminBankList = async(req, res, next) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query?.select;
    const selectQuery = {};
    if (select) {
      const fieldsArray = select.split(',');
      fieldsArray.forEach((value) => {
        selectQuery[value] = 1;
      });
    }
    const data = await adminBank.find({})
    .select(selectQuery)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();
    const total = await adminBank.countDocuments({});
    res.send({
        paginationInfo: {
          page,
          limit,
          total,
        },
        data,
      })
    return;
  }
const adminBanks = {
    myAdminBankList,
    createAdminBank,
    deleteById,
    allAdminBankList,
}
export default adminBanks;