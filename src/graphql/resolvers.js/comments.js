const mongodb_comments_queries = require("./../../mongodb_queries/comment")
const {create_comment_validation, edit_comment_validation, validator_wrapper, objectid_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {db_instance_validation} = require("./../../utils/general_checks")
const {verify_jwt} = require("./../../utils/authentication")

module.exports = {
    Mutation:{

        async create_comment(parent, args, context){
            console.log(args.user_input)
            //verifying jwt
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance in the context
            db_instance_validation(context.db_structure.main_db)

            const comment_object = args.user_input

            //validate the input
            validator_wrapper(create_comment_validation(comment_object))

            const result = await mongodb_comments_queries.create_comment(context.db_structure, comment_object)
            return result
        },

        async edit_comment(parent, args, context){

            //verifying jwt
            await (context.req_headers.authorization)

            //checking for db instance int the context
            db_instance_validation(context.db_structure.main_db)

            const edit_comment_object = args.user_input
            const comment_id = args._id

            //Validate the input
            validator_wrapper(edit_comment_validation(edit_comment_object))
            validator_wrapper(objectid_validation(comment_id))

            const result = await mongodb_comments_queries.edit_comment(context.db_structure, comment_id, edit_comment_object)
            return result
        },

        async deactivate_comment(parent, args, context){

            //verifying jwt
            await verify_jwt(context.req_headers.authorization)

            //checking for db instance int the context
            db_instance_validation(context.db_structure.main_db)
        
            const _id = args._id
            
            //validate the input id
            validator_wrapper(objectid_validation(_id))
            

            const result = await mongodb_comments_queries.deactivate_comment(context.db_structure, _id)
            return result 

        }
    },

    Query:{

        async get_post_comments(parents, args, context){

            //authenticating user request and identifying user_id
            const user_id = await verify_jwt(context.req_headers.authorization)

            //validating main_db instance
            db_instance_validation(context.db_structure.main_db)

            const comment_query_object = args.user_input
            //TODO: validate comment_query_object

            //getting the comment_object
            const result = await mongodb_comments_queries.get_post_comments(context.db_structure, comment_query_object)
            
            return result

        }

    }
}