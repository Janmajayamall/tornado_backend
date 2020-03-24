const mongodb_comments_queries = require("./../../mongodb_queries/comment")
const {create_comment_validation, edit_comment_validation, validator_wrapper, objectid_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {db_instance_validation} = require("./../../utils/general_checks")
const {verify_jwt} = require("./../../utils/authentication")
const {get_signed_url_put_object} = require("./../../utils/aws_operations")


module.exports = {
    Mutation:{

    },

    Query:{

        async get_image_upload_url(parent, args, context){      

            await verify_jwt(context.req_headers.authorization)

            const image_object = args.user_input
            //TODO: validate image_object

            try{
                const url = await get_signed_url_put_object(image_object.file_name, image_object.file_mime)
                return url
            }catch(e){
                throw new Error("AWS S3 not able to obtain presigned url")
            }
        }   

    }
}