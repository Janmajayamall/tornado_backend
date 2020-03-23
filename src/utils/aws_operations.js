const AWS = require("aws-sdk")
const {IMAGE_STORAGE_BUCKET_AWS} = require("./constants")

async function get_signed_url_put_object(file_name, file_type, file_extension){

    //Initialising AWS s3
    AWS.config.update({
        accessKeyId:process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey:process.env.AWS_SECRET_ACCESS_KEY,
        region:"ap-south-1",
        signatureVersion: 'v4',
    })
    const s3 = new AWS.S3({signatureVersion:"v4"})
    const key_name=`${file_name}.${file_extension}`
    const bucket_name=IMAGE_STORAGE_BUCKET_AWS

    const params = {Bucket:bucket_name, Key:key_name, Expires:60*5, ContentType:`${file_type}/${file_extension}`}

    var pre_signed_url = await s3.getSignedUrl("putObject", params)
    return pre_signed_url

}

module.exports = {
    get_signed_url_put_object
}