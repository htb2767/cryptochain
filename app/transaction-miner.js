const Transaction=require('../wallet/transaction');
class TransactionMiner{
    constructor({blockchain,transactionPool,wallet,pubsub}){
        this.blockchain=blockchain;
        this.transactionPool=transactionPool;
        this.wallet=wallet;
        this.pubsub=pubsub;

    }
    mineTransaction(){
        const validTransactions=this.transactionPool.validTransaction();

        //get the transaction pool's valid transactions
        validTransactions.push(
            Transaction.rewardTransaction({minerWallet:this.wallet})
        );
        //generate the miners reward
        // add a block consiting of these transactions to the blockchain
        this.blockchain.addBlock({data:validTransactions});
        //broadcast the updated blockchain
        this.pubsub.broadcastChain();
        //clear the transaction pool
        this.transactionPool.clear();
    }
}
module.exports=TransactionMiner;