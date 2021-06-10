const {router, upload} = require('./router')
const ObjectId = require('mongodb').ObjectID
const {getDb} = require('../db')
const {COOKIE_NAME} = require('../constants')
const validators = require('../utils/schemes')
const {createUser, checkUserLoginAndPasswordAndGetUser, generateAndSafeCookie} = require('../processors')

router.get('/self', async ctx => {
    console.log(ctx.user)

    ctx.body = {
        userName: ctx.user.userName
    }
})

router.post('/registration', upload.none(), async ctx => {
    await validators.registrationValidator(ctx.request.body)

    const {login, userName, password} = ctx.request.body
    const user = await createUser(login, userName, password)
    const cookie = await generateAndSafeCookie(user._id)

    ctx.cookies.set(cookie.name, cookie.value, {
        expires: cookie.expires,
    })

    console.log(`Welcome, ${user.userName}`)

    ctx.body = user
})

router.post('/auth', upload.none(), async ctx => {
    await validators.authorizationValidator(ctx.request.body)

    const {login, password} = ctx.request.body
    const user = await checkUserLoginAndPasswordAndGetUser(login, password)
    const cookie = await generateAndSafeCookie(user._id)

    ctx.cookies.set(cookie.name, cookie.value, {
        expires: cookie.expires,
    })

    console.log('auth completed')
    ctx.body = user
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