//const redis =require('redis');
const PubNub = require('pubnub');

const credentials = {
  publishKey: 'pub-c-e24a56b5-186e-4577-951b-7e145eddf6f5',
  subscribeKey: 'sub-c-9cf368ff-56ca-4768-9b0a-b49d1b363f7f',
  secretKey: 'sec-c-ZmE5MzQyNjAtNTQ2Yi00NGQ4LWEyMWYtYmJmMzRhYjA0ODRl'
};
const { parse } = require('uuid');
const CHANNELS={
    TEST: 'TEST',
    BLOCKCHAIN:'BLOCKCHAIN',
    TRANSACTION:'TRANSACTION'
};

class PubSub{
    constructor({blockchain,transactionPool}){
        this.blockchain=blockchain;
        this.transactionPool=transactionPool;
        // this.publisher=redis.createClient();
        // this.subscriber=redis.createClient();
        // this.subscribeToChannels();
        // this.subscriber.on(
        //     'message',(channel,message)=>this.handleMessage(channel,message));
        this.pubnub = new PubNub(credentials);
        this.pubnub.subscribe({ channels: Object.values(CHANNELS) });
        this.pubnub.addListener(this.listener());

    }
    handleMessage(channel,message){
        //console.log(`Message received. Channel: ${channel}.Message: ${message}.`);
        const parsedMessage=JSON.parse(message);
        switch(channel){
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage,true,()=>{
                    this.transactionPool.clearBlockchainTransaction({
                        chain:parsedMessage
                    })
                });
                break;
            case CHANNELS.TRANSACTION:
                this.transactionPool.setTransaction(parsedMessage);
                break;
            default:
                return;


        }
        

    }
    // subscribeToChannels(){
    //     Object.values(CHANNELS).forEach(channel=>{
    //         this.subscriber.subscribe(channel);
    //     });
    // }
    listener() {
        return {
          message: messageObject => {
            const { channel, message } = messageObject;
    
            this.handleMessage(channel, message);
          }
        };
      }
    publish({channel,message}){
        // this.subscriber.unsubscribe(channel,()=>{
        //     this.publisher.publish(channel,message,()=>{
        //         this.subscriber.subscribe(channel,message);

        //     })
        // })
        this.pubnub.publish({ channel, message });
        
    }
    broadcastChain(){
        this.publish({
            channel:CHANNELS.BLOCKCHAIN,
            message:JSON.stringify(this.blockchain.chain)
        })
    }
    broadcastTransaction(transaction){
        this.publish({
            channel:CHANNELS.TRANSACTION,
            message:JSON.stringify(transaction)
        })
    }
}
module.exports=PubSub;