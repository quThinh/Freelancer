import Skill from '../models/skill.js'
const getAll = (req, res, next) => {
    Skill.find()
        .then((result) => {
            res.send(result)
        })
        .catch(err => {
            console.log(err)
        })
}

const skills = {
    getAll
}
export default skills;