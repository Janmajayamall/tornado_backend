const {ObjectID} = require ("mongodb")
const {UserInputError} = require("apollo-server-express")


// users queries/mutations

function user_register_validation(user_object){

    const errors = {}

    if (user_object.email.trim() === ""){
        errors.email = "email must not be empty"
    }else{
        const email_regex = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
        if (!user_object.email.match(email_regex)){
            errors.email = "please enter a vaid email id"
        }
    }

    if (user_object.username.trim() === ""){
        errors.username = "username must not be empty"
    }else if(user_object.username.length > 150){
        errors.username = "please choose a smaller username (username cannot be longer than 150 chars)"
    }

    if (user_object.password.trim() === ""){
        errors.password = "password must not be empty"
    }else if(user_object.password.length > 50 || user_object.password.length < 8){
        errors.password = "password length should in range 8 to 50 (inclusive)"
    }

    if (user_object.dob.trim() === ""){

        try{
            let result = date_validation(user_object.dob.trim())
        }catch(e){
            errors.dob = "date of birth must not be empty"
        }    
    }else {
        var date = Date.parse(user_object.dob)
        if (isNaN(date)){
            errors.dob = "dob must be ISOString"
        }
    }

    if (user_object.avatar.trim() == ""){
        error.avatar = "avatar url must not be empty"
    }// TODO: Add verification for URL using regex

    return {
        errors,
        valid: Object.keys(errors).length<1
    }

    }
        
function user_login_validation(user_object){

    const errors = {}

    if (user_object.email.trim() === ""){
        errors.email = "email must not be empty"
    }else{
        const email_regex = /^([0-9a-zA-Z]([-.\w]*[0-9a-zA-Z])*@([0-9a-zA-Z][-\w]*[0-9a-zA-Z]\.)+[a-zA-Z]{2,9})$/;
        if (!user_object.email.match(email_regex)){
            errors.email = "please enter a vaid email id"
        }
    }

    return {
        errors,
        valid: Object.keys(errors).length<1
    }
    
}

//end

// rooms queries/mutations

