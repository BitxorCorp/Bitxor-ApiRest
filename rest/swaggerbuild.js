const swaggerAutogen = require('swagger-autogen')();

const doc = {
  info: {
    title: 'Bitxor Api-Rest Swagger',
    description: 'Bitxor Api-Rest Swagger',
  },
  host: 'genesis.bitxor.org:3001',
  schemes: ['https'],
};

const outputFile = '../swagger-output.json';
const endpointsFiles = ['./src/routes/accountRoutes.js', 
'./src/routes/blockRoutes.js', 
'./src/routes/chainRoutes.js', 
'./src/routes/dbFacade.js', 
'./src/routes/finalizationRoutes.js', 
'./src/routes/MerkelTree.js', 
'./src/routes/merkleUtils.js', 
'./src/routes/NetworkRoutes.js', 
'./src/routes/nodeRoutes.js', 
'./src/routes/routeResultTypes.js', 
'./src/routes/transactionRoutes.js', 
'./src/routes/transactionStatusRoutes.js',
'./src/routes/wsRoutes.js' ];

/* NOTE: if you use the express Router, you must pass in the 
   'endpointsFiles' only the root file where the route starts,
   such as index.js, app.js, routes.js, ... */

swaggerAutogen(outputFile, endpointsFiles, doc);