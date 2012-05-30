exports.dev = {
    port: 3000,
    mongoose_auth: 'mongodb://mongodb@localhost/subway'
}

exports.prod = {
    port: 14858, // Nodester port
    mongoose_auth: 'mongodb://mongodb@localhost/subway'
}
