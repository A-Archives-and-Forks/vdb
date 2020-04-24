const { v5: uuidv5 } = require('uuid')

module.exports = ({ vtbs, linkSyntax, UUID_NAMESPACE }) => ({
  meta: { UUID_NAMESPACE, linkSyntax },
  vtbs: vtbs
    .map(({ name, object }) => ({ uuid: uuidv5(name, UUID_NAMESPACE), object }))
    .map(({ uuid, object }) => ({ uuid, object: { ...object, name: Object.entries(object.name || {}) } }))
    .map(({ uuid, object }) => ({ uuid, object: { ...object, accounts: Object.entries(object.accounts || {}) } }))
    .map(({ uuid, object }) => {
      const parsed = { uuid }
      parsed.type = object.type || 'vtuber'
      parsed.bot = !!object.bot
      parsed.accounts = []

      parsed.name = { extra: [] }
      object.name
        .map(([lang, name]) => typeof name === 'object' ? [lang, name] : [lang, [name]])
        .forEach(([lang, names]) => names.forEach(name => {
          if (parsed.name[lang]) {
            parsed.name.extra.push(name)
          } else {
            parsed.name[lang] = name
          }
        }))
      if (!parsed.name.default && (object.name[0] || [undefined])[0]) {
        parsed.name.default = (object.name[0] || [undefined])[0]
      }

      if (object.group) {
        parsed.group = uuidv5(object.group, UUID_NAMESPACE)
      } else if (parsed.type === 'group') {
        parsed.group = uuid
      }

      parsed.accounts
        .concat(...object.accounts
          .map(([platform, id]) => Array.isArray(id) ? [platform, id] : [platform, [id]])
          .map(([platform, ids]) => ids.map(id => ({ platform, id }))))
        .map(({ platform, id }) => typeof id === 'string' ? { platform, id: { id } } : { platform, id })
        .map(({ platform, id }) => ({ platform, object: { ...id, type: id.type || 'official' } }))
        .forEach(({ platform, object }) => parsed.accounts.push({ ...object, platform }))

      return parsed
    }),
})
