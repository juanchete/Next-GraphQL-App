const mongoose = require('mongoose');

const ProductosSchema = mongoose.Schema({

    nombre:{

        type: String,
        required: true,
        trim: true //Esto borra los espacios en blanco del formulario osea si pongo ' Juan ' eso es 'Juan'
    },
    existencia: {
        type: Number,
        required: true,
        trim: true
    },
    precio:{
        type: Number,
        required: true,
        trim: true

    },
    creado: {

        type: Date,
        default: Date.now()

    }
});

ProductosSchema.index({ nombre: 'text'});

module.exports = mongoose.model('Producto',ProductosSchema);