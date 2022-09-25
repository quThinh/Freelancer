import User from '../models/user.js'
import { hashSync, compareSync } from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import referralCodes from 'referral-codes';
import Wallet from '../models/wallet.js'
import pkg from 'jsonwebtoken';
import pkgSession from 'mongoose'
import wallet from '../models/wallet.js';
import WalletStatus from '../models/walletStatus.js';
const { startSession } = pkgSession;
const { sign, verify } = pkg;
export const comparePassword = (password, hashedPassword) => {
    return compareSync(password, hashedPassword);
}

const getUserPassword = async (email) => {
    return await User.findOne({ email: email })
        .select({
            _id: 1,
            email: 1,
            hashed_password: 1,
            type: 1,
            status: 1,
        })
        .lean();
}

const generateToken = (
    user_id,
    email,
    role,
    secret,
    expiresIn,
) => {
    return sign(
        {
            user_id,
            email,
            role,
        },
        secret,
        { expiresIn },
    );
}

const logIn = async (req, res, next) => {
    const emailLogIn = req.body.email;
    const passwordLogIn = req.body.password;
    let role;
    // console.log(emailLogIn, passwordLogIn)
    try {
        const user = await getUserPassword(emailLogIn);
        if (!user || user.status === 2 || user.del_flag)
            throw new Error(`Email ${emailLogIn} does not exist.`);
        if (!compareSync(passwordLogIn, user.hashed_password))
            throw new Error('Incorrect password');
        role = user.type;
        const {
            JWT_SECRET,
            JWT_EXPIRES_IN,
            JWT_REFRESH_SECRET,
            JWT_REFRESH_EXPIRES_IN,
        } = process.env;

        const accessToken = generateToken(
            user._id,
            emailLogIn,
            role,
            JWT_SECRET,
            JWT_EXPIRES_IN,
        );

        const refreshToken = generateToken(
            user._id,
            emailLogIn,
            role,
            JWT_REFRESH_SECRET,
            JWT_REFRESH_EXPIRES_IN,
        );
        res.send({accessToken: accessToken, refreshToken: refreshToken})
        return {
            accessToken,
            refreshToken,
        };
    } catch (e) {
        console.log(e)
        throw e;
        // throw new BadRequestError('Email or password is incorrect.');
    }
    
}

// undone
const refreshTokens = async (req, res, next) => {
    const {
        JWT_SECRET,
        JWT_EXPIRES_IN,
        JWT_REFRESH_SECRET,
        JWT_REFRESH_EXPIRES_IN,
    } = process.env;
    const accessToken = localStorage.getItem('accessToken');
    const refreshToken = localStorage.getItem('refreshToken');
    try {
        const refreshPayload = verify(refreshToken, JWT_REFRESH_SECRET);
        const tokenPayload = verify(accessToken, JWT_SECRET, {
            ignoreExpiration: true,
        });

        const { user_id, email, role } = tokenPayload;
    } catch (e) {
        throw new BadRequestError('Email or password is incorrect.');
    }
}

export const hashPassword = (password, rounds) => {
    return hashSync(password, rounds);
}


const register = async (req, res, next) => {
    const email = req.body.email;
    const phone = req.body.phone;
    const fullname = req.body.fullname;
    const hashed_password = hashPassword(req.body.password, 10);
    const type = 'client';
    const del_flag = false;
    const status = 0;
    const create_time = new Date();
    const active_token = uuidv4();
    const api_key = uuidv4();
    let referralCode = referralCodes.generate({ length: 8 });

    const session = await startSession();
    session.startTransaction();

    try {
      let dReferral = await User.findOne(
        { referal_code: referralCode, type: 'client' },
        null,
        { session },
      );
      while (dReferral) {
        try {
          referralCode = referralCodes.generate({ length: 8 });

          // eslint-disable-next-line no-await-in-loop
          dReferral = await User.findOne(
            { referal_code: referralCode, type: 'client'},
            null,
            { session },
          );
        }catch(e){
          console.log(e);
        }
      }

      const user = new User(
        {
          email,
          phone,
          fullname,
          hashed_password,
          type,
          del_flag,
          status,
          create_time,
          active_token,
          api_key,
          referal_code: referralCode,
        },
        { session },
      );
      const userCreated = await user.save({ session });

      if (!userCreated) {
        throw new Error('User not created');
      }

      const currentWallet = await wallet.create(
        [
          {
            user_id: userCreated._id,
            balance: 0,
            create_time,
            status: WalletStatus.ACTIVATED,
          },
        ],
        { session },
      );

      if (!currentWallet || currentWallet.length === 0) {
        throw new Error('Wallet not created');
      }

      if (userCreated) {
        res.redirect(`${process.env.WEBSITE_DOMAIN_PATH}/user/register/verify/${userCreated.active_token}`);
      }
      await session.commitTransaction();
      await session.endSession();
    } catch (e) {
      await session.abortTransaction();
      await session.endSession();
      throw new BadRequestError(e.message);
    }
}



const skills = {
    logIn,
    // logOut,
    register
}
export default skills;