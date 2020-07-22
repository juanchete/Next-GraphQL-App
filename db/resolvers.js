const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const bcryptjs = require('bcryptjs');
const jwt = require('jsonwebtoken');
require('dotenv').config({ path: 'variables.env'});

const crearToken = (usuario, secreta, expiresIn) =>{

    console.log(usuario);
    const {id,email,nombre,apellido} = usuario
    return jwt.sign( { id,email,nombre,apellido }, secreta, {expiresIn})

}


//Resolvers
const resolvers = {

    Query:{
        obtenerUsuario: async (_,{token})=>{
            const usuarioId = await jwt.verify(token,process.env.SECRETA)

            return usuarioId

        },
        obtenerProductos: async () =>{
            try {
                const productos = await Producto.find()
                return productos;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerProducto: async (_,{id}) => {
            //Revisar si existe el producto
            const producto = await Producto.findById(id)

            if (!producto) {
                throw new Error('Prudcto No Existe')
            }

            return producto;

        }
    },

    Mutation: {
        nuevoUsuario: async (_,{ input })=>{

            const { email, password} = input;

            //Revisar si esta registrado
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario){

                console.log('EL usuario ya existe en la BDD');
            }

            //Hashear Password
            const salt = bcryptjs.genSaltSync(10);
            input.password = await bcryptjs.hash(password, salt);

            //Guardarlo en la BDD
            try {
                const usuario = new Usuario (input);
                usuario.save()
                return usuario
            } catch (error) {
                console.log(error);
            }
        },

        autenticarUsuario: async (_,{input}) => {

            
            const {email, password} = input
            //Si el usuario existe
            const existeUsuario = await Usuario.findOne({email});

            if (!existeUsuario) {
                 throw new Error ('El usuario no esta en la BDD')
            }

            //REvisar si password es correcto
            const passwordCorrecto = await bcryptjs.compare( password, existeUsuario.password)
            if (!passwordCorrecto) {
                throw new Error ('El password es incorrecto')
           }

           //Crear token
           return {
               token: crearToken(existeUsuario, process.env.SECRETA, '24h')
        }
    },

    nuevoProducto: async (_,{input}) =>{
        try {
            const producto = new Producto (input);

            //Almacenar
            const resultado = await producto.save()

            return resultado
        } catch (error) {
            console.log(error);
        }
    },
    actualizarProducto: async (_,{id,input})=>{

        let producto = await Producto.findById(id)

            if (!producto) {
                throw new Error('Prudcto No Existe')
            }

            //guardarlo en la base de datos

            producto = await Producto.findByIdAndUpdate({_id: id}, input, {new: true}); //El true es para que si me guarde el beta

            return producto;


    },
    eliminarProducto: async (_,{id}) =>{
        let producto = await Producto.findById(id)

            if (!producto) {
                throw new Error('Prudcto No Existe')
            }

            //Eliminar
            await Producto.findOneAndDelete({_id: id});

            return 'Producto Eliminado'
    }
}
}

module.exports = resolvers;