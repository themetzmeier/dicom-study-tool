// Deep copy doesn’t reflect changes made to the new/copied object in the original object.
export const createDeepClone = (object, transferables) => {
    let cloneObject = '';
    if(transferables) {
        cloneObject = structuredClone(object, { transfer: transferables });
    } else {
        cloneObject = structuredClone(object)
    }
    return(cloneObject);
};