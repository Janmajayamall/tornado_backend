const mongodb_room_queries = require("./../../mongodb_queries/room")
const {validator_wrapper, 
        create_room_validation, 
        toggle_follow_room_validation,
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

        async toggle_follow_room(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const toggle_follow_room_object = args.user_input
            //validating the input
            validator_wrapper(toggle_follow_room_validation(toggle_follow_room_object))

            //following the room
            const result = mongodb_room_queries.toggle_follow_room(context.db_structure, user_id, toggle_follow_room_object)
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
        },

        async bulk_follow_rooms(parent, args, context){
            console.log('dawdadadada')
            //authenticating the user
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const bulk_follow_room_object = args.user_input
            //TODO:validating the input
            console.log(bulk_follow_room_object,"athis")
            let result = await mongodb_room_queries.bulk_follow_rooms(context.db_structure, bulk_follow_room_object)
            console.log(result, "aws")
            return result            
        }   

    },

    Queries:{
        async get_rooms(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)
            
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //getting all the rooms
            const result = await mongodb_room_queries.get_rooms(context.db_structure, user_id, args.user_input)
            return result
        
        },

        async get_not_joined_rooms(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //getting all the rooms
            const result = await mongodb_room_queries.get_not_joined_rooms(context.db_structure, user_id)
            return result
        
        },

        async get_all_joined_rooms(parent, args, context){

            //authenticating the user
            const current_user_id = await verify_jwt(context.req_headers.authorization)
            
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            //extracting user_id from args
            let user_id = args.user_id
            //populating user _id
            if(!user_id){
                user_id = current_user_id
            }
            validator_wrapper(objectid_validation(user_id))

            //getting all the rooms
            const result = await mongodb_room_queries.get_all_joined_rooms(context.db_structure, user_id)
            return result
        
        },


        async get_all_created_rooms(parent, args, context){

            //authenticating the user
            const current_user_id = await verify_jwt(context.req_headers.authorization)
            
            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)
           
            //extracting user_id from args
            let creator_user_id = args.user_id
            //populating user _id
            if(!user_id){
                creator_user_id = current_user_id
            }
            validator_wrapper(objectid_validation(user_id))
            
            //getting all the rooms
            const result = await mongodb_room_queries.get_all_created_rooms(context.db_structure, creator_user_id, current_user_id)
            return result
        },

        async get_common_rooms(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //extract user_id arr & TODO: validate them 
            let user_ids = args.user_ids
            //pushing current user_id
            user_ids.push(user_id)

            //getting all the rooms
            const result = await mongodb_room_queries.get_common_rooms(context.db_structure, user_id, user_ids)
            return result
        },

        async get_room_demographics(parent, args, context){

            //authenticating the user
            const user_id = await verify_jwt(context.req_headers.authorization)

            //extracting room_id 
            const room_id = args.room_id
            //validating room_id
            validator_wrapper(objectid_validation(room_id))

            const result = await mongodb_room_queries.get_room_demographics(context.db_structure, room_id, user_id )
            return result
        }

    }
}