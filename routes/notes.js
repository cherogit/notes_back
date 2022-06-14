const {router, upload} = require('./router')
const ObjectId = require('mongodb').ObjectID
const {getDb} = require('../db')
const {PERMISSIONS} = require('../constants')
const validators = require('../utils/schemes')
const {checkPermissionByRoles} = require('../processors/permissions')
const {throwApiError} = require('../utils')
const {createNote, getNotes, getNoteById, updateNote, deleteNote} = require('../processors')

const checkers = {
  objectIsValid(id) {
    return ObjectId.isValid(id)
  }
}

router.get('/notes', async ctx => {
  ctx.body = {
    notes: await getNotes()
  }

  console.log('notes page')
})

router.get('/note', async ctx => {
  ctx.body = {ok: 1}

  console.log('create note')
})

router.get('/note/:id', async ctx => {
  const id = ctx.params.id

  if (!checkers.objectIsValid(id)) {
    throwApiError(400, 'id is not valid')
  }

  const note = await getNoteById(id)

  if (note) {
    ctx.body = note
  } else {
    throwApiError(404, `note with id ${id} is not found`)
  }
})

router.post('/create-note', upload.none(), async ctx => {
  await validators.noteValidator(ctx.request.body)

  const result = await createNote(ctx.request.body)
  ctx.body = result

  console.log('create note completed')
})

router.put('/update/:id', upload.none(), async ctx => {
  await checkPermissionByRoles(ctx.user.roles, PERMISSIONS.updateNote)

  await validators.noteValidator(ctx.request.body)
  const {id} = ctx.request.body

  await updateNote(ctx.request.body)

  const note = await getNoteById(id)

  ctx.body = {note}
})

router.delete('/note/:id', async ctx => {
  const id = ctx.params.id

  if (!checkers.objectIsValid(id)) {
    throwApiError(400, `id is not valid`)
  }

  await deleteNote(id)

  ctx.body = {id}
})
