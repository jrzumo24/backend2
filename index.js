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

// Variables de entorno
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://JRZM:Pistache24@cluster0.ahgqfzb.mongodb.net/appAgenda'
const PORT = process.env.PORT || 3001

console.log('Port:', PORT)
console.log('MongoDB URI present:', !!MONGODB_URI)

mongoose.set('strictQuery', false)
console.log('Connecting to MongoDB...')
mongoose.connect(MONGODB_URI)
   .then(() => {
    console.log('✅ Connected to MongoDB')
   })
   .catch(error => {
    console.log('❌ Error connecting to MongoDB:', error.message)
   })

// Importar el modelo
const Person = require('./models/person')

// Funciones de transformación (API ↔ MongoDB)
const toApiResponse = (person) => ({
    id: person.id,
    name: person.content,     // content → name
    number: person.important  // important → number
})

const toMongoData = (apiData) => ({
    content: apiData.name,    // name → content
    important: apiData.number // number → important
})

// GET all persons
app.get('/api/persons', (request, response, next) => {
    Person.find({})
        .then(persons => {
            const transformed = persons.map(toApiResponse)
            response.json(transformed)
        })
        .catch(error => next(error))
})

// GET info
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

// GET single person
app.get('/api/persons/:id', (request, response, next) => {
    Person.findById(request.params.id)
        .then(person => {
            if (person) {
                response.json(toApiResponse(person))
            } else {
                response.status(404).json({ error: 'person not found' })
            }
        })
        .catch(error => next(error))
})

// DELETE person
app.delete('/api/persons/:id', (request, response, next) => {
    Person.findByIdAndDelete(request.params.id)
        .then(() => {
            response.status(204).end()
        })
        .catch(error => next(error))
})

// POST new person
app.post('/api/persons', (request, response, next) => {
    const body = request.body
    console.log('📝 POST request body:', body)

    if (!body.name) {
        return response.status(400).json({ error: 'name is missing' })
    }

    if (!body.number) {
        return response.status(400).json({ error: 'number is missing' })
    }

    // Buscar por content (que guarda el nombre)
    Person.findOne({ content: body.name })
        .then(existingPerson => {
            if (existingPerson) {
                return response.status(400).json({ error: 'name must be unique' })
            }

            const person = new Person(toMongoData(body))
            return person.save()
        })
        .then(savedPerson => {
            console.log('✅ Person saved:', savedPerson)
            response.json(toApiResponse(savedPerson))
        })
        .catch(error => next(error))
})

// PUT update person
app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body
    console.log('🔄 PUT request:', { id: request.params.id, body })

    if (!body.name || !body.number) {
        return response.status(400).json({ error: 'name and number are required' })
    }

    Person.findByIdAndUpdate(
        request.params.id, 
        toMongoData(body), 
        { new: true, runValidators: true, context: 'query' }
    )
        .then(updatedPerson => {
            if (updatedPerson) {
                console.log('✅ Person updated:', updatedPerson)
                response.json(toApiResponse(updatedPerson))
            } else {
                console.log('❌ Person not found for update')
                response.status(404).json({ error: 'person not found' })
            }
        })
        .catch(error => next(error))
})

// Manejo de rutas no encontradas
const unknownEndpoint = (request, response) => {
    response.status(404).send({ error: 'unknown endpoint' })
}
app.use(unknownEndpoint)

// Manejo de errores
const errorHandler = (error, request, response, next) => {
    console.error('💥 ERROR:', error.message)

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

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Server running on port ${PORT}`)
})