const mongodb_room_queries = require("./../../mongodb_queries/room")
const {validator_wrapper, 
        create_room_validation, 
        follow_room_validation, 
        unfollow_room_validation,
        objectid_validation,
        } = require("./../../utils/validator")
const {db_instance_validation,} = require("./../../utils/general_checks")
const {UserInputError} = require("apollo-server-express")
const {verify_jwt} = require("./../../utils/authentication")

module.exports = {
    Mutation:{
        async create_room(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const room_object = args.user_input

            //Validate create_room input
            validator_wrapper(create_room_validation(room_object))

            let result = await mongodb_room_queries.create_room(context.db_structure, room_object)
            return result
        },

        async deactivate_room(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //validate the id
            validator_wrapper(objectid_validation(args._id))

            let result = await mongodb_room_queries.deactivate_room(context.db_structure, args._id)

            
            return result
        },

        async follow_room(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const follow_room_object = args.user_input
            //validating the input
            validator_wrapper(follow_room_validation(follow_room_object))

            //following the room
            const result = mongodb_room_queries.follow_room(context.db_structure, follow_room_object)
            return result
        },

        async unfollow_room(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const unfollow_room_object = args.user_input
            //validating the input 
            validator_wrapper(unfollow_room_validation(unfollow_room_object))

            //following the room
            const result = await mongodb_room_queries.unfollow_room(context.db_structure, unfollow_room_object)
            return result
        },

        async reactivate_room(parent, args, context){

            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //validate the id
            validator_wrapper(objectid_validation(args._id))

            let result = await mongodb_room_queries.reactivate_room(context.db_structure, args._id)
            
            return result
        }



    },

    Queries:{
        async get_all_rooms(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)
            console.log(user_id)
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //getting all the rooms
            const result = await mongodb_room_queries.get_rooms(context.db_structure, user_id)
            return result
        
        },

        async get_not_joined_rooms(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)
            // console.log(user_id)
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //getting all the rooms
            const result = await mongodb_room_queries.get_not_joined_rooms(context.db_structure, user_id)
            return result
        
        },

        async get_all_joined_rooms(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)
            // console.log(user_id)
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //getting all the rooms
            const result = await mongodb_room_queries.get_all_joined_rooms(context.db_structure, user_id)
            return result
        
        },


    }
}