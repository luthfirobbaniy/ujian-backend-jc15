const express = require("express")  
const { db, query } = require('../database')
const { createJWTToken, checkToken } = require("../helpers")

const router = express.Router()

router.get("/get", async (req, res) => {
    let {status, location, time} = req.query

    let whereSql = `${status || location || time ? 'WHERE ' : ''}`

    if(status) {
        status = status.split("%")
        status = status[0] + " " + status[1]
        whereSql += `movie_status.status = '${status}' ${location || time ? 'AND ' : ''}`
    }
    if(location) {
        whereSql += `locations.location = '${location}' ${time ? 'AND ' : ''}`
    }
    if(time) {
        time = time.split("%")
        time = time[0] + " " + time[1]
        whereSql += `show_times.time = '${time}'`
    }

    const sql = `
        SELECT 
	        movies.name,
            movies.release_date,
            movies.release_month,
            movies.release_year,
            movies.duration_min,
	        movies.genre,
            movies.description,
	        movie_status.status,
            locations.location,
            show_times.time
        FROM schedules
        JOIN movies ON schedules.movie_id = movies.id
        JOIN movie_status ON movies.status = movie_status.id
        JOIN locations ON schedules.location_id = locations.id
        JOIN show_times ON schedules.time_id = show_times.id
        ${whereSql}
    `

    try{
        const data = await query(sql)

        if(data.length === 0) {
            return res.status(404).send({
                message: "Movie not found"
            })
        }

        res.status(200).send(data)
    }catch(err) {
        res.status(500).send(err)
    }
})

router.get("/get/all", async (req, res) => {
    const sql = `
        SELECT 
	        movies.name,
            movies.release_date,
            movies.release_month,
            movies.release_year,
            movies.duration_min,
	        movies.genre,
            movies.description,
	        movie_status.status,
            locations.location,
            show_times.time
        FROM schedules
        JOIN movies ON schedules.movie_id = movies.id
        JOIN movie_status ON movies.status = movie_status.id
        JOIN locations ON schedules.location_id = locations.id
        JOIN show_times ON schedules.time_id = show_times.id
    `

    try{
        const data = await query(sql)

        if(data.length === 0) {
            return res.status(404).send({
                message: "Movie not found"
            })
        }

        res.status(200).send(data)
    }catch(err) {
        res.status(500).send(err)
    }
})

router.post("/add", checkToken, async (req, res) => {
    const { name, genre, release_date, release_month, release_year, duration_min, description } = req.body
    const {uid, role} = req.user

    if(role !== 1){
        return res.status(401).send({message: "Admin Only"})
    }

    const insertSql = `
        INSERT INTO movies (name, release_date, release_month, release_year, duration_min, genre, description)
        VALUES ('${name}', ${release_date}, ${release_month}, ${release_year}, ${duration_min}, '${genre}', '${description}')`

    try{
        const insetData = await query(insertSql)

        const getData = await query(`SELECT * FROM movies WHERE id = ${insetData.insertId}`)

        const resOut = {
            id: getData[0].id,
            name: getData[0].name, 
            genre: getData[0].genre, 
            release_date: getData[0].release_date,
            release_month: getData[0].release_month,
            release_year: getData[0].release_year,
            duration_min: getData[0].duration_min,
            description: getData[0].description
        }

        res.status(200).send(resOut)
    }
    catch(err) {
        res.status(500).send(err)
    }
})

router.patch("/edit/:id", checkToken, async (req, res) => {
    const { id } = req.params
    const { status } = req.body
    const { uid, role } = req.user

    if(role !== 1){
        return res.status(401).send({message: "Admin Only"})
    }

    try{
        const getData = await query(`SELECT * FROM movies WHERE id = ${id}`)

        if(getData.length === 0) {
            return res.status(404).send({
                message: "Movie not found"
            })
        }

        const editSql = `
            UPDATE movies SET status = ${status}
            WHERE id = ${getData[0].id}`

        await query(editSql)

        const resOut = {
            id: getData[0].id,
            message: 'status has been changed'
        }

        res.status(200).send(resOut)
    }
    catch(err) {
        res.status(500).send(err)
    }
})

router.patch("/set/:id", checkToken, async (req, res) => {
    const { id } = req.params
    const { location_id, time_id } = req.body
    const { uid, role } = req.user

    if(role !== 1){
        return res.status(401).send({message: "Admin Only"})
    }

    try{
        const getData = await query(`SELECT * FROM movies WHERE id = ${id}`)

        if(getData.length === 0) {
            return res.status(404).send({
                message: "Movie not found"
            })
        }

        const insertSql = `
            INSERT INTO schedules (movie_id, location_id, time_id)
            VALUES (${getData[0].id}, ${location_id}, ${time_id})`

        const data = await query(insertSql)

        const resOut = {
            id: getData[0].id,
            message: 'schedule has been changed'
        }

        res.status(200).send(resOut)
    }
    catch(err) {
        res.status(500).send(err)
    }
})

module.exports = router