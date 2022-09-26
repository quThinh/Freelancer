import jwt from 'jsonwebtoken';
import { ObjectId } from 'mongodb';
import mongoose from 'mongoose';
import Category from '../models/category.js';
const createNew = (req, res, next) => {
    const name = req.body.name;
    const slug = req.body.slug;
    const description = req.body.description;
    const image = req.body.image;
    const priority = req.body.priority;
    const status = req.body.status;
    
    const categories = new Category({
        name: name,
        slug: slug,
        description: description,
        image: image,
        priority: priority,
        status: status,
    });
    categories.save()
        .then(() => {
            res.send("create successfully")
        })
        .catch(err => {
            console.log(err)
        });
    return
}

const getAll = (req, res, next) => {
    Category.find()
        .then((result) => {
            res.send(result)
        })
        .catch(err => {
            console.log(err)
        })
}

const getById = (req, res, next) => {
    const category_id = req.params.category_id
    Category.find({ _id: new ObjectId(category_id) })
        .then((category) => {
            res.send(category)
        })
        .catch(err => {
            console.log(err)
        })
}

const deleteById = (req, res, next) => {
    const category_id = req.params.category_id
    User.deleteOne({_id: new ObjectId(category_id)})
        .then(() => {
            res.send("delete successfully")
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
    Category.findOne({_id : category_id}).then(category => {
        console.log(category)
        category.name = updateName;
        category.slug = updateSlug;
        category.description = updateDescription;
        category.image = updateImage;
        category.priority = updatePriority;
        category.status = updateStatus;
        return category.save();
    })
    .then(() => {
        res.send("Update successfully")
    })
    .catch((err) => {
        console.log(err)
    })
}

const categories = {
    createNew,
    getAll,
    getById,
    changeById,
    deleteById,
}
export default categories;