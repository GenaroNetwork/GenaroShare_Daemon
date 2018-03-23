if(!process.env.STORJ_NETWORK) {
    process.env.STORJ_NETWORK = 'genaro';
}
console.log('env.STORJ_NETWORK: ' + process.env.STORJ_NETWORK)
Object.defineProperty(global, "_bitcore", {
    get: function(){
        return undefined;
    },
    set: function(){}
});