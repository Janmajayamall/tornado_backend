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
        errors.dob = "date of birth must not be empty"
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


module.exports = {
    user_register_validation,
    user_login_validation
}
