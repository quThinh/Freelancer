import { ObjectId } from 'mongodb';
import Product from '../models/product.js';
import {checkUser} from '../middleware/authMiddleware.js'
const createNew = (req, res, next) => {
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
    const create_time = req.body.create_time
    console.log(name, type, user_id, category, skill, status, description, providing_method,
        finish_estimated_time, lower_bound_fee, upper_bound_fee, image, expiration_time )
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
        create_time: create_time
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
    Product.find()
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
    Product.find({user_id: user_id})
        .then((result) => {
            console.log(result)
            res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        })
}

const getUserServiceById = (req, res, next) => {
    console.log(req)
    const service_id = req.params.service_id
    Product.find({ _id: new ObjectId(service_id) })
        .then((res) => {
            console.log(res)
            // res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        })
}

const getOtherServiceById = (req, res, next) => {
    const service_id = req.params.service_id
    Product.find({ _id: new ObjectId(service_id) })
        .then((res) => {
            console.log(res)
            // res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        })
}

const deleteById = (req, res, next) => {
    const category_id = req.params.category_id
    User.deleteOne({_id: new ObjectId(category_id)})
        .then(() => {
            console.log("call model successfully")
            res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err + "loi roi")
        })
}

const changeById = (req, res, next) => {
    const category_id = req.params.category_id
    const updateName = req.body.name;
    const updateSlug = req.body.slug;
    const updateDescription = req.body.description;
    const updateImage = req.body.image;
    const updatePriority = req.body.priority;
    const updateStatus = req.body.status;
    Category.getById(category_id).then(category => {
        category.name = updateName;
        category.slug = updateSlug;
        category.description = updateDescription;
        category.image = updateImage;
        category.priority = updatePriority;
        category.status = updateStatus;
        return Category.save();
    })
    .then(() => {
        console.log("Update successfully")
    })
    .catch((err) => {
        console.log(err)
    })
}

const categories = {
    createNew,
    getAll,
    getAllCurrentUser,
    getUserServiceById,
    getOtherServiceById,
    changeById,
    deleteById,
}
export default categories;  