const mongodb_comments_queries = require("./../../mongodb_queries/comment")
const {validator_wrapper, get_image_url_validation} = require("./../../utils/validator")
const {UserInputError} = require("apollo-server-express")
const {db_instance_validation} = require("./../../utils/general_checks")
const {verify_jwt} = require("./../../utils/authentication")
const {get_signed_url_put_object} = require("./../../utils/aws_operations")
const bugsnap_client = require("./../../../bugsnag/bugsnag")

module.exports = {
    Mutation:{

    },

    Query:{

        async get_image_upload_url(parent, args, context){      

            const image_object = args.user_input
            //validate image_object
            validator_wrapper(get_image_url_validation(image_object))

            try{
                const url = await get_signed_url_put_object(image_object.file_name, image_object.file_mime)
                return url
            }catch(e){
                bugsnap_client.notify(e)
                console.error(e, "get_image_upload_url function | aws_operations.js")
                throw new Error("AWS S3 not able to obtain presigned url")                
            }
        }   

    }
}