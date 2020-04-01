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
            errors.email = "please enter a valid email id"
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

    if (!(user_object.age === parseInt(user_object.age, 10))){
        errors.age = "age must not be empty, and should be Int"   
    }

    if(user_object.default_avatar==undefined){
        errors.default_avatar = "default_avatar must not be empty, and should be Boolean"   
    }

    if(user_object.default_avatar===false){
        if(!user_object.avatar){
            errors.avatar = "avatar must be an object, with properties file name, width, height"
        }
    }

    //TODO: add validation for three_words, name, bio, 



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
    }else if(object.length>75){
        errors.name="please choose a shorter name (room name must not be more than 75 characters)"
    }

    if(object.creator_id.trim() === ""){
        errors.creator_id = "creator_id must not be empty"
    }else if(!is_valid_objectid(object.creator_id)){
        errors.creator_id = "creator_id is not a valid ObjectID"
    }

    //TODO: validate the length of the short description as well
    
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

    if(object.post_type.trim() === ""){
        errors.post_type = "post_type must not be empty"
    }else if(!(["ROOM_POST"].includes(object.post_type.trim()))){
        errors.post_type = `post_type must be any value from ["ROOM_POST"]`
    }

    if(object.image){
        if(!(object.image.image_name && object.image.width && object.image.height)){
            errors.image = "image must be an object with properties: image_name, width, height"
        }
    }

    //TODO: Set limitations on characters for each string input

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

function get_user_profile_posts_validation(object){

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

    if (!is_valid_objectid(object.user_id)){
        error.user_id = "user_id should be a objectId"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}





//end 


// likes queries/mutations
function toggle_like_validation(object){

    errors={}
    
    
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
    get_user_profile_posts_validation,

    //likes queries/mutations
    toggle_like_validation,

    //comments queries/mutations
    create_comment_validation, 
    edit_comment_validation,

    //general
    objectid_validation,
    validator_wrapper


}
