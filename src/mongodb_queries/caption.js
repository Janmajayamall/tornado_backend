const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")
const { get_user_info } = require("./user")

async function create_caption(db_structure, user_id,caption_object){

    const final_caption_object = {
        post_id:ObjectID(caption_object.post_id),
        description:caption_object.description,
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE",
        creator_id:ObjectID(user_id)
    }

    let caption_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.captions).insertOne(final_caption_object)
    caption_res = get_insert_one_result(caption_res)

    //setting up likes count & user_liked
    caption_res.likes_count=0
    caption_res.user_liked=false

    //creator_info
    const creator_info = await get_user_info(db_structure, user_id)
    caption_res.creator_info=creator_info     

    return caption_res
}





module.exports = {

    create_caption,

}
