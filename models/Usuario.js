const mongoose = require('mongoose');

const UsuariosSchema = mongoose.Schema({

    nombre:{

        type: String,
        required: true,
        trim: true //Esto borra los espacios en blanco del formulario osea si pongo ' Juan ' eso es 'Juan'
    },
    apellido:{

        type: String,
        required: true,
        trim: true

    },email:{

        type: String,
        required: true,
        trim: true,
        unique: true

    },password:{

        type: String,
        required: true,
        trim: true

    },creado: {

        type: Date,
        default: Date.now()

    }
});

module.exports = mongoose.model('Usuario',UsuariosSchema);