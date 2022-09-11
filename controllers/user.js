import { IsEmail } from 'class-validator';
import { ObjectId } from 'mongodb';
import User from '../models/user.js';
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
            console.log("call model successfully")
            res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        });
    return
}

const getAll = (req, res, next) => {
    Category.find()
        .then((result) => {
            console.log(result)
            res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        })
}

const find = (id) => {
        const user = User.find({ _id: new ObjectId(id)})
        .then(() => {
            console.log("success")
        })
        .catch((err) => {
            console.log(err)
        })
        return user;
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
    find
}
export default categories;