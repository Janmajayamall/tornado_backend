const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")

//mutations resolvers

async function create_room(db_structure, room_object){

    //checking whether room already exists or not
    let room_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOne({"name":room_object.name})
    if (room_check){

        //checking whether the room is NOT_ACTIVE
        if (room_check.status==="NOT_ACTIVE"){

            const reactivate_res = await reactivate_room(db_structure, room_check._id.toString())
            //making the person follow the room 
            const follow_res = await follow_room(db_structure, {room_id:reactivate_res._id, follower_id:room_object.creator_id})
            return reactivate_res

        }else{
            throw new UserInputError(`Room with name:${room_object.name} already exists`)
        }
    }

    //creating new room 
    let room_value = {
        ...room_object,
        creator_id:ObjectID(room_object.creator_id),
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE"
    }
    
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).insertOne(room_value)
    room_res = get_insert_one_result(room_res)
    const follow_res = await follow_room(db_structure, {room_id:room_res._id, follower_id:room_res.creator_id})

    return room_res

}

async function deactivate_room(db_structure, room_id){

    //updating the room with status:"NOT_ACTIVE"
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOneAndUpdate({
                                                                                                                    _id:ObjectID(room_id)    
                                                                                                                }, {
                                                                                                                    $set:{
                                                                                                                        status:"NOT_ACTIVE",
                                                                                                                        last_modified:new Date()
                                                                                                                    }
                                                                                                                }, { returnOriginal:false})

    room_res = room_res.value
                                                                                                     
    return room_res

}

async function reactivate_room(db_structure, room_id){

    //updating the room with status:"NOT_ACTIVE"
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOneAndUpdate({
                                                                                                                    _id:ObjectID(room_id)    
                                                                                                                }, {
                                                                                                                    $set:{
                                                                                                                        status:"ACTIVE",
                                                                                                                        last_modified:new Date()
                                                                                                                    }
                                                                                                                }, { returnOriginal:false})

    room_res = room_res.value                                                                                                        
                                                                                                                
    return room_res

}

async function follow_room(db_structure, follow_object){

    //TODO: check whether room id active or not

    //checking whether follow object already exists or not
    let follow_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOne({room_id:ObjectID(follow_object.room_id), follower_id:ObjectID(follow_object.follower_id)})
    if (follow_check){

        //checking whether the follow status is active or not
        if (follow_check.status==="NOT_ACTIVE"){

            //change status to ACTIVE again
            let follow_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOneAndUpdate({
                                                                                                                                _id:follow_check._id    
                                                                                                                            }, {
                                                                                                                                $set:{
                                                                                                                                    status:"ACTIVE",
                                                                                                                                    last_modified:new Date()
                                                                                                                                }
                                                                                                                            }, { returnOriginal:false})
            
            follow_res = follow_res.value
                                                                                                                            
            return follow_res                                                                                                                            

        }else{

            return follow_check
        }
    }
    
    //following the room
    let follow_value = {
        ...follow_object,
        room_id:ObjectID(follow_object.room_id),
        follower_id:ObjectID(follow_object.follower_id),
        timestamp:new Date(),
        last_modified:new Date(),
        status:"ACTIVE"
    }
    let follow_result = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).insertOne(follow_value)
    follow_result = get_insert_one_result(follow_result)
    return follow_result

}

async function unfollow_room(db_structure, follow_object){

    //updating the follow_room status to ACTIVE
    let room_res = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).findOneAndUpdate({
                                                                                                                        room_id:ObjectID(follow_object.room_id),
                                                                                                                        follower_id:ObjectID(follow_object.follower_id)    
                                                                                                                    }, {
                                                                                                                        $set:{
                                                                                                                            status:"NOT_ACTIVE",
                                                                                                                            last_modified:new Date()
                                                                                                                        }
                                                                                                                    }, { returnOriginal:false})
  
    room_res = room_res.value
                                                                                                                    
    return room_res
}

//queries resolvers

async function find_followed_rooms(db_structure, user_id){
    const room_objects = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.room_follows).find({follower_id:ObjectID(user_id)}).toArray()
    return room_objects

}



module.exports = {

    //mutations
    create_room,
    deactivate_room,
    reactivate_room,
    follow_room,
    unfollow_room,

    //queries
    find_followed_rooms

}