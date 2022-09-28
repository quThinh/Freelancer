import { ObjectId } from 'mongodb';
import Product from '../models/productService.js';
import agenda from '../agenda.js';
import User from '../models/user.js';
import { toSlugConverter } from '../util/toSlugConverter.js';
import Category from '../models/category.js';
import { BadRequestError } from 'routing-controllers';


const createNew = async (req, res, next) => {
    const user_id = req.user_id
    const name = req.body.name;
    const category = req.body.category.map((item) => ObjectId(item));
    const skill = req.body.skill;
    const description = req.body.description;
    const providing_method = req.body.providing_method;
    const finish_estimated_time = req.body.finish_estimated_time;
    const lower_bound_fee = req.body.lower_bound_fee;
    const type = "job";
    const upper_bound_fee = req.body.upper_bound_fee;
    const image = req.body.image;
    const expiration_time = req.body.expiration_time;
    const required_level = req.body.required_level;
    const payment_method = req.body.payment_method;
    const currentUser = await User.findOne({ _id: user_id, type: "client" });
    if (!currentUser) throw new Error("Can't find client");
    if (skill && skill.some((skill) => !skill.slug)) {
        skill = skill.map((obj) => ({
            ...obj,
            slug: toSlugConverter(obj.name),
        })); // TODO : log new skills added by user to admins
    }
    // create slug for job product
    let jobSlug = toSlugConverter(name);
    const numberOfSlugDuplicatedJob =
        await ProductModel.countDocuments({
            slug: { $regex: `^${jobSlug}\\+[0-9]{1,}$|^${jobSlug}$` },
        });
    jobSlug =
        numberOfSlugDuplicatedJob === 0
            ? jobSlug
            : jobSlug.concat('+', (numberOfSlugDuplicatedJob + 1).toString());
    let createJobDto = {
        name,
        category,
        skill,
        description,
        providing_method,
        finish_estimated_time,
        lower_bound_fee,
        upper_bound_fee,
        image,
        type: "job",
        expiration_time,
        required_level,
        payment_method,
        slug: jobSlug,
        status: 1
    }
    const createdJob = await Product.create({
        user_id: client_id,
        ...createJobDto,
    });
    await agenda.schedule(
        createJobDto.expiration_time,
        'set product to expired',
        { product_id: createdJob._id },
    );
}

const getJobList = async (
    page,
    limit,
    currentUser,
    user_id,
    categorySlug,
    providing_method,
    fee_range,
    name,
    required_level,
    sort_by,
    select,
) => {
    const query = { status: 1, type: "job" };
    let selectQuery;
    const populateQuery = [
        {
            path: 'user_id',
            select: 'fullname email',
        },
        { path: 'category', select: '-description' },
    ];
    if (user_id) Object.assign(query, { user_id: { $in: user_id.split(',') } });
    if (categorySlug) {
        const slugs = categorySlug.split(',');
        const categories = await Category.find({
            status: 1, //active
            slug: { $in: slugs },
        }).lean();
        const categoriesIDArray = categories.map((category) => category._id);
        Object.assign(query, { category: { $in: categoriesIDArray } });
    }
    if (providing_method)
        Object.assign(query, {
            providing_method: { $in: providing_method.split(',') },
        });
    if (currentUser && currentUser.type === 'admin') {
        Object.assign(query, {
            status: { $not: { $eq: 4 } },
        });
    }
    if (fee_range) {
        const [minFee, maxFee] = fee_range.split('-').map(Number);
        Object.assign(query, {
            lower_bound_fee: { $lte: maxFee },
            upper_bound_fee: { $gte: minFee },
        });
    }
    if (name)
        Object.assign(query, { name: { $regex: `.*${name}.*`, $options: 'i' } });
    if (required_level)
        Object.assign(query, {
            required_level: { $in: required_level.split(',') },
        });
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
        if (!selectQuery.category) populateQuery.pop();
        if (!selectQuery.user_id) populateQuery.shift();
    }
    const total = await Product.countDocuments(query);
    const data = await Product.find(query)
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populateQuery)
        .sort(sort_by)
        .lean();
    return {
        paginationInfo: {
            page,
            limit,
            total,
        },
        data,
    };
}

