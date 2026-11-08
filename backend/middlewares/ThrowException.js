const fs = require('fs');

const throwException = (e, req, res, files = []) => {

   const deleteFile = async (filePath) => {
      try {
         const fPath = `files${filePath}`
         if (fs.existsSync(fPath)) {
            fs.unlink(fPath, (err) => { })
         }
         return
      } catch (e) { }
   }

   if (files?.length > 0) {
      files?.map((fileLabel) => {
         const fls = req[fileLabel]
         if(fls) {
           fls?.map((file)=>{
            if(file?.filepath) {
               deleteFile(file?.filepath)
            }
         }) 
         }
      })
   }
   // Only deliberate, human-written messages reach the client. Database/driver errors (table, column, SQL) are logged
   // on the server and replaced by a neutral message.
   const name = String(e?.name || '')
   const isDbError = name.startsWith('Sequelize') && !['SequelizeValidationError', 'SequelizeUniqueConstraintError'].includes(name)
   if (e) console.error('Request failed:', name, e?.message)
   if (!isDbError && e?.errors?.length > 0 && e?.errors[0]?.message) {
      return res.json({ error: true, message: e?.errors[0]?.message })
   }
   else if (!isDbError && e?.message && !e?.sql && !e?.parent) {
      return res.send({ error: true, message: e?.message });
   }
   else {
      return res.json({ error: true, message: "Something went wrong" })
   }

}

module.exports = throwException