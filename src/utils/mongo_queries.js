
function get_insert_one_result(response){
   return response.ops[0]
}

module.exports = {
   get_insert_one_result,
   
}