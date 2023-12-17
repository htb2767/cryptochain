const Block= require('./block');
const {cryptoHash} = require('../util');
const Transaction=require('../wallet/transaction');
const Wallet=require('../wallet');
const { REWARD_INPUT, MINING_REWARD } = require('../config');
class Blockchain{
    constructor(){
        this.chain=[Block.genesis()];
    }
    addBlock({data}){
        const newBlock=Block.minedBlock({
            lastBlock:this.chain[this.chain.length-1],
            data
        });
        this.chain.push(newBlock);
    }
    validTransactionData({chain}){
        for(let i=1;i<chain.length;i++){
            const block=chain[i];
            const transactionSet=new Set();
            let rewardTransactionCount=0;
            for(let transaction of block.data){
                if(transaction.input.address===REWARD_INPUT.address){
                    rewardTransactionCount++;
                    if(rewardTransactionCount>1){
                        console.error('Miner rewards exceed limit');
                        return false;
                    }
                    if(Object.values(transaction.outputMap)[0]!==MINING_REWARD){
                        console.error('Miner reward amount is invaldi');
                        return false;
                    }
                }else{
                    if(!Transaction.validTransaction(transaction)){
                        console.error('Invalid Transaction');
                        return false;
                    }
                    const trueBalance=Wallet.calculateBalance({
                        chain:this.chain,
                        address:transaction.input.address
                    });
                    if(transaction.input.amount!==trueBalance){
                        console.error('Invalid input amount');
                        return false;
                    }
                    if(transactionSet.has(transaction)){
                        console.error('An identical transaction');
                        return false;
                    }else{
                        transactionSet.add(transaction);
                    }
                }
                
            }
        }
        return true;
    }
    static isValidChain(chain){
        if(JSON.stringify(chain[0])!==JSON.stringify(Block.genesis())) return false;
        for(let i=1;i<chain.length;i++){
            const block=chain[i];
            const actualLastHash=chain[i-1].hash;
            const lastDifficulty=chain[i-1].difficulty;
            const {timestamp,lastHash,hash,nonce,difficulty,data}=block;
            if(lastHash!==actualLastHash) return false;
            const validatedHash=cryptoHash(timestamp,lastHash,data,nonce,difficulty);
            if(hash!==validatedHash) return false;
            if(Math.abs(lastDifficulty-difficulty)>1) return false;
        }
        return true;

    }
    replaceChain(chain,validateTransaction,onSuccess){
        if(chain.length<=this.chain.length){
            console.error('the imcoming chain must be longer');
            return;
        }
        if(!Blockchain.isValidChain(chain)){
            console.error('the incoming chain must be valid');
            return;
        }
        if(validateTransaction&&!this.validTransactionData({chain})){
            console.error('the imcoing chain has invalid data');
            return ;
        }
        if(onSuccess) onSuccess();
        console.log('replacing chain with', chain)
        this.chain=chain;

    }
}
module.exports=Blockchain