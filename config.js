exports.development = {
    port: 3000,
    client_port: 3000,
    mongoose_auth: 'mongodb://mongodb@localhost/subway'
}

exports.production = {
    port: 14858, 
    client_port: 80, 
    mongoose_auth: 'mongodb://mongodb@localhost/subway'
}
