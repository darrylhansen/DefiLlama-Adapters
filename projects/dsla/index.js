const sdk = require('@defillama/sdk');
const { request, gql } = require('graphql-request');
const { getBlock } = require('../helper/http');

const graphs = {
    ethereum: "https://ethv2.graph.node.dsla.network/subgraphs/name/dsla-protocol/core",
    arbitrum: 'https://arbv2.graph.node.dsla.network/subgraphs/name/dsla-protocol/core',
    polygon: "https://plgv2.graph.node.dsla.network/subgraphs/name/dsla-protocol/core",
}

const offsets = {
    ethereum: 0,
    arbitrum: 1500000,
    polygon: 300000,
}

function tvlPaged(chain) {
    return async (_, _b, { [chain]: block }) => {
        block = await getBlock(_, chain, { [chain]: block })
        const balances = {}
        let graphQuery = gql`
        query GET_TVLS ($block:Int) {
            tvls(block: {number: $block}) {
                id
                amount
            }
        }`

        const { tvls } = await request(graphs[chain], graphQuery, { block: block - offsets[chain] });
        //console.log(tvls)

        tvls.forEach((token) => {
            //    console.log(token.id)
            //    console.log(token.amount)
            sdk.util.sumSingleBalance(balances, chain + ':' + token.id, token.amount)
        });

        return balances
    }
}

module.exports = {
    methodology: `Retrieves TVL data for each chain from the DSLA subgraph nodes`,
    misrepresentedTokens: true,
    timetravel: false,
}

const chains = ['ethereum', 'polygon', 'arbitrum']

chains.forEach(chain => {
    module.exports[chain] = {
        tvl: tvlPaged(chain)
    }
})