import { ObjectId } from 'mongodb';
import Product from '../models/productService.js';

const checkId = (_id) => {
    Product.findOne({ _id: new ObjectId(_id), type: "service" })
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
    const type = "service";
    const upper_bound_fee = req.body.finish_estimated_time;
    const image = req.body.finish_estimated_time;
    const expiration_time = req.body.finish_estimated_time;
    const status = req.body.status;
    const sold_time = req.body.sold_time;
    const create_time = req.body.create_time;
    const rate = req.body.rate;
    const number_of_rate = req.body.number_of_rate;
    const required_level = req.body.required_level;
    const payment_method = req.body.payment_method;
    const products = new Product({
        name: name,
        type: type,
        user_id: ObjectId(user_id),
        category: category,
        skill: skill,
        status: status,
        description: description,
        providing_method: providing_method,
        finish_estimated_time: finish_estimated_time,
        lower_bound_fee: lower_bound_fee,
        upper_bound_fee: upper_bound_fee,
        image: image,
        expiration_time: expiration_time,
        create_time: create_time,
        sold_time: sold_time,
        rate: rate,
        number_of_rate: number_of_rate,
        required_level: required_level,
        payment_method: payment_method
    });
    products.save()
        .then(() => {
            console.log("call model successfully")
            res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        });
    return
}

const getAll = (req, res, next) => {
    Product.find({type: "service"})
        .then((result) => {
            res.send(result)
        })
        .catch(err => {
            console.log(err)
        })
}

const getAllCurrentUser = (req, res, next) => {
    const user_id = req.user_id

    Product.find({ user_id: user_id, type: "service" })
        .then((result) => {
            res.status(200).send(result.json())
        })
        .catch(err => {
            res.status(404).send({message: "Can not find user!"})
        })
}

const getUserServiceById = (req, res, next) => {
    if (!req.user_id) {
        res.status(401).send({message: "Not Authorized"}) // not authorized
        return;
    }
    const service_id = req.params.service_id
    if (!checkId(service_id)) {
        res.status(404).send({ message: "The service isn't exist!" })
        return;
    }
    Product.find({ _id: new ObjectId(service_id), type: "service"})
        .then((result) => {
            // res.redirect('/homepage')
            res.send(result)
        })
        .catch(err => {
            console.log(err)
        })
}

const getOtherServiceById = (req, res, next) => {
    const service_id = req.params.service_id
    if (!checkId(service_id)) {
        res.status(404).send({ message: "The service isn't exist!" })
        return;
    }
    Product.find({ _id: new ObjectId(service_id), type: "service" })
        .then((result) => {
            res.send(result)
        })
        .catch(err => {
            console.log(err)
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

const browsingService = (req, res, next) => {
    const service_id = req.params.service_id
    Product.findOne({ _id: new ObjectId(service_id), type: "service" })
        .then((product) => {
            if (!product) {
                res.status(404).send({ message: "The service isn't exist" })
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
    const service_id = req.params.service_id;
    if (!checkId(service_id)) {
        res.status(404).send({ message: "The service isn't exist!" })
        return;
    }
    Product.findOne({ _id: new ObjectId(service_id), type: "service" }).then(product => {
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
    const _id = req.params.service_id;
    if (!checkId(_id)) {
        res.status(404).send({ message: "The service isn't exist!" })
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
    Product.findOne({ _id: _id, type: "service" }).then(product => {
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