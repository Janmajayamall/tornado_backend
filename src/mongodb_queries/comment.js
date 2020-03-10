const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")

async function create_comment(db_structure, comment_object){

    //create comment_value for insertOne operation
    let comment_value = {
        ...comment_object,
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
        user_id:ObjectID(comment_object.user_id),
        content_id:ObjectID(comment_object.content_id)
    }
    let comment_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.comments).insertOne(comment_value)
    comment_res = get_insert_one_result(comment_res)
    return comment_res

}

async function edit_comment(db_structure,comment_id, edit_comment_object){

    //editing the comment
    let comment_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.comments).findOneAndUpdate({
                                                                                                                    "_id":ObjectID(comment_id)    
                                                                                                                    },{
                                                                                                                        $set:{
                                                                                                                            comment_body:edit_comment_object.comment_body,
                                                                                                                            status:"ACTIVE",
                                                                                                                            last_modified:new Date()
                                                                                                                        }
                                                                                                                    }, {returnOriginal:false})
                                                                                                                
    comment_res = comment_res.value
    return comment_res                                                                                                                    

}

async function deactivate_comment(db_structure, comment_id){

    //deactivating the comment
    let comment_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.comments).findOneAndUpdate({
                                                                                                                                    "_id":ObjectID(comment_id)    
                                                                                                                                    },{
                                                                                                                                        $set:{
                                                                                                                                            status:"NOT_ACTIVE",
                                                                                                                                            last_modified:new Date()
                                                                                                                                        }
                                                                                                                                    }, {returnOriginal:false})

    comment_res = comment_res.value
    return comment_res                                                                                                                                    
}

module.exports = {

    create_comment,
    edit_comment,
    deactivate_comment

}
