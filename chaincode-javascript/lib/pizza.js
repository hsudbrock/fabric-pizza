'use strict';

// Deterministic JSON.stringify()
const stringify  = require('json-stringify-deterministic');
const sortKeysRecursive  = require('sort-keys-recursive');
const { Contract } = require('fabric-contract-api');

// Why is this a useful blockchain example?
// * We have trust issues - the different organizations do not trust each other to procure the correct vote.
// * With a "standard" database, we don't have a trace of who did what in which order (closing the vote vs. voting)
// * I.e., we cannot add votes after the voting has ended - this is ensured by the smart contract logic.

class Pizza extends Contract {

    async initVoting(ctx, name, deliveryServices) {
        const voting = {
            name: name,
            deliveryServices: deliveryServices.split(','),
            votes: [],
            open: true
        };

        voting.docType = 'voting';

        await ctx.stub.putState(voting.name, Buffer.from(stringify(sortKeysRecursive(voting))));
    }

    async closeVoting(ctx, votingName) {
        const votingString = await this.readVoting(ctx, votingName);
        const voting = JSON.parse(votingString);
        if (! voting.open) {
            throw new Error(`The voting ${votingName} is already closed.`);
        }
        voting.open = false;
        await ctx.stub.putState(votingName, Buffer.from(stringify(sortKeysRecursive(voting))));
        return voting;
    }

    async readVoting(ctx, name) {
        const votingJSON = await ctx.stub.getState(name);
        if (!votingJSON || votingJSON.length === 0) {
            throw new Error(`No voting with name ${name} found`);
        }
        return votingJSON.toString();
    }

    async vote(ctx, votingName, deliveryService) {
        const votingString = await this.readVoting(ctx, votingName);
        const voting = JSON.parse(votingString);

        if (!voting.open) {
            throw new Error(`The voting ${votingName} is already closed.`);
        }

        if (!voting.deliveryServices.includes(deliveryService)) {
            throw new Error(`The delivery service ${deliveryService} is not supported   .`);
        }

        voting.votes = voting.votes.filter(function(x) {return x.client !== ctx.clientIdentity.getID();});
        voting.votes.push({client: ctx.clientIdentity.getID(), deliveryService: deliveryService});

        await ctx.stub.putState(votingName, Buffer.from(stringify(sortKeysRecursive(voting))));
        return voting;
    }

    async readWinner(ctx, votingName) {
        const votingString = await this.readVoting(ctx, votingName);
        const voting = JSON.parse(votingString);

        if (voting.open) {
            throw new Error(`The voting ${votingName} is still open.`);
        }

        if (voting.votes.length === 0) {
            throw new Error(`The voting ${votingName} has no votes.`);
        }

        const count = new Map();
        voting.votes.forEach(function(x) {
            if (!count.has(x.deliveryService)) {
                count.set(x.deliveryService, 0);
            }
            count.set(x.deliveryService, count.get(x.deliveryService) + 1);
        });

        const max = [...count.entries()].reduce((previous,current) => previous[1] > current[1] ? previous : current);

        return {winner: max[0], count: max[1]};
    }


}

module.exports = Pizza;