function create_room_validation(object){

    const errors = {}

    if(object.name.trim() === ""){
        errors.name="name must not be empty"
    }else if(object.length>150){
        errors.name="please choose a shorted name (room name must not be more than 150 characters)"
    }

    if(object.creator_id.trim() === ""){
        errors.creator_id = "creator_id must not be empty"
    }else if(!is_valid_objectid(object.creator_id)){
        errors.creator_id = "creator_id is not a valid ObjectID"
    }
    
    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

function follow_room_validation(object){

    const errors = {}

    if(object.room_id.trim() === ""){
        errors.room_id="room_id must not be empty"
    }else if(!is_valid_objectid(object.room_id)){
        errors.room_id = "room_id is not a valid ObjectID"
    }

    if(object.follower_id.trim() === ""){
        errors.follower_id="follower_id must not be empty"
    }else if(!is_valid_objectid(object.follower_id)){
        errors.follower_id = "follower_id is not a valid ObjectID"
    }


    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

function unfollow_room_validation(object){

    return follow_room_validation(object)

}

//end

//room_posts queries/mutations

function create_room_post_validation(object){

    errors = {}

    if(object.creator_id.trim() === ""){
        errors.creator_id = "creator_is must not be empty"
    }else if(!is_valid_objectid(object.creator_id)){
        errors.creator_id = "creator_id is not a valid ObjectID"
    }

    if(object.room_ids.length === 0){
        errors.room_ids = "please provide at least one room_id"
    }else{
        object.room_ids.forEach((element, index) => {
            if (!is_valid_objectid(element)){
                if (!errors.room_ids){
                    errors.room_ids = `room_id at index:${index} is not valid ObjectID`
                }
                
            }
        });
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

function edit_room_post_validation(object){
    
    errors={}

    if(object.room_ids.length === 0){
        errors.rooms_id = "please provide at least one room_id"
    }else{
        object.room_ids.forEach((element, index) => {
            if (!is_valid_objectid(element)){
                errors.rooms_id = `room_id at index:${index} is not valid ObjectID`
                break
            }
        });
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }
}

function get_room_post_object_validation(object){

    errors = {}

    if (object.limit<1){
        errors.limit = "limit specified should be greater than 0 and is required"
    }

    if (object.room_post_cursor){

        try{
            let result = date_validation(object.room_post_cursor)
        }catch(e){
            errors.room_post_cursor = "room_post_cursor should be Date object in milliseconds"
        }

    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}





//end 


// likes queries/mutations

function create_like_validation(object){

    errors = {}

    if(object.user_id.trim() === ""){
        errors.user_id = "user_id must not be empty"
    }else if (!is_valid_objectid(object.user_id)){
        errors.user_id = "user_id is not valid ObjectID"
    }

    if(object.like_type.trim() === ""){
        errors.like_type = "like_type must not be empty"
    }else{

        if (!(["ROOM_POST", "COMMENT"].includes(object.like_type.trim()))){
            errors.like_type = `like type must be from ["ROOM_POST", "COMMENT"]`
        }
    }
    
    if (object.content_id.trim() === ""){
        errors.content_id = "content_id must not be empty"
    }else if(!is_valid_objectid(object.content_id)){
        errors.content_id = "content_id is not valid ObjectID"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }
}

function unlike_content_validation(object){

    return create_like_validation(object)

}

//end

// comments queries/mutations

function create_comment_validation(object){

    errors = {}

    if(object.user_id.trim() === ""){
        errors.user_id = "user_id must not be empty"
    }else if (!is_valid_objectid(object.user_id)){
        errors.user_id = "user_id is not valid ObjectID"
    }

    if(object.content_id.trim() === ""){
        errors.content_id = "content_id must not be empty"
    }else if (!is_valid_objectid(object.content_id)){
        errors.content_id = "content_id is not valid ObjectID"
    }

    if(object.content_type.trim() === ""){
        errors.content_type = "content_type must not be empty"
    }else if(!(["ROOM_POST"].includes(object.content_type.trim()))){
        errors.content_type = `content_type must be form ["ROOM_POST"]`
    }

    if(object.comment_body.trim() === ""){
        errors.comment_body = "comment_body must not be empty"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

function edit_comment_validation(object){

    errors = {}

    if (object.comment_body.trim() === ""){
        errors.comment_body = "comment_body must not be empty"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

//end

// general
function is_valid_objectid(object_id){

    return ObjectID(object_id)==object_id

}

function objectid_validation(object_id){

    errors = {}

    if(object_id.trim() === ""){
        error.object_id = "id passed in must not be empty"
    }else if(!is_valid_objectid(object_id))
        error.object_id = "id is not valid ObjectID"

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }   
}

function validator_wrapper(errors){

    if (!errors.valid){
        
        throw new UserInputError("Error", {
            errors: errors.errors
        })

    }

}

function date_validation(date_value){
    
    //points to note
    // 1. data_value should be in string format in milliseconds
    // 2. you can get the milliseconds by new Date().getTime()

    date_value = parseInt(date_value)

    //checking if date_value is NaN
    if (isNaN(date_value)){
        throw new Error("Not valid date")
    }

    date = new Date(date_value)

    if (date=="Invalid Date"){
        throw new Error("Not valid date")
    }
    
    return date
}


module.exports = {
    user_register_validation,
    user_login_validation,

    //room queries/mutations
    create_room_validation,
    follow_room_validation,
    unfollow_room_validation,

    //room_posts queries/mutations
    create_room_post_validation,
    edit_room_post_validation,
    get_room_post_object_validation,

    //likes queries/mutations
    create_like_validation, 
    unlike_content_validation,

    //comments queries/mutations
    create_comment_validation, 
    edit_comment_validation,

    //general
    objectid_validation,
    validator_wrapper


}
