import { IsEmail } from 'class-validator';
import { ObjectId } from 'mongodb';
import User from '../models/user.js';
import {toSlugConverter} from '../util/toSlugConverter.js'
import { hashPassword, comparePassword } from './auth.js';
import { v4 as uuidv4 } from 'uuid';


const accountInfo = async (req, res, next) => {
    const emailLogIn = req.emailLogIn;
    const user_type = req.user_type;
    if (user_type === 'client') {
        const currentUser = await User.findOne({ email: emailLogIn, del_flag: false, type: "client" })
            .select({
                active_token: 0,
            })
            .populate('category')
            .lean();
        res.send(currentUser);
        return;
    }
    const currentUser = await User.findOne({ email: emailLogIn, del_flag: false, type: 'admin'}).lean();
    res.send(currentUser);
    return;
}

const password = async (req, res, next) => {
    const user_type = req.user_type;
    const user_id = req.user_id;
    const old_password = req.body.old_password;
    const new_password = req.body.updatePassword;
    const query = { _id: user_id, del_flag: false };
    if (old_password === new_password) {
      throw new BadRequestError(
        'New Password must be different with Old Password',
      );
    } else {
      try {
        const new_hashed_password = hashPassword(
          new_password,
          10,
        );
        const user = await User.findOne(query)
          .select({
            _id: 0,
            hashed_password: 1,
          })
          .lean();
        if (!comparePassword(old_password, user.hashed_password)) {
          throw new Error('Old Password is incorrect');
        } else {
          await User.findOneAndUpdate(query, {
            hashed_password: new_hashed_password,
          });
        }
        return;
      } catch (e) {
        throw new BadRequestError(e.message);
      }
    }
}

const profile = async (req, res, next) => {
    const user_type = req.user_type;
    const user_id = req.user_id;
    const phone = req.body.phone;
    const fullname = req.body.fullname;
    const birthday = req.body.birthday;
    const address = req.body.address;
    const introduction = req.body.introduction;
    const category = req.body.category;
    const skill = req.body.skill;
    const social_media_contact = req.body.social_media_contact;
    const query = { _id: user_id, del_flag: false };
    const user = await User.findOne({_id: user_id});
    if(!user) throw new Error("Can't find user.")
    // if (avatar) {
    //   try {
    //     const form = new FormData();
    //     form.append('objectType', 'user');
    //     form.append('objectId', user_id.toString());
    //     form.append('file', createReadStream(avatar.path));
    //     form.append('type', 'avatar');
    //     const mediaResponse = await axios.post<string>(
    //       `${process.env.MEDIA_ROOT_URL}/file`,
    //       form,
    //       {
    //         headers: { ...form.getHeaders() },
    //       },
    //     );
    //     Object.assign(changeProfileDto, { avatar: mediaResponse.data });
    //   } catch (e) {
    //     throw new BadRequestError(e.message);
    //   } finally {
    //     unlink(avatar.path, () => null);
    //   }
    // }
    if (
      skill &&
      skill.some((skill) => !skill.slug)
    ) {
      skill = skill.map((obj) => ({
        ...obj,
        slug: toSlugConverter(obj.name),
      })); // TODO : log new skills added by user to admins
    }
    if (user.type === "client"){
        const currentChange = await User.findOneAndUpdate({...query, type: "client"}, {phone, fullname, birthday, address, introduction, category, skill, social_media_contact}).exec();
        res.send(currentChange);
        return;
    }
    const currentChange = await User.findOneAndUpdate({...query, type: "admin"}, {phone, fullname, birthday, address, introduction, category, skill, social_media_contact}).exec();
        res.send(currentChange);
        return;
}

const verify = async (req, res, next) => {
    const active_token = req.params.active_token;
    try {
        const user = await User.findOneAndUpdate(
          {
            active_token,
            del_flag: false,
            type: 'client',
          },
          {
            status: 1,  //active
            active_token: uuidv4(),
          },
        );
        if (!user) {
          throw new BadRequestError(
            'Activation unsuccesfully : invalid ActiveToken or user has been activated before! This error will also be thrown in the case that user has been deleted !',
          );
        }
        // await sendVerifySucceedEmailQueue.add({
        //   user_email: user.email,
        //   user_fullname: user.fullname,
        // });
        return 'Kích hoạt tài khoản thành công';
      } catch (e) {
        throw new BadRequestError(e.message);
      }
}
const adminAccount = async (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    const type = req.body.type;
    const phone = req.body.phone;   
    const fullname = req.body.fullname;   
    const user_type = req.user_type;
    if(user_type !== 'admin') throw new Error("You don't have permission to perforn this action.")
    const hashed_password = hashPassword(password, 10);
    const status = 1;  //active
    const del_flag = false;
    const create_time = new Date();
    const active_token = uuidv4();
    const api_key = uuidv4();

    const userCreated = new User({
      email,
      type,
      phone,
      fullname,
      hashed_password,
      status,
      del_flag,
      create_time,
      active_token,
      api_key,
    });
    await userCreated.save();
    if (!userCreated) {
      throw new Error("Something wrong, can't create admin account.")
    }
    return;
}

const users = {
    accountInfo,
    password,
    profile,
    verify,
    // resetPassword,
    // checkActiveToken,
    // updatePassword,
    adminAccount
}
export default users;