const {router, upload} = require('./router')
const {COOKIE_NAME} = require('../constants')
const validators = require('../utils/schemes')
const {
    createUser,
    checkUserLoginAndPasswordAndGetUser,
    generateAndSaveCookie,
    deleteCookie
} = require('../processors')

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
    const cookie = await generateAndSaveCookie(user._id)

    ctx.cookies.set(cookie.name, cookie.value, {
        expires: cookie.expires
    })

    console.log(`Welcome, ${user.userName}`)

    ctx.body = user
})

router.post('/auth', upload.none(), async ctx => {
    await validators.authorizationValidator(ctx.request.body)

    const {login, password} = ctx.request.body
    const user = await checkUserLoginAndPasswordAndGetUser(login, password)
    const cookie = await generateAndSaveCookie(user._id)

    ctx.cookies.set(cookie.name, cookie.value, {
        expires: cookie.expires
    })

    console.log('auth completed')
    ctx.body = user
})

router.get('/logout', async ctx => {
    const cookieValue = ctx.cookies.get(COOKIE_NAME)

    await deleteCookie(ctx.user._id, cookieValue)

    ctx.cookies.set(COOKIE_NAME)

    console.log('Logout completed')

    ctx.body = {ok: 1}

})