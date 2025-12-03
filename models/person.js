const mongoose = require('mongoose')

// ESQUEMA CORREGIDO
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
})

// TRANSFORMACIÓN A JSON
personSchema.set('toJSON', {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString()
    returnedObject.name = returnedObject.content      // content → name
    returnedObject.number = returnedObject.important  // important → number

    delete returnedObject._id
    delete returnedObject.__v
    delete returnedObject.content
    delete returnedObject.important
  }
})

// EXPORTAR MODELO (sin colección forzada)
module.exports = mongoose.model('Person', personSchema)
