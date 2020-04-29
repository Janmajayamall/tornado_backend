const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const mongodb_user_queries = require("./user")



async function toggle_like(db_structure, user_id, like_object){

    let like_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).findOne(
        {
            user_id:ObjectID(user_id),
            content_id:ObjectID(like_object.content_id),
        })

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

async function get_likes_list(db_structure, user_id, content_id){

    // get users that liked the post
    const liked_list_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).find({
        content_id:ObjectID(content_id),
        status:"ACTIVE"
    }).toArray()

    // generating list for user_id
    const user_id_list = []
    liked_list_res.forEach(element => {
        user_id_list.push(element.user_id)
    });
    
    // getting type User_account_small for each account
    const user_info_small_list = await mongodb_user_queries.get_user_info_small_list(db_structure, user_id, user_id_list)
    return user_info_small_list
}


module.exports = {

    toggle_like,
    get_likes_list

}
