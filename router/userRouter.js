const express = require("express")  
const { db, query } = require('../database')
const { createJWTToken, checkToken } = require("../helpers")

const router = express.Router()

router.post('/register', async (req, res) => {
    const { username, email, password } = req.body
    const uid = Date.now()
    
    if(username){
        if(username.split("").length < 6) return res.status(401).send("Username invalid")
    }
    
    const emailRx = /^(([^<>()[\]\.,;:\s@\"]+(\.[^<>()[\]\.,;:\s@\"]+)*)|(\".+\"))@(([^<>()[\]\.,;:\s@\"]+\.)+[^<>()[\]\.,;:\s@\"]{2,})$/i
    const emailTest = emailRx.test(email)

    if(emailTest === false) {
        return res.status(401).send("Email invalid")
    }

    const passRx = /^(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{6,}$/
    const passTest = passRx.test(password)
    
    if(passTest === false) {
        return res.status(401).send("Password invalid")
    }

    const sql = `
        INSERT INTO users (uid, username, email, password, role, status)
        VALUES (${uid}, '${username}', '${email}', '${password}', 2, 1)`

    try {
        await query(sql)

        const getSql =`
            SELECT
                id,
                uid,
                username,
                email,
                role,
                status
            FROM users 
            WHERE uid = '${uid}'`

        const getData = await query(getSql)
        const responseData = { ...getData[0] }

        const dataEncrypt = {
            uid: responseData.uid,
            role: responseData.role
        }

        const token = createJWTToken(dataEncrypt)
        responseData.token = token

        const resOut = {
            id: responseData.id,
            uid: responseData.uid,
            username: responseData.username,
            email: responseData.email,
            token: responseData.token
        }

        res.status(200).send(resOut)
    }
    catch(err) {
        res.status(500).send(err)
    }
})

router.post('/login', async (req, res) => {
    const { user, password } = req.body

    const sql =`
        SELECT
            id,
            uid,
            username,
            email,
            role,
            status
        FROM users 
        WHERE password = '${password}' AND (username = '${user}' OR email = '${user}') AND status = 1`

    try{
        const data = await query(sql)

        if(data.length === 0) {
            return res.status(404).send({
                message: "User not found"
            })
        }

        const responseData = { ...data[0] }

        const dataEncrypt = {
            uid: responseData.uid,
            role: responseData.role
        }

        const token = createJWTToken(dataEncrypt)
        responseData.token = token

        const resOut = {
            id: responseData.id,
            uid: responseData.uid,
            username: responseData.username,
            email: responseData.email,
            status: responseData.status,
            role: responseData.role,
            token: responseData.token
        }

        res.status(200).send(resOut)
    }
    catch(err) {
        res.status(500).send(err)
    }
})

router.patch('/deactive', checkToken, async (req, res) => {
    const {uid, role} = req.user

    try{
        const getData = await query(`SELECT * FROM users WHERE uid = ${uid} AND status = 1`)

        if(getData.length === 0) {
            return res.status(404).send({
                message: "Users not found"
            })
        }

        const editSql = `
            UPDATE users SET status = 2
            WHERE id = ${getData[0].id}`

        await query(editSql)

        res.status(200).send({
            uid: `${uid}`,
            status: 'deactive'
        })
    }
    catch(err) {
        res.status(500).send(err)
    }
})

router.patch('/activate', checkToken, async (req, res) => {
    console.log(req.user)
    const {uid, role} = req.user

    try{
        const getData = await query(`SELECT * FROM users WHERE uid = ${uid} AND status = 2`)

        if(getData.length === 0) {
            return res.status(404).send({
                message: "Users not found"
            })
        }

        const editSql = `
            UPDATE users SET status = 1
            WHERE id = ${getData[0].id}`

        await query(editSql)

        res.status(200).send({
            uid: `${uid}`,
            status: 'active'
        })
    }
    catch(err) {
        res.status(500).send(err)
    }
})

router.patch('/close', checkToken, async (req, res) => {
    const {uid, role} = req.user

    try{
        const getData = await query(`SELECT * FROM users WHERE uid = ${uid}`)

        if(getData.length === 0) {
            return res.status(404).send({
                message: "Users not found"
            })
        }

        const editSql = `
            UPDATE users SET status = 3
            WHERE id = ${getData[0].id}`

        await query(editSql)

        res.status(200).send({
            uid: `${uid}`,
            status: 'closed'
        })
    }
    catch(err) {
        res.status(500).send(err)
    }
})

module.exports = router