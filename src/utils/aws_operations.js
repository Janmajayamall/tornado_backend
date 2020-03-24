const AWS = require("aws-sdk")
const {IMAGE_STORAGE_BUCKET_AWS} = require("./constants")

async function get_signed_url_put_object(file_name, file_mime){

    //Initialising AWS s3
    AWS.config.update({
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
        region:"ap-south-1",
        signatureVersion: 'v4',
    })
    const s3 = new AWS.S3({signatureVersion:"v4"})

    const params = {Bucket:IMAGE_STORAGE_BUCKET_AWS, Key:file_name, Expires:60*5, ContentType:file_mime}
    console.log(process.env.AWS_ACCESS_KEY_ID,params)
    var pre_signed_url = await s3.getSignedUrl("putObject", params)
    return pre_signed_url

}

module.exports = {
    get_signed_url_put_object
}