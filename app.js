import { app, errorHandler } from 'mu';
import bodyParser from 'body-parser';
import DeltaCache from './delta-cache';
import { chain } from 'lodash';
import { storeError } from './utils';

import {
  LOG_INCOMING_DELTA,
  LOG_OUTGOING_DELTA,
  DELTA_INTERVAL,
  CACHE_GRAPH
} from './env-config';

app.use( bodyParser.json( { type: function(req) { return /^application\/json/.test( req.get('content-type') ); } } ) );

const cache = new DeltaCache();
let hasTimeout = null;

app.post('/delta', async function( req, res ) {
  try {
    const delta = req.body;

    const extractedDelta = extractDeltaToSerialize(delta);

    if(extractedDelta.length){

      if (LOG_INCOMING_DELTA)
        console.log(`Receiving delta ${JSON.stringify(extractedDelta)}`);

      const processDelta = async function() {
        try {
          if (LOG_OUTGOING_DELTA)
            console.log(`Pushing onto cache ${JSON.stringify(extractedDelta)}`);

          cache.push( ...delta );

          if( !hasTimeout ){
            triggerTimeout();
          }
        }
        catch(e){
          console.error(`General error processing delta ${e}`);
          await storeError(e);
        }
      };
      processDelta();  // execute async
    }
  }
  catch(e){
    console.error(`General error processing delta notification ${e}`);
    await storeError(e);
  }

  res.status(202).send();
});

app.get('/files', async function( req, res ) {
  const since = req.query.since || new Date().toISOString();
  const files = await cache.getDeltaFiles(since);
  res.json({ data: files });
});

function triggerTimeout(){
  setTimeout( () => {
    try {
      hasTimeout = false;
      cache.generateDeltaFile();
    }
    catch(e){
      console.error(`Error generating delta file ${e}`);
      storeError(e);
    }
  }, DELTA_INTERVAL );
  hasTimeout = true;
}

/*
 * Extracts deltas related to CRUD of the cache-graph
 * This might be redundant, given proper config from deltanotifier, but consider
 * it as an extra safety-measure.
 */
function extractDeltaToSerialize(delta){
  const deletes = chain(delta)
        .map(c => c.deletes)
        .flatten()
        .filter(t => t.graph.value == CACHE_GRAPH)
        .value();

  const inserts = chain(delta)
        .map(c => c.inserts)
        .flatten()
        .filter(t => t.graph.value == CACHE_GRAPH)
        .value();

  if(!(inserts.length || deletes.length)){
    return [];
  }
  else {
    return [ { deletes, inserts } ];
  }
}

app.use(errorHandler);

// TODO write the in-memory delta cache to a file before shutting down the service
