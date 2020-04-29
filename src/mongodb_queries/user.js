const auth_utils = require("./../utils/authentication")
const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {DEFAULT_AVATAR, CLOUD_FRONT_URL} = require("./../utils/constants")
const {ObjectID} = require("mongodb")
const { delete_image_file } = require("./../utils/aws_operations")
const sgMail = require('@sendgrid/mail');
const bugsnap_client = require("./../../bugsnag/bugsnag")
const mongodb_room_queries = require("./room")

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
        let jwt = await auth_utils.issue_jwt(result_user)
        
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

        const follow_tornado = await mongodb_room_queries.follow_tornado(db_structure, result.user_id)

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
        let result = await auth_utils.verify_password_hash(user.hash, user_object.password)
        
        if (!result){
            throw new AuthenticationError("Incorrect password or email")
        }

        //Generate jwt
        let jwt = await auth_utils.issue_jwt(user)

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

async function edit_user_profile(db_structure, user_id, edit_user_profile){

    const final_edited_user_profile = {
        username:edit_user_profile.username, 
        name:edit_user_profile.name,
        bio:edit_user_profile.bio,
        three_words:edit_user_profile.three_words,
    }

    let new_avatar_insert = undefined
    //first check whether edit_user_profile contains avatar object or not
    if(edit_user_profile.avatar){

        //removing last avatar of the user, if any
        if(edit_user_profile.last_avatar_id){
            //getting file object
            let last_image_object = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.images).findOneAndDelete({"_id":ObjectID(edit_user_profile.last_avatar_id)})
            last_image_object=last_image_object.value //getting the document

            //deleting the image from s3
            const result_delete_image_s3 = await delete_image_file(last_image_object.image_name)

        }

        //create a new image object and then move forward
        let new_image_object_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.images).insertOne({
            ...edit_user_profile.avatar,
            status:"ACTIVE",
            timestamp: new Date(),
            last_modified: new Date()
        })
        new_image_object_result = get_insert_one_result(new_image_object_result)
        new_avatar_insert = new_image_object_result //referencing new_avatar_insert for later use

        //populate user_info new avatar
        final_edited_user_profile.avatar=new_image_object_result._id
        //populate final_edited_user_profile default_avatar to false
        final_edited_user_profile.default_avatar=false
    }

    const data = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).findOneAndUpdate({
                                                                                                                        "user_id":ObjectID(user_id)    
                                                                                                                        },{
                                                                                                                            $set:{
                                                                                                                                ...final_edited_user_profile,
                                                                                                                                last_modified:new Date()
                                                                                                                            }
                                                                                                                        }, {returnOriginal:false})
                                                                                                                        
    let user_info = data.value      

    //checking final_edited_user_profile
    if(new_avatar_insert!==undefined){
        // add to new avatar to user_info
        user_info.avatar = new_avatar_insert
    }else if(user_info.default_avatar===false){
        const avatar_object = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.images).findOne({"_id":user_info.avatar})
        user_info.avatar=avatar_object
    }

    //adding cdn url to avatar
    if(user_info.avatar){
        user_info.avatar.cdn_url=CLOUD_FRONT_URL
    }

    return user_info
    

}

async function block_user(db_structure, user_id, blocked_user_id){

    if(ObjectID(user_id).equals(ObjectID(blocked_user_id))){
        return false //you can't block yourself
    }

    //checking whether relation already exists or not
    const block_object = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.blocked_users).findOne({
        user_id:ObjectID(user_id),
        blocked_user_id:ObjectID(blocked_user_id),
        status:"ACTIVE"
    })

    if(block_object){
        return true
    }

    const block_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.blocked_users).insertOne({
        user_id:ObjectID(user_id),
        blocked_user_id:ObjectID(blocked_user_id),
        status:"ACTIVE",
        timestamp: new Date(),
        last_modified: new Date()
    })

    return true
}

async function unblock_user(db_structure, user_id, blocked_user_id){

    let result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.blocked_users).findOneAndDelete(
        {
            user_id:ObjectID(user_id),
            blocked_user_id:ObjectID(blocked_user_id)            
        }
    )

    return true
}

async function get_blocked_users(db_structure, user_id){
    
    let blocked_users = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.blocked_users).find({
        user_id:ObjectID(user_id),
        status:"ACTIVE"
    }).toArray()
    
    return blocked_users

}

async function get_user_info(db_structure, user_id, curr_user_id){
        //getting user info
        let user_info = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).aggregate([
            {$match: {user_id:ObjectID(user_id)}},
            {$lookup:{
                from:db_structure.main_db.collections.images,
                let:{image_id:"$avatar"},
                pipeline:[
                    {$match:{
                        $expr:{$eq:["$_id", "$$image_id"]}
                    }},
                    {$addFields:{
                        cdn_url:CLOUD_FRONT_URL
                    }}
                ],                        
                as:"avatar_dev"
            }},
            {$addFields:{
                avatar:{
                    $cond:{
                        if:{$eq:[{$size:"$avatar_dev"}, 0]},
                        then:null,
                        else:{$arrayElemAt: ["$avatar_dev", 0]}
                    }
                }
            }},
            {$project:{
                avatar_dev:0
            }}
        ]).toArray()

        if (user_info.length===0){
            throw new AuthenticationError("No such user exits")        
        }

        user_info = user_info[0]       

        //checking whether user is blocked or not
        if(ObjectID(user_id).equals(ObjectID(curr_user_id))){
            user_info.is_blocked=false
        }else{
            const user_blocked = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.blocked_users).findOne({
                user_id:ObjectID(curr_user_id),
                blocked_user_id:ObjectID(user_id),
                status:"ACTIVE"
            })
            if(user_blocked){
                user_info.is_blocked=true
            }else{
                user_info.is_blocked=false
            }
        }

        return user_info
}

