const {throwApiError} = require('../utils')
const {getDb} = require('../db')

exports.getRolesPermissions = async (roles) => {
    const db = getDb()
    const userRoles = await db.collection(`roles`).find({key: {$in: roles}}).toArray()
    const userPermissions = userRoles.flatMap(role => role.permissions)
    return [...new Set(userPermissions)]
}

exports.checkPermissionByRoles = async (roles, permission) => {
    const errorMessage = 'permission denied (you cannot modify the note)'
    const userPermissions = await exports.getRolesPermissions(roles)

    if (!userPermissions.length > 0 || !userPermissions.includes(permission)) {
        throwApiError(403, errorMessage)
    }

    return true
}
