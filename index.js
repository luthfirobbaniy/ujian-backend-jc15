const express = require('express')
const cors = require('cors')
const bodyparser = require('body-parser')
const { movieRouter, userRouter } = require('./router')
const bearerToken = require("express-bearer-token")

// main app
const app = express()
const PORT = 2000

// apply middleware
app.use(cors())
app.use(bodyparser())
app.use(bearerToken())

app.use("/movies", movieRouter)
app.use("/user", userRouter)

// main route
const response = (req, res) => res.status(200).send('<h1>REST API JCWM-15</h1>')
app.get('/', response)

// bind to local machine
// const PORT = process.env.PORT || 2000
app.listen(PORT, () => console.log(`CONNECTED : port ${PORT}`))