async function get_user_info_small_list(db_structure, user_id, user_ids){

    // converting string ids to objectids
    const user_object_ids = []
    user_ids.forEach(element => {
        user_object_ids.push(ObjectID(element))
    });

    let user_info_list = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).aggregate([
        {$match: {user_id:{$in:user_object_ids}}},
        {$lookup:{
            from:db_structure.main_db.collections.images,
            let:{image_id:"$avatar"},
            pipeline:[
                {$match:{
                    $expr:{$eq:["$_id", "$$image_id"]}
                }},
                {$addFields:{
                    cdn_url:CLOUD_FRONT_URL
                }}
            ],                        
            as:"avatar_dev"
        }},
        {$addFields:{
            avatar:{
                $cond:{
                    if:{$eq:[{$size:"$avatar_dev"}, 0]},
                    then:null,
                    else:{$arrayElemAt: ["$avatar_dev", 0]}
                }
            },
            is_user:{
                $cond:{
                    if: {$eq:[ObjectID(user_id), "$user_id"]},
                    then:true, 
                    else:false
                }
            }
        }},
        {$project:{
            _id:1, 
            user_id:1, 
            username:1, 
            default_avatar:1,
            avatar:1,
            is_user:1
        }}
    ]).toArray()

    return user_info_list
}

async function check_email(db_structure, email){

    const user = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.users).findOne({email:email})

    if(user){
        return true
    }else{
        return false
    }

}

async function check_username(db_structure, username, user_id=undefined){

    const user = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).findOne({username:username})

    if(user){
        //check whether same user is request for their own username or not 
        if(user.user_id.equals(ObjectID(user_id))){
            return false
        }else{
            return true
        }
    }else{
        return false
    }

}

async function password_recovery_send_code(db_structure, email){

    const user = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.users).findOne({email:email})
    
    //if user exists, then send code to the email id. If not then return false
    if(user){

        const user_account = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.user_accounts).findOne({user_id:user._id})

        // generate verification code. In loop till we don't find a verification code that is not already in use, as verification codes are generated randomly
        let verification_code = undefined
        while(true){
            let temp_code = auth_utils.generate_password_verification_code()
            const veri_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.password_recovery_codes).findOne({verification_code:temp_code})
            if(!veri_check){
                verification_code=temp_code //when code does not exists in collection password_recovery_codes
                break
            }
        }
        
        //storing code in password_reset_codes collection
        const insert_code_op = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.password_recovery_codes).insertOne({
            createdAt:new Date(),
            user_id:ObjectID(user._id),
            verification_code:verification_code
        })

        sgMail.setApiKey(process.env.SENDGRID_API_KEY);

        const msg = {
            from:{
                "email":"tornado.helpdesk.in@gmail.com"
             },
            personalizations:[
                {
                   to:[
                        {
                            email:user.email
                        }
                   ],
                   dynamic_template_data:{
                      username:user_account.username,
                      verification_code:verification_code
                    }
                }
            ],
            template_id:"d-cbbbf6c844ed43ea9f3786f28b20884d" // template ID of the email
        }
         
        //sending the code to user's email id
        try {
            const response = await sgMail.send(msg);   
            return true     
        } catch (error) {
            if (error.response) {
                bugsnap_client.notify(error.response.body)
                console.error(error.response.body,"password_recovery_send_code function | user.js" )
            }
            throw new ApolloError("Send grid Error", error)
        }    
    }else{
        return false
    }
}

async function password_recovery_code_verification(db_structure, change_password_object){

    const verification_object = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.password_recovery_codes).findOne({verification_code:change_password_object.verification_code})

    if(verification_object){

        //change the password
        const hash = await auth_utils.generate_password_hash(change_password_object.password)
        if (hash === null){
            throw new ApolloError("hash generated is null")
        }

        //updating the password
        const update_users = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.users).findOneAndUpdate({
            "_id":ObjectID(verification_object.user_id)    
            },{
                $set:{
                    hash:hash,
                    last_modified:new Date()
                }
            }, {returnOriginal:false})

        return true 
    }else{
        //verification code has either expired or not valid
        return false 
    }

}

module.exports = {
    register_user,
    login_user,
    get_user_info,
    edit_user_profile,
    block_user,
    unblock_user,
    get_blocked_users,
    get_user_info_small_list,

    //registration checks
    check_email,
    check_username,
    password_recovery_send_code, //sending password recovery code
    password_recovery_code_verification
}