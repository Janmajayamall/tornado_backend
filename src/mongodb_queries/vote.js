const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")

async function toggle_vote(db_structure, user_id, vote_object){

    //checking whether a vote already exists or not 
    let vote_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.votes).findOne({
        creator_id:ObjectID(user_id),
        content_id:ObjectID(vote_object.content_id),
        content_type:vote_object.content_type
    })

    if(vote_check){ //vote already exists; toggle it
        
        let vote_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.votes).findOneAndUpdate(
            {
                creator_id:ObjectID(user_id),
                content_id:ObjectID(vote_object.content_id),
                content_type:vote_object.content_type
            }, 
            {
                $set:{
                    status:"ACTIVE",
                    vote_type:vote_object.vote_type,
                    last_modified:new Date()
            }
        }, { returnOriginal:false})
        vote_res=vote_res.value
        return vote_res
    } 

    //vote_object does not already exists, create one
    const new_vote_object = {
        ...vote_object,
        creator_id:ObjectID(user_id),
        content_id:ObjectID(vote_object.content_id),
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE"
    }
    const vote_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.votes).insertOne(new_vote_object)
    return get_insert_one_result(vote_res)
}




module.exports = {

    toggle_vote

}
