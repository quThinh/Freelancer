import { ObjectId } from 'mongodb';
import Offer from '../models/offer.js';
import user from '../models/user.js';

const checkId = (_id) => {
    Offer.findOne({ job_id: new ObjectId(_id)})
        .then(() => {
            return true;
        })
        .catch(() => {
            return false;
        })
}

const createNew = (req, res, next) => {
    const job_id = req.params.job_id;
    const provider_id = req.user_id;
    const offer_price = req.body.offer_price;
    const offer_finish_estimated_time = req.body.offer_finish_estimated_time;
    const introduction = req.body.introduction;
    const status = 0;
    const create_time = new Date();
    const offer = new Offer({
        job_id: job_id,
        provider_id: provider_id,
        offer_price: offer_price,
        offer_finish_estimated_time: offer_finish_estimated_time,
        status: status,
        introduction: introduction,
        create_time: create_time,
    });
    offer.save()
        .then(() => {
            res.send({message: "Offer job successfully."})
        })
        .catch(err => {
            res.send(err)
        });
    return
}

const getAllCurrentJob = (req, res, next) => {
    const job_id = req.params.job_id
    Product.find({job_id: job_id})
        .then((result) => {
            res.status(200).send(result.json())
        })
        .catch(err => {
            res.status(404).send({message: "Can not find offer!"})
        })
}

const getAllUserOffer = (req, res, next) => {
    const user_id = req.user_id;
    Offer.find({user_id: user_id})
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
    Offer.findOne({ job_id: job_id}).then(offer => {
        offer.provider_id = provider_id;
        offer.offer_price = offer_price;
        offer.offer_finish_estimated_time = offer_finish_estimated_time;
        offer.status = status;
        offer.introduction = introduction;
        offer.create_time = create_time;
        return offer.save();
    })
        .then(() => {
            res.status(200).send({message: "Update offer successfully"})
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