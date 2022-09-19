import { ObjectId } from 'mongodb';
import Offer from '../models/offer.js';
import user from '../models/user.js';
import Product from '../models/productService.js'

const createNew = async (req, res, next) => {
    const user_id = req.user_id;
    const job_id = req.params.job_id;
    const job = await Product.findById(job_id)
    if (job) {
        const existing_offer = await Offer.findOne({ provider_id: user_id, job_id })
        if (existing_offer) throw new Error('You already have an offer');
        const provider_id = req.user_id;
        const offer_price = req.body.offer_price;
        const offer_finish_estimated_time = req.body.offer_finish_estimated_time;
        const introduction = req.body.introduction;
        const create_time = new Date();
        const offer = new Offer({
            job_id: job_id,
            provider_id: provider_id,
            offer_price: offer_price,
            offer_finish_estimated_time: offer_finish_estimated_time,
            introduction: introduction,
            create_time: create_time,
        });
        offer.save()
            .then(() => {
                res.send({ message: "Offer job successfully." })
            })
            .catch(err => {
                res.send(err)
            });
        return offer;
    }
    throw new Error('Job not found');
}

const getAllCurrentJob = async (req, res, next) => {
    const job_id = req.params.job_id
    const job = await Product.findById(job_id)
    if (job) {
        Offer.find({ job_id: new ObjectId(job_id) })
            .then((offers) => {
                res.send({ offers: offers, message: "Get all offers of this job successfully." })
            })
            .catch((err) => {
                res.send(err)
            })
        return;
    }
    throw new Error('Job not found')
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