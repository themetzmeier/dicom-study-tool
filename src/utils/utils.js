import Axios from "axios";

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

export const getObjectValue = (object, key) => {
    let result = false;
  
    if(object && object.hasOwnProperty(key) && (object[key] || (typeof object[key] === "boolean" && object === false))) {
        result = object[key];
    }
    return result;
};

export const makeNetworkRequest = async (httpRequestType, endPoint, postData) => {
    let url = "/.netlify/functions/";
  
    if(process.env.REACT_APP_NODE_ENV === "development") {
      url = `${process.env.REACT_APP_DEVELOPMENT_FUNCTIONS_ENDPOINT}${url}`;
    }
  
    let confirmedPostData = { "data": postData };

    try {
        let response = await Axios[httpRequestType](`${url}${endPoint}`, confirmedPostData);
        // console.log(response);

        return response;
    } catch (error) {
        if(process.env.REACT_APP_NODE_ENV === "development") {
            console.log(error);
        }
        return false;
    }
};

export const triggerAuth0Function = async (httpRequestType, endPoint, postData) => {
    let fullEndpoint = `auth0/${endPoint}`;
    
    let response = await makeNetworkRequest(httpRequestType, fullEndpoint, postData, "netlify");
    // console.log(response);

    if(response && response.hasOwnProperty("data") && response.data) {
        return response.data;
    } else {
        return false;
    }
};

export const generateMetaDataUpdates = (user) => {
    let updatedMetadata = {};
    Object.keys(user.defaultProfile).forEach((key) => {
        Object.assign(updatedMetadata, { [key]: user[key] });
    });

    return updatedMetadata;
}

export const updateProfile = async (profileUpdates, currentProfile) => {
    console.log(profileUpdates);
    console.log(currentProfile);
    let updatedMetaData = generateMetaDataUpdates(profileUpdates);
    let response = await triggerAuth0Function("post", "update-profile", { updatedMetaData, "userId": currentProfile.sub });
    if(response && getObjectValue(response, "data")) {
        response = response.data;
    } else {
        response = false;
    }
    return response;
};