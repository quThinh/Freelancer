import { ObjectId } from 'mongodb';
import Product from '../models/productService.js';
import agenda from '../agenda.js';
const checkId = (_id) => {
    Product.findOne({ _id: new ObjectId(_id), type: "job" })
        .then(() => {
            return true;
        })
        .catch(() => {
            return false;
        })
}

const createNew = (req, res, next) => {
    const name = req.body.name;
    const user_id = req.user_id
    const category = req.body.category.map((item) => ObjectId(item));
    const skill = req.body.skill.map((item) => ObjectId(item));;
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
    const products = new Product({
        name: name,
        type: type,
        user_id: ObjectId(user_id),
        category: category,
        skill: skill,
        description: description,
        providing_method: providing_method,
        finish_estimated_time: finish_estimated_time,
        lower_bound_fee: lower_bound_fee,
        upper_bound_fee: upper_bound_fee,
        image: image,
        expiration_time: expiration_time,
        required_level: required_level,
        payment_method: payment_method,
    });
    products.save()
        .then(async () => {
            await agenda.schedule(
                products.expiration_time,
                'set product to expired',
                { product_id: products._id },
              );
            res.send({message: "Create Job successfully"})
        })
        .catch(err => {
            console.log(err)
        });
    return
}

const getAll = (req, res, next) => {
    Product.find({type: "job"})
        .then((result) => {
            console.log(result)
            res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        })
}

const getAllCurrentUser = (req, res, next) => {
    const user_id = req.user_id

    Product.find({ user_id: user_id, type: "job" })
        .then((result) => {
            res.status(200).send(result.json())
        })
        .catch(err => {
            res.status(404).send({message: "Can not find user!"})
        })
}

const getUserJobById = (req, res, next) => {
    if (!req.user_id) {
        res.status(401).send({message: "Not Authorized"}) // not authorized
        return;
    }
    const job_id = req.params.job_id
    if (!checkId(job_id)) {
        res.status(404).send({ message: "The job isn't exist!" })
        return;
    }
    Product.find({ _id: new ObjectId(job_id), type: "job" })
        .then((result) => {
            // res.redirect('/homepage')
            res.send({ myJobs: result })
        })
        .catch(err => {
            console.log(err)
        })
}

const getOtherJobById = (req, res, next) => {
    const job_id = req.params.job_id
    if (!checkId(job_id)) {
        res.status(404).send({ message: "The job isn't exist!" })
        return;
    }
    Product.find({ _id: new ObjectId(job_id), type: "job" })
        .then((result) => {
            // console.log(réu)
            res.send({ jobs: result })
            // res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        })

}

const deleteById = (req, res, next) => {
    const job_id = req.params.job_id
    if (!checkId(job_id)) {
        res.status(404).send({ message: "The job isn't exist!" })
        return;
    }
    Product.deleteOne({ _id: new ObjectId(job_id), type: "job" })
        .then((product) => {
            console.log(product)
            // if(!product){
            //     res.status(404).send({message: "The job isn't exist"})
            //     return;
            // }
            res.send({ message: "Delete sucessfully" })
            return;
        })
        .catch(err => {
            console.log(err)
        })
}

const browsingjob = (req, res, next) => {
    const job_id = req.params.job_id
    Product.findOne({ _id: new ObjectId(job_id), type: "job" })
        .then((product) => {
            if (!product) {
                res.status(404).send({ message: "The job isn't exist" })
                return;
            }
            if (product.status == 0) {
                product.status = 1;
            }
            else {
                product.status = 0;
            }
            res.send({ message: "Browsing successfully" })
            return product.save();
        })
        .catch(err => {
            console.log(err)
        })
}

const toggleById = (req, res, next) => {
    const job_id = req.params.job_id;
    if (!checkId(job_id)) {
        res.status(404).send({ message: "The job isn't exist!" })
        return;
    }
    Product.findOne({ _id: new ObjectId(job_id), type: "job" }).then(product => {
        if (product.status == 1) {
            product.status = 2
        }
        else {
            product.status = 1
        }
        return product.save();
    })
        .then(() => {
            res.send({ message: "toggle successfully" })
        })
        .catch(err => {
            console.log(err)
        })
}

const changeById = (req, res, next) => {
    const _id = req.params.job_id;
    if (!checkId(_id)) {
        res.status(404).send({ message: "The job isn't exist!" })
        return;
    }
    const name = req.body.name;
    const user_id = req.user_id
    const category = req.body.category.map((item) => ObjectId(item));
    const skill = req.body.skill.map((item) => ObjectId(item));;
    const description = req.body.description;
    const providing_method = req.body.providing_method;
    const finish_estimated_time = req.body.finish_estimated_time;
    const lower_bound_fee = req.body.lower_bound_fee;
    const type = req.body.type;
    const upper_bound_fee = req.body.finish_estimated_time;
    const image = req.body.finish_estimated_time;
    const expiration_time = req.body.finish_estimated_time;
    const status = req.body.status;
    const create_time = req.body.create_time;
    Product.findOne({ _id: _id, type: "job" }).then(product => {
        product.name = name;
        product.user_id = new ObjectId(user_id)
        product.category = category;
        product.skill = skill;
        product.description = description;
        product.providing_method = providing_method;
        product.finish_estimated_time = finish_estimated_time;
        product.lower_bound_fee = lower_bound_fee;
        product.type = type;
        product.upper_bound_fee = upper_bound_fee;
        product.image = image;
        product.expiration_time = expiration_time;
        product.status = status;
        product.create_time = create_time;
        return product.save();
    })
        .then(() => {
            res.status(200).send({message: "Update product successfully"})
        }
        )
        .catch((err) => {
            res.send(err)
        })
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