import { ObjectId } from 'mongodb';
import Product from '../models/productService.js';
import { toSlugConverter } from '../util/toSlugConverter.js'
import Agenda from 'agenda';
import Category from '../models/category.js'
import { BadRequestError } from 'routing-controllers';


// const checkId = (_id) => {
//     Product.findOne({ _id: new ObjectId(_id), type: "service" })
//         .then(() => {
//             return true;
//         })
//         .catch(() => {
//             return false;
//         })
// }

const createNew = async (req, res, next) => {
    const user_id = req.user_id
    const name = req.body.name;
    const category = req.body.category.map((item) => ObjectId(item));
    const skill = req.body.skill;
    const description = req.body.description;
    const providing_method = req.body.providing_method;
    const finish_estimated_time = req.body.finish_estimated_time;
    const lower_bound_fee = req.body.lower_bound_fee;
    const type = "service";
    const upper_bound_fee = req.body.finish_estimated_time;
    const image = req.body.finish_estimated_time;
    const expiration_time = req.body.finish_estimated_time;
    // const status = req.body.status;
    // const sold_time = req.body.sold_time;
    // const create_time = req.body.create_time;
    // const rate = req.body.rate;
    // const number_of_rate = req.body.number_of_rate;
    // const required_level = req.body.required_level;
    // const payment_method = req.body.payment_method;
    if (
        skill &&
        skill.some((skill) => !skill.slug)
    ) {
        skill = skill.map((obj) => ({
            ...obj,
            slug: toSlugConverter(obj.name),
        })); // TODO : log new skills added by user to admins
    }
    // create slug for service product
    let serviceSlug = toSlugConverter(name);
    const numberOfSlugDuplicatedService = Product.countDocuments({
        slug: { $regex: `^${serviceSlug}+[0-9]{1,}$|^${serviceSlug}$` },
    });
    serviceSlug =
        numberOfSlugDuplicatedService === 0
            ? serviceSlug
            : serviceSlug.concat(
                '+',
                (numberOfSlugDuplicatedService + 1).toString(),
            );
    // Object.assign(createServiceDto, {
    //     slug: serviceSlug,
    // });
    // Object.assign(createServiceDto, {
    //     status:
    //         await this.adminConfigService.getInitialCreateProductServiceStatus(),
    // });
    const createdService = Product.create({
        name,
        category,
        skill,
        description,
        providing_method,
        finish_estimated_time,
        lower_bound_fee,
        type,
        upper_bound_fee,
        image,
        expiration_time,
        slug: serviceSlug,
        status: 1,
    });
    await Agenda.schedule(
        expiration_time,
        'set product to expired',
        { product_id: createdService._id },
    );
    res.send("successfully")
}

