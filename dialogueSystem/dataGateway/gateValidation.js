import { getPersona } from '../../personas/getPersona.js';
// check person expected person exists.
export function validatePersona(initialData) {
    return getPersona(initialData);
}

