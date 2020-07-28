const Usuario = require('../models/Usuario');
const Producto = require('../models/Producto');
const Cliente = require('../models/Cliente');
const Pedido = require('../models/Pedido');
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
        obtenerUsuario: async (_,{}, ctx)=>{
            return ctx.usuario;

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

        },
        obtenerClientes: async () => {
            try {
                const clientes = await Cliente.find({})
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerClientesVendedor: async (_,{input},ctx) => {
            try {
                const clientes = await Cliente.find({vendedor: ctx.usuario.id.toString()});
                return clientes;
            } catch (error) {
                console.log(error);
            }
        },
        obtenerCliente: async (_,{id},ctx) => {
            const cliente = await Cliente.findById(id);

            if (!cliente) {
                throw new Error ('Cliente no encontrado')
            }

            //Quin lo crea lo ve
            if(cliente.vendedor.toString() !== ctx.usuario.id){
                throw new Error ('No tienes las credenciales pana')
            }

            return cliente
        },
        obtenerPedidos: async  () => {
            try {
                const pedidos = await Pedido.find({})
                return pedidos
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedidosVendedor: async  (_,{},ctx) => {
            try {
                const pedidos = await Pedido.find({vendedor: ctx.usuario.id}).populate('cliente')
                return pedidos
            } catch (error) {
                console.log(error);
            }
        },
        obtenerPedido: async (_,{id},ctx) => {
            //Si pedido existe
            const pedido = await Pedido.findById(id)

            if (!pedido) {
                throw new Error ('El pedido no existe')
            }

            //Solo quien lo toma lo ve
            if (pedido.vendedor.toString() !== ctx.usuario.id) {
                throw new Error ('El vendedor no tomo el pedido')
            }

            //Retornar
            return pedido;
        },
        obtenerPedidosEstado: async (_,{estado},ctx) => {
            const pedidos = await Pedido.find({vendedor: ctx.usuario.id, estado});
            return pedidos;
        },
        mejoresClientes: async (_,{input}) => {
            const clientes = await Pedido.aggregate([
                {$match : {estado: "COMPLETADO"}},
                { $group : {
                    _id: "$cliente",
                    total: { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'clientes',
                        localField: '_id',
                        foreignField: "_id",
                        as: "cliente"
                    }
                },{
                    $limit: 5
                },
                {
                    $sort: { total : -1}
                }

            ]);

            return clientes
        },
        mejoresVendedores: async () => {
            const vendedores =await Pedido.aggregate([
                { $match : {estado: "COMPLETADO"}},
                { $group : {
                    _id: "$vendedor",
                    total: { $sum: '$total'}
                }},
                {
                    $lookup: {
                        from: 'usuarios',
                        localField: '_id',
                        foreignField: '_id',
                        as: 'vendedor'
                    }
                },
                {
                    $limit: 3
                },
                {
                    $sort: { total : -1}
                }
            ]);

            return vendedores;
        },
        buscarProducto: async (_,{texto}) => {

            const productos = await Producto.find({ $text: {$search: texto}})

            return productos;
        }
    },

    Mutation: {
        nuevoUsuario: async (_,{ input })=>{

            const { email, password} = input;

            //Revisar si esta registrado
            const existeUsuario = await Usuario.findOne({email});
            if (existeUsuario){

                throw new Error('EL usuario ya esta registrado en la BDD');
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
    },
    nuevoCliente: async (_, {input},ctx) =>{
        console.log(ctx);
        const { email } = input
        //Verificar si ya existe
        const cliente = await Cliente.findOne({ email });
        if (cliente) {
            throw new Error ('Ese cliente ya existe')
        }

        
        const nuevoCliente = new Cliente(input);
        //Asigna el vendedor
        nuevoCliente.vendedor = ctx.usuario.id;

        //Guardarlo en la BDD

        try {

            const resultado =await nuevoCliente.save()
            return resultado
            
        } catch (error) {
            console.log(error);       
        }

        


    },
    actualizarCliente: async (_,{id,input},ctx) => {
        //Verificar si existe
        let cliente = await Cliente.findById(id)

        if (!cliente) {
            throw new Error ('No existe este Cliente')
        }

        //Verificar si el vendedor es el que edita
        if (cliente.vendedor.toString() !== ctx.usuario.id) {
            throw new Error ('No eres el vendedor indicadol')
        }

        //guardar el cliente
        cliente = await Cliente.findOneAndUpdate({_id:id}, input, {new :true});
        return cliente
    },
    eliminarCliente : async (_,{id}, ctx) => {
        //REvisar si existe el cliente
        let cliente = await Cliente.findById(id)

        if (!cliente){
            throw new Error ("El cliente no existe")
        }

        //Verificar que lo borre el usaurio indicado
        if(cliente.vendedor.toString() !== ctx.usuario.id){
            throw new Error ("El usuario no tiene las credenciales para eliminarlo")
        }

        //Eliminarlo
        await Cliente.findOneAndDelete({_id: id})
        return "Cliente eliminado"
    },
    nuevoPedido: async (_,{input}, ctx) => {
        // Verificar si cliente existe
        const { cliente } = input

        let clienteExiste = await Cliente.findById(cliente);

        if (!clienteExiste) {
            throw new Error ('Ese cliente no existe')
        }

        //Verificar si cliente le corresponde
        if (clienteExiste.vendedor.toString() !== ctx.usuario.id) {
            throw new Error ('No tienes las credenciales')
        }

        //REvisar que el stock este disponible
        for await (const articulo of input.pedido ){
            const { id } = articulo;

            const producto = await Producto.findById(id);

            if (articulo.cantidad > producto.existencia) {
                throw new Error (`El articulo: ${producto.nombre} excede la cantidad disponible`);
            } else {
                //Restar cantidad a lo disponible
                producto.existencia = producto.existencia - articulo.cantidad;

                await producto.save();
            }
        }

        //Crear nuevo pedido
        const nuevoPedido = new Pedido(input);

        //Asignarle un vendedor
        nuevoPedido.vendedor = ctx.usuario.id;

        //Guardarlo en la BDD
        const resultado = await nuevoPedido.save()
        return resultado;
    },
    actualizarPedido: async (_,{id, input}, ctx) => {

        const {cliente} = input;

        //Verificar si el pedido existe
        const existePedido = await Pedido.findById(id);

        if (!existePedido) {
            throw new Error ("El pedido no existe")
        }

        //Verificar si cliente existe
        const existeCliente = await Cliente.findById(cliente);

        if (!existeCliente) {
            throw new Error ("El Cliente no existe")
        }


        //Verificar si cliente y pedido son del vendedor
        if (existeCliente.vendedor.toString() !== ctx.usuario.id) {
            throw new Error ("El Cliente no existe")
        }

        //Revisiar el stock
        if (input.pedido) {

            for await (const articulo of input.pedido ){
                const { id } = articulo;
    
                const producto = await Producto.findById(id);
    
                if (articulo.cantidad > producto.existencia) {
                    throw new Error (`El articulo: ${producto.nombre} excede la cantidad disponible`);
                } else {
                    //Restar cantidad a lo disponible
                    producto.existencia = producto.existencia - articulo.cantidad;
    
                    await producto.save();
                }
            }
            
        }
        
        //Guardar el pedido

        const resultado = await Pedido.findOneAndUpdate({_id: id}, input , {new: true});
        return resultado;
    },
    eliminarPedido: async (_,{id}, ctx) => {
        //Verificar si el pedido existe
        const pedido = await Pedido.findById(id);

        if (!pedido) {
            throw new Error ('El pedido no existe')
        }

        //Verificar si el vendedor es el que lo intenta borrar
        if (pedido.vendedor.toString() !== ctx.usuario.id) {
            throw new Error ('El vendedor no tiene las credenciales para borrar este pedido')
        }

        //Eliminar 

        await Pedido.findOneAndDelete({_id: id})
        return 'Pedido Eliminado'
    }
}
}

module.exports = resolvers;