# Pizza Delivery Voting using Hyperledger Fabric

## The example chaincode application

This repository contains an example implementation of a smart contract (aka chain code) to be used in a [Hyperledger Fabric](https://www.hyperledger.org/use/fabric) blockchain. This smart contract solves the following problem:

> Assume you are working within a larger office building where several companies rent offices - but there's no cafeteria. So you want to order at some delivery service, together with employees from your and from other companies. The first step is to decide where to order from. A fair solution is to vote where to order from - every employee has one vote. But where to host the server for counting the votes? How could you trust the company that hosts that server, that they don't manipulate the vote to their preferred delivery service? By using a smart contract on a blockchain. The smart contract permits every employee to place one vote; at some time, the vote is closed via the smart contract, and no more votes are accepted. The selected delivery service can be determined from the votes written to the blockchain.

Why is using a permissioned blockchain a useful implementation for this scenario?
* The different companies do not trust each other. What if company A would host the system to store the votes - and then simply claim that "Papa Pizza" had the most votes, although most employees voted for "Papa Sushi"? Using a blockchain with transactions verified by all involved companies solves that problem.
* What if some employee claims later that the winner is wrong - because they would have actually voted for another delivery service? Having digitally signed transactions on a blockchain solves that problem.
* What if some employee claims that his vote was not included although they voted before the voting was closed? As the logic of the smart contract is immutable and stored on the blockchain as well, it is easy to comprehend that this cannot be the case, because votes are accepted before and not accepted after closing the voting.
* What if some employee claims that the voting result is not correct? As all votes are transparently stored on the blockchain, it is easy to do a recount of the voting.

## Running the example chaincode application

These instructions assume a Linux-based environment, with docker and docker-compose tools installed.

#### Clone this repository, install fabric-samples repository and fabric binaries
* Create a directory to hold all data: `mkdir pizza-sample && cd pizza-sample`
* Clone this repository `git clone https://github.com/hsudbrock/fabric-pizza.git`
* Run the script provided by hyperledger fabric to clone the fabric samples project and install the fabric binaries: `curl -sSL https://bit.ly/2ysbOFE | bash -s -- 2.2.2 1.4.9` (cf. https://hyperledger-fabric.readthedocs.io/en/release-2.2/test_network.html#before-you-begin)

#### Start the hyperledger fabric test network
Move into the directory for the test network and start it: `cd fabric-samples && ./network.sh up`

#### Create a fabric channel to host our sample application
Still in the test network directory, run `./network.sh createChannel -c pizzachannel`; this creates a channel named `pizzachannel`.

#### Optional: Startup hyperledger explorer to see the test network including our channel
* Move into directory `hyperledger-explorer-docker`in the `pizza-sample` folder. (`cd ../../pizza-sample/hyperledger-explorer-docker`).
* Link the certificates for the test-network organizations into that folder: ln -s  ../../fabric-samples/test-network/organizations organizations`
* Start the hyperledger explorer as docker images `docker-compose up -d
* Open `http://localhost:8080`, login with `admin:cool_password`; you should see the Hyperledger Explorer UI and should find our channel `pizzachannel`

#### Setup environment for installing our sample app and interacting with it
* Go back into the `test-network` directory (`cd ../../fabric-samples/test-network`).
* Include the Hyperledger Fabric binaries in the path: `export PATH=$PWD/../bin:$PATH` 
* Set the cofiguration for the test network: `export FABRIC_CFG_PATH=$PWD/../config/`
* Set the environment to operate as a member of `Org1`, one of the two organizations setup in the Hyperledger Fabric test network:
  ```
  export CORE_PEER_TLS_ENABLED=true
  export CORE_PEER_LOCALMSPID="Org1MSP"
  export CORE_PEER_TLS_ROOTCERT_FILE=${PWD}/organizations/peerOrganizations/org1.example.com/peers/peer0.org1.example.com/tls/ca.crt
  export CORE_PEER_MSPCONFIGPATH=${PWD}/organizations/peerOrganizations/org1.example.com/users/Admin@org1.example.com/msp
  export CORE_PEER_ADDRESS=localhost:7051
  ```
* Install our sample chaincode on the channel `pizzachannel`: `./network.sh deployCC -c pizzachannel -ccn pizza-sample -ccp ../../fabric-pizza/chaincode-javascript -ccl javascript`

With hyperledger explorer, the chaincode is now visible here: http://localhost:8080/#/chaincodes. Also, corresponding transactions for installing the chaincode can be seen: http://localhost:8080/#/transactions

#### Interact with the pizza voting sample application
* Go into folder `scripts` of this repository: `cd ../../fabric-pizza/scripts`.
* Link the key material for the test network into the folder: `ln -s  ../../fabric-samples/test-network/organizations organizations`
* Initialize a voting session: `./initVoting.sh myPizzaVoting Roma,Rimini`. This initializes a new voting session with name `myPizzaVoting`, where one can vote for two delivery services (Roma and Rimini).
* The voting session status can be shown by: `./showVoting.sh myPizzaVoting`
* A vote can be given with: `./vote.sh myPizzaVoting Rimini`. This will vote for the user that we have setup in the environment above (i.e., the user from Org1 from the Hyperledger Fabric test network). To vote for a different user, the environment variables have to be changed accordingly.
* The voting can be closed with: `./closeVoting.sh myPizzaVoting`. This closes the voting, i.e., no more votes can be given. All votes from before are immutably registered on the Hyperledger Fabric blockchain.
* The winner of the voting can be displayed with: `.showWinner.sh myPizzaVoting`.

All the transactions of the voting are now on the blockchain of our channel `pizzachannel`, and can be viewed, e.g., using the Hyperledger Explorer under `localhost:8080/#/transactions'.
