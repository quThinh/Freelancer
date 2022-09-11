import Skill from '../models/skill.js'
const getAll = (req, res, next) => {
    Skill.find()
        .then((result) => {
            console.log(typeof(result))
            res.redirect('/homepage')
        })
        .catch(err => {
            console.log(err)
        })
}

const skills = {
    getAll
}
export default skills;