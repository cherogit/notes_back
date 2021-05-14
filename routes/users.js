const {router, upload} = require('./router')
const ObjectId = require('mongodb').ObjectID
const {getDb} = require('../db')
const {COOKIE_NAME} = require('../constants')
const {hashPassword} = require('../utils/hashPassword')

router.get('/registration', async ctx => {
    console.log('registrationPage')

    ctx.body = 'registrationPage'
})

router.post('/registration', upload.none(), async ctx => {
    const db = getDb()
    const {login, userName, password} = ctx.request.body
    const existingLogin = await db.collection(`users`).findOne({login})

    if (existingLogin) ctx.throw(409, `User с таким login уже существует.`)

    const hashedPassword = await hashPassword(password)

    await db.collection(`users`).insertOne({login, userName, hashedPassword, cookies: {}})

    console.log(`Welcome, ${userName}`)

    ctx.body = `Welcome, ${userName}`
})

router.get('/auth', async ctx => {
    console.log('Authorization')

    ctx.body = 'Authorization'
})

router.post('/auth', upload.none(), async ctx => {
    const db = getDb()
    const {login, password} = ctx.request.body
    const user = await db.collection(`users`).findOne({login: login})

    if (!user) ctx.throw(403, 'User is not defined')

    const hashedPassword = await hashPassword(password)

    if (hashedPassword !== user.hashedPassword) ctx.throw(403, 'Неверный пароль')

    const cookie = {
        name: COOKIE_NAME,
        value: Math.random().toString().slice(2),
        expires: new Date(Date.now() + 1000 * 86400 * 365)
    }

    await db
        .collection(`users`)
        .updateOne(
            {login: login},
            {
                $set: {
                    [`cookies.${cookie.value}`]: cookie
                }
            }
        )

    ctx.cookies.set(cookie.name, cookie.value, {
        expires: cookie.expires,
        httpOnly: true
    })

    ctx.body = 'auth completed'
    console.log('auth completed')
})

router.get('/logout', async ctx => {
    const db = getDb()

    if (!ctx.user) return ctx.throw(403, 'User is not defined')
    // Не совсем понимаю для чего данная проверка, при каких случаях она отработает?

    const cookieValue = ctx.cookies.get(COOKIE_NAME)

    await db
        .collection(`users`)
        .updateOne(
            {
                _id: ObjectId(ctx.user._id)
            },
            {
                $unset: {
                    [`cookies.${cookieValue}`]: ''
                }
            }
        )

    ctx.cookies.set(COOKIE_NAME)

    ctx.body = 'Logout completed'

    console.log('Logout completed')
})