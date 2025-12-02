const mongoose = require('mongoose')
const personSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        unique: true,
        minlength: 3
    },
    number: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{2,3}-\d{6,}$/.test(v) || /^\d{8,}$/.test(v)
            },
            message: props => `${props.value} is not a valid phone number!`
        }
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