const auth_utils = require("./../utils/authentication")
const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")

async function register_user(dbs,  user_object){

        //quering for checking whether user_object exists or not
        let email_check = await dbs.main_db.collection("users").findOne({"email":user_object.email})
        console.log(email_check, "email check") //TODO: Remove this
        if (email_check){
            throw new UserInputError("email already exists", {
                error:{
                    email:"email already taken"
                }
            })
        }

        //generating password hash
        const hash = await auth_utils.generate_password_hash(user_object.password)
        
        if (hash === null){
            throw new ApolloError("hash generated is null", {
                error:{
                    password: "Not able to generate hash for the password"
                }
            })
        }
        
        //query mongodb for registering the user
        const user_value = {
            email:user_object.email,
            hash:hash,
            timestamp: new Date().toISOString(),   //TODO: Change to new Date().toISOString(), after checking whats the difference off the net
            last_modified: new Date().toISOString()
        } //populating user_object for required fields 
        console.log("dawdw", user_value) //TODO:Remove
        let result_user = await dbs.main_db.collection("users").insertOne(user_value) //inserting into collection users
        console.log(result_user.doc, "user insert") //TODO: Remove this
        let user_id = result_user._id  // getting user_id from user collection 

        const user_account_value = {
            username:user_object.username,
            dob:user_object.dob,
            avatar:user_object.avatar,
            user_id:user_id,
            timestamp: new Date().toISOString(),
            last_modified: new Date().toISOString()

        } //populating user_account_object with user_id and other required fields
        let result_user_account = await dbs.main_db.collection("user_accounts").insertOne(user_account_value) // inserting into collection user_accounts
        // result_user_account = result_user_account.reponse //TODO: Catch the returned response
        console.log(result_user_account, "user_account insert") //TODO: Remove this
        return {
            ...result_user_account,
            email:result_user.email
        }
    
}

async function login_user(dbs, user_object){

        //finding corresponding user
        let user = await dbs.main_db.collection("users").findOne({"email":user_object.email})

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
        let user_info = await dbs.main_db.collection("user_accounts").findOne({user_id:user._id})

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