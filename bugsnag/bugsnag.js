var bugsnag = require('@bugsnag/js')
var bugsnagExpress = require('@bugsnag/plugin-express')
var bugsnagClient = bugsnag('d0ef839dcc9f904f4eae0bade780eca9')
bugsnagClient.use(bugsnagExpress)

module.exports=bugsnagClient