const User = require("../../models/User");
const { hashToken } = require("../../middlewares/tokenHash");
const sessions = require("../../services/sessions");
const express = require('express')
const route = express.Router()

/* Website / legacy logout (behind verifyJWT). It ends ONE session and nothing else:
 *   - a cookie/body token is the credential (the session it belongs to is revoked);
 *   - with no token, the session the access token was issued for (its `sid` claim) is revoked;
 *   - tokens from before sessions existed are cleared by their exact hash, as before.
 * Other devices of the same user stay signed in. Responses and cookie clearing are unchanged. Tokens and hashes are
 * never logged or returned. */
route.delete('/logout', async (req, res) => {
    try {
        // the app keeps its refresh token outside the cookie jar, so the signed-in caller's own session is accepted too
        const token = req?.cookies?.rt || req?.body?.token;
        if(!token && !req.user?.id) return res.status(200).send({message: "Already Logged Out!"})

        let revoked = false
        if(token) {
            revoked = await sessions.revokeByToken(token)
            if (!revoked && !sessions.parseToken(token)) {
                const [count] = await User.update({ refresh_token: "" }, { where: { refresh_token: hashToken(token) } })
                revoked = count > 0
            }
        } else if (req.user?.sid) {
            revoked = await sessions.revokeById(req.user.sid, req.user.id)
        }

        sessions.clearRefreshCookie(res)
        return res.status(200).send({message: revoked ? "Successfully Logged Out" : "Already Logged Out!"})
    } catch(error) {
        console.error("Logout failed:", error?.message)
        res.status(500).send({error: true, message: "Something went wrong"})
    }
})

module.exports = route
