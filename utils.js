import { uuid, sparqlEscapeString, sparqlEscapeUri } from 'mu';
import { updateSudo as update } from '@lblod/mu-auth-sudo';
import { ERROR_URI_PREFIX, PREFIXES, ERROR_GRAPH, ERROR_TYPE, DELTA_ERROR_TYPE } from './env-config.js';

export async function storeError(errorMsg){
 const id = uuid();
  const uri = ERROR_URI_PREFIX + id;

  const queryError = `
   ${PREFIXES}

   INSERT DATA {
    GRAPH ${sparqlEscapeUri(ERROR_GRAPH)}{
      ${sparqlEscapeUri(uri)} a ${sparqlEscapeUri(ERROR_TYPE)}, ${sparqlEscapeUri(DELTA_ERROR_TYPE)};
        mu:uuid ${sparqlEscapeString(id)};
        oslc:message ${sparqlEscapeString(errorMsg)}.
    }
   }
  `;

  await update(queryError);
}

export function isInverse(predicate) {
  return predicate && predicate.startsWith('^');
}

export function sparqlEscapePredicate(predicate) {
  return isInverse(predicate) ? `^<${predicate.slice(1)}>` : `<${predicate}>`;
}

export function normalizePredicate(predicate) {
  return isInverse(predicate) ? predicate.slice(1) : predicate;
}

export function serializeTriple(triple) {
  const predicate = sparqlEscapePredicate(triple.predicate.value);
  return `${serializeTriplePart(triple.subject)} ${predicate} ${serializeTriplePart(triple.object)}.`;
}

export function serializeTriplePart(triplePart){
  if(triplePart.type == 'uri'){
    return sparqlEscapeUri(triplePart.value);
  }
  else {
    if(triplePart.datatype){
      return `${sparqlEscapeString(triplePart.value)}^^${sparqlEscapeUri(triplePart.datatype)}`;
    }
    else {
      return sparqlEscapeString(triplePart.value);
    }
  }
}
