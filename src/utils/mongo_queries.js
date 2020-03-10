const {ObjectID} = require("mongodb")


function get_insert_one_result(response){
   return response.ops[0]
}

function get_objectids_array(object_ids){
   let new_array = []
   object_ids.forEach(element => {
      new_array.push(ObjectID(element))
   });
   return new_array
}

module.exports = {
   get_insert_one_result,
   get_objectids_array
}