const {router, upload} = require('./router')
const {COOKIE_NAME, PERMISSIONS} = require('../constants')
const validators = require('../utils/schemes')
const {getRolesPermissions, checkPermissionByRoles} = require('../processors/permissions')
const {
    getAllUsersSanitized,
    createUser,
    checkUserLoginAndPasswordAndGetUser,
    generateAndSaveCookie,
    deleteCookie, updateNote, getNoteById, createNote, changeUsersRoles
} = require('../processors')

router.get('/self', async ctx => {
    const permissions = await getRolesPermissions(ctx.user.roles)

    ctx.body = {
        userName: ctx.user.userName,
        permissions,
    }
})

router.get('/users', async ctx => {
    const listOfUsers = await getAllUsersSanitized()

    // console.log(2, listOfUsers)

    ctx.body = {
        users: listOfUsers
    }
})

router.put('/updateRoles', upload.none(), async ctx => {
    // await checkPermissionByRoles(ctx.user.roles, PERMISSIONS.changeUserRoles)
    const users = ctx.request.body

    const result = await changeUsersRoles(ctx.request.body)
    ctx.body = result

    //
    // await validators.noteValidator(ctx.request.body)
    // const {id} = ctx.request.body
    //
    // await updateNote(ctx.request.body)
    //
    // const note = await getNoteById(id)
    //
    // ctx.body = {note}
})

router.post('/registration', upload.none(), async ctx => {
    await validators.registrationValidator(ctx.request.body)

    const {login, userName, password} = ctx.request.body
    const user = await createUser(login, userName, password)
    console.log('user', user)
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