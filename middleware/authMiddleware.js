import pkg from 'jsonwebtoken';
const { sign, verify } = pkg;
import User from '../models/user.js'
import { ObjectId } from 'mongodb';
export const requireAuth = (req, res, next) => {
    const token = req.cookies.Jwt;
    if (token) {
        verify(token, process.env.ACCESS_TOKEN, (err, decodedToken) => {
            if (err) {
                console.log(err.message);
                res.redirect('/login')
            } else {
                console.log(decodedToken)
                next();
            }
        })
    }
    else {
        res.redirect('/login')
    }
}

export const checkUser = (req, res, next) => {
    let token = req.headers.authorization
    if (token) {
        token = token.split(" ")[1]
        verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                req.user_id = null;
                res.status(401).send(err);
            } else {
                console.log(decodedToken.user_id);
                // req.user_id = decodedToken.user_id
                await User.findOne({ _id: new ObjectId(String(decodedToken.user_id))})
                .then((user) => {
                    req.user_id = user._id;
                    req.user_type = user.type;
                    next();
                })
                .catch((err) => {
                    console.log(err)
                });
            }
        })
    }
    else {
        req.user_id = null;
        res.status(401).send({message: "Unauthorized"})
        return;
    }
}

export const getUserByEmail = (req, res, next) => {
    let token = req.headers.authorization
    if (token) {
        token = token.split(" ")[1]
        verify(token, process.env.JWT_SECRET, async (err, decodedToken) => {
            if (err) {
                req.emailLogIn = null;
                res.status(401).send(err);
            } else {
                console.log(decodedToken.user_id);
                // req.user_id = decodedToken.user_id
                await User.findOne({ _id: new ObjectId(String(decodedToken.emailLogIn))})
                .then((user) => {
                    req.emailLogIn = user;
                    next();
                })
                .catch((err) => {
                    console.log(err)
                });
            }
        })
    }
    else {
        req.emailLogIn = null;
        res.status(401).send({message: "Email isn't exist!"});
        return;
    }
}
// export default {requireAuth, checkUser};