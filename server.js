require('dotenv').config()

Error.stackTraceLimit = Infinity

const Koa = require('koa')

const {router} = require('./routes/router')
const {HOST, PORT} = require('./config')
const {getDb} = require('./db')
const {COOKIE_NAME} = require('./constants')
const bodyParser = require('koa-bodyparser')
const cors = require('@koa/cors')
const localize = require('ajv-i18n')
const {throwApiError} = require('./utils')

const app = new Koa()

app.use(bodyParser())
app.use(cors({credentials: true}))


app.use(async (ctx, next) => {
    try {
        await next()
        const status = ctx.status || 404

        if (status === 404) {
            throwApiError(404, 'page not found')
        }
    } catch (err) {
        ctx.status = err.status || 500
        ctx.body = {
            error: {
                status: err.status,
                message: err.message
            }
        }

        if (err.errors) {
            localize.ru(err.errors)

            ctx.status = 400
            ctx.body = {
                message: 'validation errors',
                errors: err.errors
            }
        } else {
            console.error(err)
        }

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
        if (!ctx.user) {
            ctx.body = 'You are not logged in, please log in'
            throwApiError(403, 'You are not logged in, please log in')
        }
    }

    await next()
})

router.get('/', async ctx => {
    console.log('homePage')

    ctx.body = {ok: 1}
})

require('./routes/users')
require('./routes/notes')


app.use(router.routes())

app.listen(PORT, HOST, () => {
    console.log(`Listen with Koa ${HOST}:${PORT}`)
})
