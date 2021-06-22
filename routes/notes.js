const {router, upload} = require('./router')
const ObjectId = require('mongodb').ObjectID
const {getDb} = require('../db')
const {PERMISSIONS} = require('../constants')
const {checkUserAccessRights} = require('../utils/permissions')
const validators = require('../utils/schemes')

const checkers = {
    objectIsValid(id) {
        return ObjectId.isValid(id)
    }
}

router.get('/notes', async ctx => {
    const db = getDb()
    const dbNotes = await db.collection(`test`).find({}).toArray()

    ctx.body = {
        notes: dbNotes
    }
    console.log('notes page')
})

router.get('/note', async ctx => {
    ctx.body = 'create note'

    console.log('create note')
})

router.get('/note/:id', async ctx => {
    const db = getDb()
    const id = ctx.params.id

    if (!checkers.objectIsValid(id)) ctx.throw(400, 'is is not valid')

    const note = await db.collection(`test`).findOne({_id: ObjectId(id)})

    if (note) {
        ctx.body = note
    } else {
        ctx.throw(400, `note with id ${id} is not found`)
    }
})

router.get('/update/:id', async ctx => {
    const db = getDb()

    await checkUserAccessRights(ctx, db, PERMISSIONS.updateNote)

    const id = ctx.params.id

    if (!checkers.objectIsValid(id)) ctx.throw(400, 'id is not valid')

    const note = await db.collection(`test`).findOne({_id: ObjectId(id)})

    if (note) {
        ctx.body = note
    } else {
        ctx.throw(404, `note with id ${id} is not found`)
    }
})

router.post('/note', upload.none(), async ctx => {
    const db = getDb()
    await validators.noteValidator(ctx.request.body)

    const {title} = ctx.request.body
    const existingNote = await db.collection(`test`).findOne({title: title})

    if (existingNote) {
        ctx.throw(409, `заметка с таким заголовком уже существует.`)
    }

    const result = await db.collection(`test`).insertOne(ctx.request.body)

    ctx.body = result.ops[0]

    console.log('create note completed')
})

router.put('/update/:id', upload.none(), async ctx => {
    const db = getDb()

    await validators.noteValidator(ctx.request.body)

    const resultValidation = await validators.noteValidator(ctx.request.body)

    if (!resultValidation) console.error(validators.noteValidator.errors)

    const {id, title, note, labels, publication_date} = ctx.request.body

    await db
        .collection(`test`)
        .updateOne({_id: ObjectId(id)}, {
            $set: {
                title: title,
                note: note,
                labels: labels,
                publication_date: publication_date
            }
        })

    ctx.body = {id}
})

router.delete('/note/:id', async ctx => {
    const db = getDb()
    const id = ctx.params.id

    if (!checkers.objectIsValid(id)) ctx.throw(400, `id is not valid`)

    const note = await db.collection(`test`).findOne({id: id})

    await db.collection(`test`).deleteOne({_id: ObjectId(id)})

    ctx.body = {id}
})