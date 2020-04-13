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
    }

    if (user_object.password.trim() === ""){
        errors.password = "password must not be empty"
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

function edit_profile_validation(user_object){

    const errors = {}

    if (user_object.username.trim() === ""){
        errors.username = "username must not be empty"
    }

    return {
        errors,
        valid: Object.keys(errors).length<1
    }

}

function password_change_with_code_validation(change_password_object){

    const errors = {}

    if(change_password_object.password.trim()===""){
        errors.password = "password must not be empty"
    }

    if(change_password_object.verification_code.trim()===""){
        errors.verification_code = "verification_code must not be empty"
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

    
    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

function toggle_follow_room_validation(object){

    const errors = {}

    if(object.room_id.trim() === ""){
        errors.room_id="room_id must not be empty"
    }else if(!is_valid_objectid(object.room_id)){
        errors.room_id = "room_id is not a valid ObjectID"
    }

    if(object.status==""){
        errors.status="status must not empty. Should be either ACTIVE or NOT_ACTIVE"
    }else if(!(["ACTIVE", "NOT_ACTIVE"].includes(object.status.trim()))){
        errors.status="status should be either ACTIVE or NOT_ACTIVE"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

function bulk_follow_room_validation(bulk_follow_room){

    const errors = {}

    if(bulk_follow_room.length===0){
        return{
            errors,
            valid:true
        }
    }

    bulk_follow_room.forEach(follow_object => {
        const res_room = is_valid_objectid(follow_object.room_id)
        const res_follower_id = is_valid_objectid(follow_object.follower_id)

        if(!res_room || !res_follower_id){
            errors.bulk_follow_room_input = `follower_id or room_id must be object_ids`
        }

    })

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

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
    }else if(!(["ROOM_POST", "ROOM_CAPTION_POST"].includes(object.post_type.trim()))){
        errors.post_type = `post_type must be any value from ["ROOM_POST", "ROOM_CAPTION_POST"]`
    }

    if(object.image){
        if(!(object.image.image_name && object.image.width && object.image.height)){
            errors.image = "image must be an object with properties: image_name, width, height"
        }
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

function get_post_comments_validation(comment_query_object){

    const errors = {}

    if(comment_query_object.content_id.trim() ===""){
        errors.content_id = "content_id must not be empty"
    }else{
        if(!is_valid_objectid(comment_query_object.content_id)){
            errors.content_id = "content_id must be object_id"
        }
    }

    if(comment_query_object.content_type.trim()===""){
        errors.content_type =  "content_type must not be empty"
    }


    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

//end

// captions queries/mutations
function create_caption_validation(create_caption_object){

    const errors = {}

    if(create_caption_object.post_id.trim()===""){
        errors.post_id = "post_id must not be empty"
    }else{
        if(!is_valid_objectid(create_caption_object.post_id)){
            errors.post_id = "post_id must be object_id"
        }
    }

    if(create_caption_object.description.trim()===""){
        errors.description = "description must not be empty"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }
    
}

//end

// votes queries/mutations
function toggle_vote_validation(vote_object){

    const errors = {}

    if(vote_object.content_id.trim()===""){
        errors.content_id="content_id must not be empty"
    }else{
        if(!is_valid_objectid(vote_object.content_id)){
            errors.content_id="content_id must be objectId"
        }
    }

    if(!(["UP", "DOWN"].includes(vote_object.vote_type))){
        errors.vote_type="vote_type must be UP or DOWN"
    }

    if(!(["CAPTION"].includes(vote_object.content_type))){
        errors.content_type="content_type must be CAPTION"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }

}

//end

// aws_operations

function get_image_url_validation(image_object){

    const errors = {}

    if(image_object.file_name===""){
        errors.file_name="file_name must not be empty"
    }

    if(image_object.file_mime===""){
        errors.file_mime="file_mime must not be empty"
    }

    return {
        errors, 
        valid: Object.keys(errors).length<1
    }    
}

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

//end



module.exports = {
    user_register_validation,
    user_login_validation,
    edit_profile_validation,
    password_change_with_code_validation,

    //room queries/mutations
    create_room_validation,
    toggle_follow_room_validation,
    bulk_follow_room_validation,

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
    get_post_comments_validation,

    //captions queries/mutations
    create_caption_validation,

    //votes queries/mutations
    toggle_vote_validation,

    //aws operations
    get_image_url_validation,

    //general
    objectid_validation,
    validator_wrapper


}
