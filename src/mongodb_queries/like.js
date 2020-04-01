const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")


async function toggle_like(db_structure, user_id, like_object){
    console.log(like_object)
    let like_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).findOne(
        {
            user_id:ObjectID(user_id),
            content_id:ObjectID(like_object.content_id),
        })
    console.log(like_object, like_check)
    // if like object with same user_id, content_id
    if (like_check){

        // if the status is same, then no need to update
        if (like_check.status===like_object.status){
            return like_check
        }

        // when the status is not the same
        let like_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).findOneAndUpdate(
            {
                user_id:ObjectID(user_id),
                content_id:ObjectID(like_object.content_id),
            }, {
                $set:{
                    status:like_object.status,
                    last_modified:new Date()
                }
            }, { returnOriginal:false})
        
        return like_res.value //in findOneAndUpdate the update document is stored under object.value
    }

    //if the user is liking for the first time, create a new like object
    const like_value = {
        ...like_object,
        timestamp:new Date(),
        last_modified:new Date(),
        user_id:ObjectID(user_id),
        content_id:ObjectID(like_object.content_id)
    }
    let like_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).insertOne(like_value)
    like_res = get_insert_one_result(like_res)
    return like_res

}   




module.exports = {

    toggle_like

}
