require('dotenv').config()

Error.stackTraceLimit = Infinity

const Koa = require('koa')

const {router} = require('./routes/router')
const {HOST, PORT} = require('./config')
const {getDb} = require('./db')
const {COOKIE_NAME} = require('./constants')
const bodyParser = require('koa-bodyparser')

const app = new Koa()

app.use(bodyParser())

app.use(async (ctx, next) => {
    try {
        await next()
        const status = ctx.status || 404

        if (status === 404) {
            ctx.throw(404)
        }
    } catch (err) {
        if (err.errors) {
            console.error(`validation errors:`, err.errors)
        } else {
            console.error(err)
        }

        ctx.status = err.status || 500

        console.error(ctx.status)
    }
})

app.on(`error`, err => {
    console.error(`server error`, err)
})

app.use(async (ctx, next) => {
    const db = getDb()

    const cookieValue = ctx.cookies.get(COOKIE_NAME)

    ctx.user = await db.collection('users').findOne({
            [`cookies.${cookieValue}.name`]: COOKIE_NAME,
            [`cookies.${cookieValue}.value`]: cookieValue
        },
        {
            projection: {
                hashedPassword: 0,
                cookies: 0
            }
        })

    if (!['/auth', '/registration'].includes(ctx.path)) {
        if (!ctx.user) ctx.throw(403, 'You are not logged in, please log in')
    }

    await next()
})

router.get('/', async ctx => {
    console.log('homePage')

    ctx.body = 'homePage'
})

require('./routes/users')
require('./routes/notes')


app.use(router.routes())

app.listen(PORT, HOST, () => {
    console.log(`Listen with Koa ${HOST}:${PORT}`)
})
