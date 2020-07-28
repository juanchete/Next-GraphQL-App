const mongoose = require('mongoose');

const ClientesSchema = mongoose.Schema({

    nombre:{

        type: String,
        required: true,
        trim: true //Esto borra los espacios en blanco del formulario osea si pongo ' Juan ' eso es 'Juan'
    },
    apellido:{

        type: String,
        required: true,
        trim: true //Esto borra los espacios en blanco del formulario osea si pongo ' Juan ' eso es 'Juan'
    },
    empresa:{

        type: String,
        required: true,
        trim: true //Esto borra los espacios en blanco del formulario osea si pongo ' Juan ' eso es 'Juan'
    },
    email:{

        type: String,
        required: true,
        trim: true, //Esto borra los espacios en blanco del formulario osea si pongo ' Juan ' eso es 'Juan'
        unique: true
    },
    telefono:{
        type: String,
        trim: true
    },
    creado: {

        type: Date,
        default: Date.now()

    },
    vendedor:{
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Usuario'
    }
});

module.exports = mongoose.model('Cliente',ClientesSchema);