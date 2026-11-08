const verifyRoles = (roles) => {
   return async (req, res, next) => {
      try {
         const userId = req?.user?.id??0;
         const userPermissions = req?.user?.permissions??["Public Access"];
         const foundRoles = userPermissions?.filter(role => roles?.includes(role))
         if(foundRoles.length <= 0) {
            if(!roles.includes("Public Access")) {
                return res.status(401).send({error: true, message: "You are not authorized!"})
            }
         }
         next()
      } catch (err) {
         return res.status(401).send({error: true, message: "You are not authorized!"})
      }
   }
}

module.exports = verifyRoles