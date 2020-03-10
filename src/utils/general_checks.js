function db_instance_validation(db){

    if(!db.db_instance){
        throw new Error(`Database Error: ${db.name} instance is null`)
    }

}


module.exports = {
    db_instance_validation, 
}