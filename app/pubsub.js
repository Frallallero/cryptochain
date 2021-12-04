const PubNub = require('pubnub')

const credentials = {
    publishKey: 'pub-c-ab93966b-c559-4b6e-a503-1bea83ae4fd1',
    subscribeKey: 'sub-c-c4d69ca0-4887-11ec-8edf-3eb83c281352',
    secretKey: 'sec-c-NTA4NDE0MTYtNGM1MC00YjYwLTlhZjktNzBhMjg5NzgyMWM4'
}

const CHANNELS = {
    TEST: 'TEST',
    BLOCKCHAIN: 'BLOCKCHAIN',
    TRANSACTION: 'TRANSACTION'
}

class PubSub {
    constructor({ blockchain, transactionPool, wallet }) {
        this.blockchain = blockchain
        this.transactionPool = transactionPool
        this.wallet = wallet

        this.pubnub = new PubNub(credentials)

        this.pubnub.subscribe({ channels: Object.values(CHANNELS) })

        this.pubnub.addListener(this.listener())
    }

    listener() {
        return {
            message: (messageObject) => {
                const { message, channel } = messageObject

                console.log(
                    `Message received. Channel: ${channel}. Message: ${message}`
                )
            }
        }
    }

    handleMessage(channel, message) {
        const parsedMessage = JSON.parse(message)

        switch (channel) {
            case CHANNELS.BLOCKCHAIN:
                this.blockchain.replaceChain(parsedMessage, true, () => {
                    this.transactionPool.clearBlockchainTransactions({
                        chain: parsedMessage
                    })
                })
                break
            case CHANNELS.TRANSACTION:
                if (
                    !this.transactionPool.existingTransaction({
                        inputAddress: this.wallet.publicKey
                    })
                ) {
                    this.transactionPool.setTransaction(parsedMessage)
                }
                break
            default:
                return
        }
    }

    publish({ channel, message }) {
        this.pubnub.unsubscribe({ channels: Object.values(CHANNELS) })
        this.pubnub.publish({ channel, message })
        this.pubnub.subscribe({ channels: Object.values(CHANNELS) })
    }

    broadcastChain() {
        this.publish({
            channel: CHANNELS.BLOCKCHAIN,
            message: JSON.stringify(this.blockchain.chain)
        })
    }

    broadcastTransaction(transaction) {
        this.publish({
            channel: CHANNELS.TRANSACTION,
            message: JSON.stringify(transaction)
        })
    }
}

// const testPubSub = new PubSub()
// testPubSub.publish({ channel: CHANNELS.TEST, message: 'hello pubnub' })
module.exports = PubSub
