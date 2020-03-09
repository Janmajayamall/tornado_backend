const {UserInputError, ApolloError, AuthenticationError} = require("apollo-server-express")
const {get_insert_one_result} = require("../utils/mongo_queries")
const {ObjectID} = require("mongodb")

async function create_room(db_structure, room_object){

    //checking whether room already exists or not
    let room_check = await db_structure.main_db.db_instance.collection(db_structure.main_db.collections.rooms).findOne({"name":room_object.name})
    if (room_check){

        //checking whether the room is NOT_ACTIVE
        if (room_check.status==="NOT_ACTIVE"){

            const reactive_res = await reactivate_room(db_structure, room_check._id.toString())
            return reactive_res

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

    return {
        ...room_res,
        timestamp:room_res.timestamp.toISOString(),
        last_modified:room_res.last_modified.toISOString()
    }

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
                                                                                                                }, { returnNewDocument:true})

    room_res = room_res.value
                                                                                                     
    return {
        ...room_res,
        timestamp:room_res.timestamp.toISOString(),
        last_modified:room_res.last_modified.toISOString()
    }

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
                                                                                                                }, { returnNewDocument:true})

    room_res = room_res.value                                                                                                        
                                                                                                                
    return {
        ...room_res,
        timestamp:room_res.timestamp.toISOString(),
        last_modified:room_res.last_modified.toISOString()
    }

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
                                                                                                                            }, { returnNewDocument:true})
            
            follow_res = follow_res.value
                                                                                                                            
            return {
                ...follow_res,
                timestamp:follow_res.timestamp.toISOString(),
                last_modified:follow_res.last_modified.toISOString()
            }                                                                                                                            

        }else{

            return {
                ...follow_check,
                timestamp:follow_check.timestamp.toISOString(),
                last_modified:follow_check.last_modified.toISOString()
            }

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
    return {
        ...follow_result,
        timestamp:follow_result.timestamp.toISOString(),
        last_modified:follow_result.last_modified.toISOString()
    }

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
                                                                                                                    }, { returnNewDocument:true})
  
    room_res = room_res.value
                                                                                                                    
    return {
        ...room_res,
        timestamp:room_res.timestamp.toISOString(),
        last_modified:room_res.last_modified.toISOString()

    }                                                                                                                    

}

module.exports = {
    create_room,
    deactivate_room,
    reactivate_room,
    follow_room,
    unfollow_room
}