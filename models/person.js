const mongoose = require('mongoose')

//actualizacion 10

const personSchema = new mongoose.Schema({
    content: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    important: {
        type: String,
        required: true
        
    }
}, { collection: 'agendas' })

personSchema.set('toJSON', {
    transform: (document, returnedObject) => {
        returnedObject.id = returnedObject._id.toString()
        delete returnedObject._id
        delete returnedObject.__v
    }
})

module.exports = mongoose.model('Person', personSchema)