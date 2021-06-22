const ObjectId = require('mongodb').ObjectID
const {getDb} = require('../db')
const {throwApiError} = require('../utils')
const {hashPassword} = require('../utils/hashPassword')
const {COOKIE_NAME} = require('../constants')

const getUser = exports.getUser = async (userId) => {
    const db = getDb()

    const user = await db.collection(`users`).findOne({_id: userId}, {projection: {userName: 1}})

    console.log('getUser', user)
    return user
}

exports.checkUserLoginAndPasswordAndGetUser = async (login, password) => {
    const db = getDb()
    const user = await db.collection(`users`).findOne({login: login})

    if (!user) throwApiError(403, 'User is not defined')

    const hashedPassword = await hashPassword(password)

    if (hashedPassword !== user.hashedPassword) throwApiError(403, 'Неверный пароль')

    return await getUser(user._id)
}

exports.createUser = async (login, userName, password) => {
    const db = getDb()

    const existingLogin = await db.collection(`users`).findOne({login})

    if (existingLogin) {
        throwApiError(409, `User с таким login уже существует.`)
    }

    const hashedPassword = await hashPassword(password)

    const result = await db.collection(`users`).insertOne({login, userName, hashedPassword, cookies: {}})

    return await getUser(result.ops[0]._id)
}

exports.generateAndSaveCookie = async (userId) => {
    const db = getDb()

    const cookie = {
        name: COOKIE_NAME,
        value: Math.random().toString().slice(2),
        expires: new Date(Date.now() + 1000 * 86400 * 365)
    }

    await db
        .collection(`users`)
        .updateOne(
            {_id: userId},
            {
                $set: {
                    [`cookies.${cookie.value}`]: cookie
                }
            }
        )

    return cookie
}

exports.deleteCookie = async (userId, cookieValue) => {
    const db = getDb()

    await db
        .collection(`users`)
        .updateOne(
            {
                _id: ObjectId(userId)
            },
            {
                $unset: {
                    [`cookies.${cookieValue}`]: ''
                }
            }
        )
}