const mongoose = require('mongoose');
const password = process.argv[2];

if (process.argv.length === 3) {
    console.log('Modo consulta');
} else if (process.argv.length === 5) {
    console.log('Modo agregar');
} else {
    console.log('Consultar: node mongo.js <password>');
    console.log('Agregar:   node mongo.js <password> [nombre] [telefono]');
    process.exit(1);
}

const url = `mongodb+srv://JRZM:${password}@cluster0.ahgqfzb.mongodb.net/?appName=appAgenda`;

mongoose.set('strictQuery', false);
mongoose.connect(url);

const agendaSchema = new mongoose.Schema({
    content: String,
    important: String,
});

const Agenda = mongoose.model('Agenda', agendaSchema);

if (process.argv.length === 5) {
    const name = process.argv[3];
    const number = process.argv[4];

    if (!name.trim()) {
        console.log("Error: El nombre no puede estar vacío.");
        console.log("Agregar: node mongo.js <password> [nombre] [telefono]");
        process.exit(1);
    }

    if (!number.trim()) {
        console.log("Error: El número no puede estar vacío.");
        console.log("Agregar: node mongo.js <password> [nombre] [telefono]");
        process.exit(1);
    }

    const agenda = new Agenda({
        content: name,
        important: number,
    });

    agenda.save().then(() => {
        console.log(`added ${name} number ${number} to phonebook`);
        mongoose.connection.close();
    });

    return;
}

if (process.argv.length === 3) {
    Agenda.find({}).then(result => {
        console.log('phonebook:');
        result.forEach(n => {
            console.log(`${n.content} ${n.important}`);
        });
        mongoose.connection.close();
    });
}