const getAll = async (req, res, next) => {
    const page = req.query.page;
    const limit = req.query.limit;
    const user_id = req.query.user_id;
    const currentUser_id = req.user_id;
    const category = req.query.category;
    const providing_method = req.query.providing_method;
    const fee_range = req.query.fee_range;
    const name = req.query.name;
    const required_level = req.query.required_level;
    const sort_by = req.query.sort_by;
    const select = req.query.select;
    const currentUser = await User.findById(currentUser_id);
    if (!currentUser) {
        throw new Error("User not exist.")
    }
    try {
        if (!page || !limit) {
            res.send(null);
            return;
        }
        res.send(await getJobList(
            page,
            limit,
            currentUser,
            user_id,
            category,
            providing_method,
            fee_range,
            name,
            required_level,
            sort_by,
            select,
        ));
        return;
    } catch (e) {
        throw new Error(e.message);
    }
}

const getJobListWithPopulate = async (
    page,
    limit,
    query,
    selectQuery,
    populateOptions,
    sortQuery) => {
    return await Product.find(query)
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populateOptions)
        .sort(sortQuery)
        .lean();
}

const getAllCurrentUser = async (req, res, next) => {
    const user_id = req.user_id;
    const user_type = req.user_type;
    const page = req.query.page;
    const limit = req.query.limit;
    const status = req.query.status;
    const sort_by = req.query.sort_by;
    const currentUser = await User.findById(user_id);
    if (!currentUser) throw new Error("User not exist");
    if (user_type !== "client") throw new Error("You are not client");
    if (!page || !limit) {
        res.send(null);
        return;
    }
    const query = {
        user_id: user_id,
        type: "job",
        status: { $not: { $eq: 4 } },  //deleted
    };
    if (status) {
        Object.assign(query, {
            $and: [
                { status: { $in: status.split(',').map((x) => +x) } },
                { status: { $not: { $eq: 4 } } },
            ],
        });
    }
    const selectQuery = {
        image: 1,
        name: 1,
        upper_bound_fee: 1,
        lower_bound_fee: 1,
        sold_time: 1,
        rate: 1,
        number_of_rate: 1,
        create_time: 1,
        status: 1,
    };
    let populateQuery;
    const total = await Product.countDocuments(query);
    const data = await getJobListWithPopulate(
        page,
        limit,
        query,
        selectQuery,
        populateQuery,
        sort_by,
    );
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

const getUserJobById = async (req, res, next) => {
    const job_id = req.params.job_id;
    const user_id = req.user_id;
    const query = {
        _id: job_id,
        type: "job",
        user_id: user_id,
        status: { $not: { $eq: 4 } },  //deleted
    };
    const selectQuery = {};
    const populateQuery = [
        { path: 'category', select: '-description' },
    ];
    res.send(await Product.findOne(query)
        .select(selectQuery)
        .populate(populateQuery)
        .lean());
    return;
}

const getOtherJobById = async (req, res, next) => {
    const job_id = req.params.job_id;
    const user_id = req.user_id;
    const currentUser = await User.findById(user_id);
    if (!currentUser) throw new Error("User not exist.")
    const query = {
        _id: job_id,
        type: "job",
        status: 1,
    };
    const selectQuery = {};
    if (currentUser && currentUser.type === 'admin') {
        Object.assign(query, {
            status: { $not: { $eq: 4 } }, // deleted
        });
    }
    const populateQuery = [
        {
            path: 'user_id',
            select: 'fullname email',
        },
        { path: 'category', select: '-description' },
    ];
    res.send(JobProductModel.findOne(query)
        .select(selectQuery)
        .populate(populateQuery)
        .lean())
    return;

}

const deleteById = async (req, res, next) => {
    const job_id = req.params.job_id;
    const user_id = req.user_id;
    const user_type = req.user_type;
    const query = {
        _id: job_id,
        type: "job",
        status: { $not: { $eq: 4 } },
    };
    if (user_type === 'client') Object.assign(query, { user_id });
    const updateOptions = { status: 4 };
    if (
        !(await JobProductModel.findOneAndUpdate(query, updateOptions, {
            new: true,
        }))
    )
        throw new BadRequestError('Can not delete this job : Not found !');
    else res.send({ message: 'Deleted Sucessfully' })
}

const browsingjob = async (req, res, next) => {
    const job_id = req.params.job_id;
    const query = { _id: job_id, type: "job", status: 0 };  //new
    const updateOptions = { status: 1 };
    if (
        !(await JobProductModel.findOneAndUpdate(query, updateOptions, {
            new: true,
        }))
    )
        throw new BadRequestError(
            'Can not approve this job : not found or non-new job !',
        );
    else res.send({
        message: 'Approved Sucessfully',
    })
    return;
}

const toggleById = async (req, res, next) => {
    const job_id = req.params.job_id;
    const user_id = req.user_id;
    const query = {
        _id: job_id,
        type: "job",
        user_id: client_id,
        status: { $in: [1, 2] },
    };
    let newStatus;
    const toUpdateJobProduct = await Product.findOne(query);
    if (!toUpdateJobProduct)
        throw new BadRequestError('Can not toggle display status for this job');
    if (toUpdateJobProduct.status === 1)
        newStatus = 2;
    else if (toUpdateJobProduct.status === 2)
        newStatus = 1;
    toUpdateJobProduct.status = newStatus;
    await toUpdateJobProduct.save()
        .then(() => {
            res.send({
                message: 'Change Sucessfully',
            });
            return;
        })
        .catch((err) => {
            throw new Error(err)
        })
}

const changeById = async (req, res, next) => {
    const job_id = req.params.job_id;
    const user_id = req.user_id
    const name = req.body.name;
    const category = req.body.category.map((item) => ObjectId(item));
    const skill = req.body.skill;
    const description = req.body.description;
    const providing_method = req.body.providing_method;
    const finish_estimated_time = req.body.finish_estimated_time;
    const lower_bound_fee = req.body.lower_bound_fee;
    const upper_bound_fee = req.body.finish_estimated_time;
    const image = req.body.finish_estimated_time;
    const payment_method = req.body.payment_method;
    const required_level = req.body.required_level;
    const expiration_time = req.body.finish_estimated_time;
    const query = {
        _id: job_id,
        type: "job",
        user_id: user_id,
        status: { $not: { $eq: 4 } },
    };
    if (skill && skill.some((skill) => !skill.slug)) {
        skill = skill.map((obj) => ({
            ...obj,
            slug: toSlugConverter(obj.name),
        })); // TODO : log new skills added by user to admins
    }
    let jobSlug = toSlugConverter(changeJobDto.name);
    const numberOfSlugDuplicatedJob =
        await Product.countDocuments({
            slug: { $regex: `^${jobSlug}\\+[0-9]{1,}$|^${jobSlug}$` },
        });
    jobSlug =
        numberOfSlugDuplicatedJob === 0
            ? jobSlug
            : jobSlug.concat('+', (numberOfSlugDuplicatedJob + 1).toString());
    //   Object.assign(changeJobDto, {
    //     slug: jobSlug,
    //   });
    const changeJobDto = {
        name,
        category,
        skill,
        description,
        providing_method,
        finish_estimated_time,
        lower_bound_fee,
        upper_bound_fee,
        //  image,
        payment_method,
        required_level,
        expiration_time,
        slug: jobSlug
    }
    const updatedJob = await Product.findOneAndUpdate(
        query, changeJobDto, {
        new: true,
    }
    );
    if (!updatedJob)
        throw new BadRequestError(
            'Cannot update ! Not found or you are not the owner of job',
        );
    else {
        res.send({
            message: 'Change Sucessfully',
        });
        return;
    }
}

const jobs = {
    createNew,
    getAll,
    getAllCurrentUser,
    getUserJobById,
    getOtherJobById,
    changeById,
    deleteById,
    toggleById,
    browsingjob
}
export default jobs;  