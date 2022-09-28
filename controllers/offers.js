import { ObjectId } from 'mongodb';
import Offer from '../models/offer.js';
import user from '../models/user.js';
import Product from '../models/productService.js'
import { ForbiddenError } from 'routing-controllers';


const UserModelUnselectableFields = [
    'hashed_password',
    'del_flag',
    'active_token',
    'api_key',
];

const createNew = async (req, res, next) => {
    const user_id = req.user_id;
    const job_id = req.params.job_id;
    const offer_price = req.body.offer_price;
    const offer_finish_estimated_time = req.body.offer_finish_estimated_time;
    const introduction = req.body.introduction;
    const job = await Product.findById(job_id);
    if (job) {
        const existing_offer = await OfferModel.findOne({ provider_id: user_id, job_id })
            .select({})
            .lean();
        if (existing_offer) throw new Error('You already have an offer');
        const offer = new Offer({
            offer_price,
            offer_finish_estimated_time,
            introduction,
            provider_id: user_id,
            job_id,
        });
        await offer.save()
            .then(() => {
                res.send(offer);
                return;
            })
            .catch((err) => {
                throw new Error(err);
            })
    }
    throw new Error('Job not found');
}


const getOfferListWithProviderPopulate = async (
    page,
    limit,
    query,
    selectQuery,
    sortBy
) => {
    if (sortBy) {
        let sortMethod = 1;
        let sortField = sortBy;

        if (sortBy[0] === '-') {
            sortMethod = -1;
            sortField = sortBy.slice(1);
        }
        return Offer.find(query)
            .select(selectQuery)
            .skip((page - 1) * limit)
            .limit(limit)
            .sort([[sortField, sortMethod]])
            .populate({ path: 'provider_id', select: ['fullname'] })
            .lean();
    }
    return Offer.find(query)
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'provider_id', select: ['fullname'] })
        .lean();
}

const getOfferListWithProductPopulate = async (
    page,
    limit,
    query,
    selectQuery,
) => {
    return Offer.find(query)
        .select(selectQuery)
        .skip((page - 1) * limit)
        .limit(limit)
        .populate({ path: 'provider_id', select: ['fullname'] })
        .populate({ path: 'product_id', select: 'name description' })
        .lean();
}

const getAllCurrentJob = async (req, res, next) => {
    const job_id = req.params.job_id;
    const page = req.query.page;
    const limit = req.query.limit;
    const select = req.query.select;
    const sortBy = req.query.sortBy;
    const user_id = req.user_id;
    const user_type = req.user_type;
    if (!page || !limit) {
        res.send(null);
        return;
    }
    try {
        const selectQuery = {};
        if (select) {
            const fieldsArray = select.split(',');
            fieldsArray.forEach((value) => {
                if (!UserModelUnselectableFields.includes(value))
                    selectQuery[value] = 1;
            });
        }
        if (user_type === 'client') {
            const desired_job = (await Product.findById(job_id)).toJSON();
            const desired_user_id = await desired_job.user_id.toString();
            if (desired_user_id === user_id.toString()) {
                res.send(await getOfferListWithProviderPopulate(
                    page,
                    limit,
                    { job_id: job_id },
                    selectQuery,
                    sortBy,
                ));
                return;
            }
            throw new ForbiddenError('You are not allowed to access to the offers');
        }
        res.send(getOfferListWithProductPopulate(
            page,
            limit,
            { job_id: job_id },
            selectQuery,
        ));
        return;
    } catch (error) {
        throw new Error(error);
    }
}

const getAllUserOffer = (req, res, next) => {
    const user_id = req.user_id;
    Offer.find({ user_id: user_id })
        .then((result) => {
            // res.redirect('/homepage')
            res.send({ myOffers: result, message: "Get all offer successfully" })
        })
        .catch(err => {
            res.send(err)
        })
}

const deleteById = (req, res, next) => {
    const service_id = req.params.service_id
    if (!checkId(service_id)) {
        res.status(404).send({ message: "The service isn't exist!" })
        return;
    }
    Product.deleteOne({ _id: new ObjectId(service_id), type: "service" })
        .then((product) => {
            console.log(product)
            // if(!product){
            //     res.status(404).send({message: "The service isn't exist"})
            //     return;
            // }
            res.send({ message: "Delete sucessfully" })
            return;
        })
        .catch(err => {
            console.log(err)
        })
}

const changeById = (req, res, next) => {
    const job_id = req.params.job_id;
    if (!checkId(job_id)) {
        res.status(404).send({ message: "The Offer isn't exist!" })
        return;
    }
    const provider_id = req.provider_id
    const offer_price = req.body.offer_price;
    const offer_finish_estimated_time = req.body.offer_finish_estimated_time;
    const status = req.body.status;
    const introduction = req.body.introduction;
    const create_time = req.body.create_time;
    Offer.findOne({ job_id: job_id }).then(offer => {
        offer.provider_id = provider_id;
        offer.offer_price = offer_price;
        offer.offer_finish_estimated_time = offer_finish_estimated_time;
        offer.status = status;
        offer.introduction = introduction;
        offer.create_time = create_time;
        return offer.save();
    })
        .then(() => {
            res.status(200).send({ message: "Update offer successfully" })
        }
        )
        .catch((err) => {
            res.send(err)
        })
}

const offers = {
    createNew,
    getAllUserOffer,
    changeById,
    deleteById,
    getAllCurrentJob
}
export default offers;  