const jwt = require("jsonwebtoken")

// Buat encrypt
const createJWTToken = (payload) => {
    return jwt.sign(payload, "kuncirahasia", {
        expiresIn: "24h"
    })
}

// Buat decrypt
const checkToken = (req, res, next) => {
    if(res.method !== "OPTIONS") {
        jwt.verify(req.token, "kuncirahasia", (err, decoded) => {
            if(err) {
                return res.status(401).send({
                    message: err.message,
                    status: "Unauthorized"
                })
            }

            req.user = decoded
            next()
        })
    }
}

module.exports = {
    createJWTToken,
    checkToken,
}