const {ObjectId, ReturnDocument} = require('mongodb')
const {getDb} = require('../db')
const {throwApiError} = require('../utils')
const {hashPassword} = require('../utils/hashPassword')
const {COOKIE_NAME} = require('../constants')

const getUser = exports.getUser = async (userId) => {
    const db = getDb()

    const user = await db.collection(`users`).findOne({_id: userId}, {projection: {userName: 1}})

    return user
}

exports.getAllUsersSanitized = async () => {
    const db = getDb()

    const listOfUsers = await db.collection(`users`).find({}, {projection: {login: 1, userName: 1, roles: 1}}).toArray()

    return listOfUsers
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

    const user = await db.collection(`users`).insertOne({login, userName, hashedPassword, cookies: {}, roles: ['user']})

    const result = await db.collection(`users`).findOne({_id: ObjectId(user.insertedId)})

    return await getUser(result._id)
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

exports.getNotes = async () => { // Note[]
    const db = getDb()
    const dbNotes = await db.collection(`test`).find({}).toArray()

    return dbNotes
}

exports.getNoteById = async (noteId) => { // Note | null
    const db = getDb()
    const note = await db.collection(`test`).findOne({_id: ObjectId(noteId)})

    return note
}

exports.createNote = async (requestBody) => { // Note | null
    const db = getDb()
    const {title} = requestBody
    const existingNote = await db.collection(`test`).findOne({title: title})

    if (existingNote) {
        throwApiError(409, 'заметка с таким заголовком уже существует.')
    }

    const result = await db.collection(`test`).insertOne(requestBody)

    return result.ops[0] || null
}

exports.updateNote = async (requestBody) => {
    const db = getDb()
    const {id, title, note, labels, publication_date} = requestBody

    // const result = await db
    //     .collection(`test`)
    //     .updateOne({_id: ObjectId(id)}, {
    //         $set: {
    //             title: title,
    //             note: note,
    //             labels: labels,
    //             publication_date: publication_date
    //         }
    //     })

    const result = await db
        .collection(`test`)
        .findOneAndUpdate({_id: ObjectId(id)}, {
            $set: {
                title: title,
                note: note,
                labels: labels,
                publication_date: publication_date
            }
        }, {
            returnDocument: ReturnDocument.AFTER,
        })

    // console.log(result)
}

exports.deleteNote = async (noteId) => {
    const db = getDb()

    await db.collection(`test`).deleteOne({_id: ObjectId(noteId)})
}