const getAll = async (req, res, next) => {
    const user_id = req.query.user_id;
    const page = req.query.page;
    const limit = req.query.limit;
    const categorySlug = req.query.category;
    const providing_method = req.query.providing_method;
    const fee_range = req.query.fee_range;
    const name = req.query.name;
    const sort_by = req.query.sort_by;
    const select = req.query.select;
    if (!page || !limit) {
        res.status(400).send(null);
        return;
    }
    const currentUser = await User.findById(user_id);
    if (!currentUser) throw new Error("Can't find user!");
    const query = { status: 1, type: "service" }; //active
    const selectQuery = {};
    const populateQuery = [
        {
            path: 'user_id',
            select: 'fullname email rate_star sold_time rate_number',
        },
        { path: 'category', select: '-description' },
    ];
    if (user_id) Object.assign(query, { user_id: { $in: user_id.split(',') } });
    if (categorySlug) {
        const slug = categorySlug.split(',');
        const categories = await Category.find({
            status: 1,
            slug: { $in: slug },
        }).lean();
        const categoriesIDArray = categories.map((category) => category._id);
        Object.assign(query, { category: { $in: categoriesIDArray } });
    }
    if (name)
        Object.assign(query, { name: { $regex: `.*${name}.*`, $options: 'i' } });
    if (providing_method)
        Object.assign(query, {
            providing_method: { $in: providing_method.split(',') },
        });
    if (currentUser && currentUser.type === 'admin') {
        Object.assign(query, {
            status: { $not: { $eq: 4 } },  //deleted
        });
    }
    if (fee_range) {
        const [minFee, maxFee] = fee_range.split('-').map(Number);
        Object.assign(query, {
            lower_bound_fee: { $lte: maxFee },
            upper_bound_fee: { $gte: minFee },
        });
    }
    if (select) {
        const fieldsArray = select.split(',');
        fieldsArray.forEach((value) => {
            selectQuery[value] = 1;
        });
        if (!selectQuery.category) populateQuery.pop();
        if (!selectQuery.user_id) populateQuery.shift();
    }
    const total =
        await Product.countDocuments(query);
    const data = await Product
        .find(query)
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
const getAllCurrentUser = async (req, res, next) => {
    const user_id = req.user_id;
    const page = req.query.page;
    const limit = req.query.limit;
    const status = req.query.status;
    const sort_by = req.query.sort_by;
    if (!page || !limit) {
        res.status(400);
        return;
    }
    const query = { user_id, status: { $not: { $eq: 4 } }, type: "service" }; //deleted
    if (status) {
        Object.assign(query, {
            $and: [
                { status: { $in: status.split(',').map((x) => +x) } },
                { status: { $not: { $eq: 4 } } },
            ],
        });
    }
    const selectQuery = {
        // image: 1,
        name: 1,
        upper_bound_fee: 1,
        lower_bound_fee: 1,
        sold_time: 1,
        rate: 1,
        number_of_rate: 1,
        create_time: 1,
        status: 1,
    };
    let populateQuery = [];
    const total = await Product.countDocuments(query);
    const data = await Product.find(query)
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate(populateQuery)
        .sort(sort_by)
        .lean();
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

const getUserServiceById = async (req, res, next) => {
    const user_id = req.user_id;
    const service_id = req.params.service_id
    if (!user_id) {
        throw new Error("Unauthorized")
    }
    const query = {
        _id: service_id,
        type: "service",
        user_id,
        status: { $not: { $eq: 4 } },
    };
    const selectQuery = {};
    const populateQuery = [
        { path: 'category', select: '-description' },
    ];
    const service = await Product.findOne(query)
        .select(selectQuery)
        .populate(populateQuery)
        .lean();
    res.send(service);
    return;
}

const getOtherServiceById = async (req, res, next) => {
    const service_id = req.params.service_id
    const currentUser = await User.findById(req.user_id);
    if (!currentUser) throw new Error("User not exist");
    const query = {
        _id: service_id,
        type: "service",
        status: 1,
    };
    const selectQuery = {};
    if (currentUser && currentUser.type === 'admin') {
        Object.assign(query, {
            status: { $not: { $eq: 4 } },  //deleted
        });
    }
    const populateQuery = [
        {
            path: 'user_id',
            select: 'fullname email rate_star sold_time rate_number',
        },
        { path: 'category', select: '-description' },
    ];
    const service = Product.findOne(query)
        .select(selectQuery)
        .populate(populateQuery)
        .lean();
    res.send(service);
    return;
}

const changeById = async (req, res, next) => {
    const service_id = req.params.service_id;
    const user_id = req.user_id
    const currentUser = await User.findById(req.user_id);
    if (!currentUser) throw new Error("User not exist");
    const name = req.body.name;
    const category = req.body.category.map((item) => ObjectId(item));
    const skill = req.body.skill;
    const description = req.body.description;
    const providing_method = req.body.providing_method;
    const finish_estimated_time = req.body.finish_estimated_time;
    const lower_bound_fee = req.body.lower_bound_fee;
    const upper_bound_fee = req.body.finish_estimated_time;
    // const image = req.body.finish_estimated_time;
    const expiration_time = req.body.finish_estimated_time;
    // const status = req.body.status;
    // const create_time = req.body.create_time;
    const query = {
        _id: service_id,
        type: "service",
        user_id: client_id,
        status: { $not: { $eq: 4 } },  //deleted
    };
    if (
        skill &&
        skill.some((skill) => !skill.slug)
    ) {
        skill = skill.map(
            (obj) => ({
                ...obj,
                slug: toSlugConverter(obj.name),
            }),
        ); // TODO : log new skills added by user to admins
    }
    let serviceSlug = toSlugConverter(changeServiceDetailDto.name);
    const numberOfSlugDuplicatedService =
        await ProductModel.countDocuments({
            slug: { $regex: `^${serviceSlug}+[0-9]{1,}$|^${serviceSlug}$` },
        });
    serviceSlug =
        numberOfSlugDuplicatedService === 0
            ? serviceSlug
            : serviceSlug.concat(
                '+',
                (numberOfSlugDuplicatedService + 1).toString(),
            );
    let changeServiceDetailDto = {
        name,
        category,
        skill,
        description,
        providing_method,
        finish_estimated_time,
        lower_bound_fee,
        upper_bound_fee,
        expiration_time,
        slug: serviceSlug,
    }
    const updatedService = await Product.findOneAndUpdate(query, changeServiceDetailDto, {
        new: true,
    });
    if (!updatedService)
        throw new BadRequestError(
            'Cannot update ! Not found or you are not the owner of service',
        );
    res.send(updatedService);
    return;
}

const deleteById = async (req, res, next) => {
    const service_id = req.params.service_id;
    const user_id = req.user_id;
    const user_type = req.user_type;
    const currentUser = await User.findById(req.user_id);
    if (!currentUser) throw new Error("User not exist");
    const query = {
        _id: service_id,
        type: "service",
        status: { $not: { $eq: 4 } },  //deleted
    };
    if (user_type === 'client') Object.assign(query, { user_id });
    const updateOptions = { status: 4 };
    if (
        !(await Product.findOneAndUpdate(query, updateOptions, {
            new: true,
        })
        ))
        throw new BadRequestError('Can not delete this service : Not found !');
}

const browsingService = async (req, res, next) => {
    const service_id = req.params.service_id;
    const user_type = req.user_type;
    const user_id = req.user_id;
    if (user_type !== "admin") throw new Error("You don't have permission to perform this action")
    const query = { _id: service_id, type: "service", status: 0 };  //new
    const updateOptions = { status: 1 }; //active
    if (
        !(await Product.findOneAndUpdate(query, updateOptions, {
            new: true,
        }))
    )
        throw new BadRequestError(
            'Can not approve this service : not found or non-new service !',
        );
}

const toggleById = async (req, res, next) => {
    const service_id = req.params.service_id;
    const user_id = req.user_id;
    const user_type = req.user_type;
    const currentUser = await User.findById(req.user_id);
    if (!currentUser || user_type !== "client") throw new Error("client not exist");
    const query = {
        _id: service_id,
        type: "service",
        user_id: client_id,
        status: { $in: [1, 2] },   //active and inactive
    };
    let newStatus;
    const toUpdateServiceProduct =
        await Product.countDocuments(query);
    if (!toUpdateServiceProduct)
        throw new BadRequestError(
            'Can not toggle display status for this service',
        );
    if (toUpdateServiceProduct.status === 1)
        newStatus = 2;
    else if (toUpdateServiceProduct.status === 2)
        newStatus = 1;
    toUpdateServiceProduct.status = newStatus;
    await toUpdateServiceProduct.save();
    res.send("toggle successfully");
    return;
}


const services = {
    createNew,
    getAll,
    getAllCurrentUser,
    getUserServiceById,
    getOtherServiceById,
    changeById,
    deleteById,
    toggleById,
    browsingService
}
export default services;  