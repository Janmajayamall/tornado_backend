const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")

async function create_like(db_structure, like_object){

    //checking whether like_object already exists or not
    //Note: like is uniquely identified using: user_id, content_id, like_type

    let like_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).findOne({"user_id":ObjectID(like_object.user_id),
                                                                                                                        "content_id":ObjectID(like_object.content_id),
                                                                                                                        "like_type":like_object.like_type
                                                                                                                        })

    if (like_check){

        //checking the status of like_check object
        if (like_check.status="NOT_ACTIVE"){

            //reactivate the like_check object
            const reactive_like_res = await reactive_like_content(db_structure, like_object)
            return reactive_like_res

        }else{

            //return the like_check object
            return like_check

        }
    }

    //creating a new like_object
    const like_value = {
        ...like_object,
        status:"ACTIVE",
        timestamp:new Date(),
        last_modified:new Date()
    }
    let like_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).insertOne(like_value)
    like_res = get_insert_one_result(like_res)
    return like_res
}

async function unlike_content(db_structure, like_object){

    //updating the status of the like object to "NOT_ACTIVE"
    //Note: like is uniquely identified using: user_id, content_id, like_type
    let like_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).findOneAndUpdate({
                                                                                                                                user_id:ObjectID(like_object.user_id),
                                                                                                                                content_id:ObjectID(like_object.content_id),
                                                                                                                                like_type:like_object.like_type

                                                                                                                            }, {
                                                                                                                                $set:{
                                                                                                                                    status:"NOT_ACTIVE",
                                                                                                                                    last_modified:new Date()
                                                                                                                                }
                                                                                                                            }, { returnNewDocument:true})

    like_res = like_res.value

    return like_res
}

async function reactive_like_content(db_structure, like_object){

    //updating the status of the like object to "NOT_ACTIVE"
    //Note: like is uniquely identified using: user_id, content_id, like_type
    let like_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.likes).findOneAndUpdate({
                                                                                                                                user_id:ObjectID(like_object.user_id),
                                                                                                                                content_id:ObjectID(like_object.content_id),
                                                                                                                                like_type:like_object.like_type

                                                                                                                            }, {
                                                                                                                                $set:{
                                                                                                                                    status:"ACTIVE",
                                                                                                                                    last_modified:new Date()
                                                                                                                                }
                                                                                                                            }, { returnNewDocument:true})

    like_res = like_res.value

    return like_res
}



module.exports = {

    create_like,
    unlike_content,
    reactive_like_content

}
