require('dotenv').config()
const express = require('express')
const morgan = require('morgan')
const cors = require('cors')
const mongoose = require('mongoose')
const app = express()

app.use(express.json())
app.use(cors())
app.use(express.static('dist'))

morgan.token('body', (req) => {
  return req.method === 'POST' ? JSON.stringify(req.body) : ''
})
app.use(morgan(':method :url :status :res[content-length] - :response-time ms :body'))

const url = process.env.MONGODB_URI
mongoose.set('strictQuery', false)
console.log('connecting to', url)
mongoose.connect(url)
   .then(() => {
    console.log('connected to MongoDB')
   })
   .catch(error => {
    console.log('Error connecting to MongoDB', error.message)
   })

const Person = require('./models/person')

const transformToApi = (person) => ({
    id: person.id,
    name: person.content,    
    number: person.important 
})

const transformToMongo = (apiData) => ({
    content: apiData.name,    
    important: apiData.number 
})

app.get('/api/persons', (request, response, next) => {
    Person.find({})
        .then(persons => {
            const transformed = persons.map(transformToApi)
            response.json(transformed)
        })
        .catch(error => next(error))
})

app.get('/info', (request, response, next) => {
    Person.countDocuments({})
        .then(count => {
            const info = `
                <p>Phonebook has info for ${count} people</p>
                <p>${new Date()}</p>
            `
            response.send(info)
        })
        .catch(error => next(error))
})

app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(transformToApi(person))
            } else {
                response.status(404).json({ error: 'person not found' })
            }
        })
        .catch(error => next(error))
})

app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if (!body.name) {
        return response.status(400).json({ error: 'name is missing' })
    }

    if (!body.number) {
        return response.status(400).json({ error: 'number is missing' })
    }

    Person.findOne({ content: body.name })
        .then(existingPerson => {
            if (existingPerson) {
                return response.status(400).json({ error: 'name must be unique' })
            }

            const mongoData = transformToMongo(body)
            const person = new Person(mongoData)

            return person.save()
        })
        .then(savedPerson => {
            response.json(transformToApi(savedPerson))
        })
        .catch(error => next(error))
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    if (!body.name || !body.number) {
        return response.status(400).json({ error: 'name or number missing' })
    }

    const mongoData = transformToMongo(body)

    Person.findByIdAndUpdate(
        request.params.id, 
        mongoData, 
        { new: true, runValidators: true, context: 'query' }
    )
        .then(updatedPerson => {
            if (updatedPerson) {
                response.json(transformToApi(updatedPerson))
            } else {
                response.status(404).json({ error: 'person not found' })
            }
        })
        .catch(error => next(error))
})

const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

const errorHandler = (error, request, response, next) => {
    console.error('ERROR:', error.message)

    if (error.name === 'CastError') {
        return response.status(400).send({ error: 'malformatted id' })
    } else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
    } else if (error.code === 11000) { 
        return response.status(400).json({ error: 'name must be unique' })
    }

    next(error)
}
app.use(errorHandler)

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`)
})