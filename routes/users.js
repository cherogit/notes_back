const {router, upload} = require('./router')
const {COOKIE_NAME, PERMISSIONS} = require('../constants')
const validators = require('../utils/schemes')
const {getRolesPermissions, checkPermissionByRoles} = require('../processors/permissions')
const {
    getUsersSanitized,
    createUser,
    checkUserLoginAndPasswordAndGetUser,
    generateAndSaveCookie,
    deleteCookie,
    changeUsersRoles,
    checkTheValidityOfTheRoles
} = require('../processors')

router.get('/self', async ctx => {
    const permissions = await getRolesPermissions(ctx.user.roles)

    ctx.body = {
        userName: ctx.user.userName,
        permissions,
    }
})

router.get('/users', async ctx => {
    const listOfUsers = await getUsersSanitized()

    ctx.body = {
        users: listOfUsers
    }
})

router.put('/updateUsers', upload.none(), async ctx => {
    await checkPermissionByRoles(ctx.user.roles, PERMISSIONS.changeUserRoles)

    const users = ctx.request.body

    for (const user of users) {
        console.log(user, user.roles)
        await checkTheValidityOfTheRoles(user.roles)
    }

    await changeUsersRoles(users)

    const listOfUsers = await getUsersSanitized(users.map(user => user.id))

    ctx.body = {
        users: listOfUsers
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