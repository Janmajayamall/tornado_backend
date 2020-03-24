const auth_utils = require("./../utils/authentication")
const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {DEFAULT_AVATAR, CLOUD_FRONT_URL} = require("./../utils/constants")
const {ObjectID} = require("mongodb")

async function register_user(db_structure,  user_object){

        //query for checking whether user_object exists or not
        let email_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.users).findOne({"email":user_object.email})
        if (email_check){
            throw new UserInputError(`emailId:${user_object.email} already exists`)
        }

        //generating password hash
        const hash = await auth_utils.generate_password_hash(user_object.password)
        
        if (hash === null){
            throw new ApolloError("hash generated is null")
        }
        // d
        //query mongodb for registering the user
        const user_value = {
            email:user_object.email,
            hash:hash,
            timestamp: new Date(),    
            last_modified: new Date()
        } //populating user_object for required fields 
        let result_user = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.users).insertOne(user_value) //inserting into collection users
        result_user = get_insert_one_result(result_user)

        let user_id = result_user._id  // getting user_id from user collection 
        let user_account_value = {
            username:user_object.username,
            age:user_object.age,
            user_id:user_id,
            timestamp: new Date(),
            last_modified: new Date(),
            name:user_object.name,
            three_words:user_object.three_words,
            bio:user_object.bio,
            default_avatar:user_object.default_avatar,
        } //populating user_account_object with user_id and other required fields

        //checking whether the avatar of the user is default or not
        let image_insert_output = undefined
        if (user_object.default_avatar===false){
            let image_object_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.images).insertOne({
                ...user_object.avatar,
                status:"ACTIVE",
                timestamp: new Date(),
                last_modified: new Date()
            })
            image_object_result = get_insert_one_result(image_object_result)
            image_insert_output = image_object_result
            user_account_value.avatar = image_object_result._id
        }

        let result_user_account = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).insertOne(user_account_value) // inserting into collection user_accounts
        result_user_account = get_insert_one_result(result_user_account)

        //Generate jwt
        let jwt = auth_utils.issue_jwt(result_user)

        //generating the response and populating with the avatar object
        let result = {
            ...result_user_account,
            email:result_user.email,
            jwt:jwt,
        }

        if(image_insert_output!==undefined){
            //adding image object to the result and also adding the cdn parameter
            result.avatar = {
                ...image_insert_output,
                cdn_url:CLOUD_FRONT_URL
            }
        }

        return result

}

async function login_user(db_structure, user_object){

        //finding corresponding user
        let user = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.users).findOne({"email":user_object.email})

        //checking whether user exists
        if (!user){
            throw new UserInputError("User with emailId does not exists", {
                error:{
                    email: "email does not exists"
                }
            })
        }
        
        //verifying password
        let result = auth_utils.verify_password_hash(user.hash, user_object.password)
        if (!result){
            throw new AuthenticationError("Incorrect password or email")
        }

        //Generate jwt
        let jwt = auth_utils.issue_jwt(user)

        //getting user info
        let user_info = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).findOne({user_id:user._id})

        //getting the user avatar if default_avatar is false
        if (user_info.default_avatar===false){
            let image_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.images).findOne({_id:user_info.avatar})
            image_result.cdn_url = CLOUD_FRONT_URL
            user_info.avatar=image_result
        }

        return{
            ...user_info,
            jwt:jwt,
            email:user.email
        }

}


module.exports = {
    register_user,
    login_user
}