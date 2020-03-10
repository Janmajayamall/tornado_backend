const mongodb_comments_queries = require("./../../mongodb_queries/comment")
const {} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")

module.exports = {
    Mutation:{

        async create_comment(parent, args, context){

            //checking for db instance in the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //TODO: validate the input
            const comment_object = args.user_input

            const result = await mongodb_comments_queries.create_comment(context.db_structure, comment_object)
            return result
        },

        async edit_comment(parent, args, context){

            //checking for db instance int the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }

            //TODO: Validate the input
            const edit_comment_object = args.user_input
            const comment_id = args._id

            const result = await mongodb_comments_queries.edit_comment(context.db_structure, comment_id, edit_comment_object)
            return result
        },

        async deactivate_comment(parent, args, context){

            //checking for db instance int the context
            if (!context.db_structure.main_db.db_instance){
                throw new Error("Database Error: main_db instance is null")
            }
            
            //TODO: validate the input id
            const _id = args._id

            const result = await mongodb_comments_queries.deactivate_comment(context.db_structure, _id)
            return result 

        }
    }
}