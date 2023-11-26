import Axios from "axios";
import { Buffer } from 'buffer';

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

export const makeNetworkRequest = async (httpRequestType, endPoint, postData, authorizationToken, customHeaders) => {
    let url = "/.netlify/functions/";
  
    if(process.env.REACT_APP_NODE_ENV === "development") {
      url = `${process.env.REACT_APP_DEVELOPMENT_FUNCTIONS_ENDPOINT}${url}`;
    }
  
    let confirmedPostData = { "data": postData };

    try {
        let response = false;
        if(customHeaders) {
            response = await Axios[httpRequestType](`${url}${endPoint}`, confirmedPostData, customHeaders);
        } else if (authorizationToken) {
            response = await Axios[httpRequestType](`${url}${endPoint}`, confirmedPostData, { "headers": { "Authorization": `Bearer ${authorizationToken}` }});
        } else {
            response = await Axios[httpRequestType](`${url}${endPoint}`, confirmedPostData);
        }
        // console.log(response);

        return response;
    } catch (error) {
        if(process.env.REACT_APP_NODE_ENV === "development") {
            console.log(error);
        }
        return false;
    }
};

export const triggerAWSDynamoDBFunction = async (httpRequestType, endPoint, postData, accessToken) => {
    let fullEndpoint = `awsDynamoDB/${endPoint}`;
    let response = await makeNetworkRequest(httpRequestType, fullEndpoint, postData, accessToken);
    // console.log(response);
    if((endPoint === "add-state" && response) || (response && response.hasOwnProperty("data") && response.data.length > 0)) {
        return response.data;
    } else {
        return false;
    }
};

export const triggerAWSS3 = async (httpRequestType, endPoint, postData, authorizationToken) => {
    let fullEndpoint = `awsS3/${endPoint}`;
    let response = await makeNetworkRequest(httpRequestType, fullEndpoint, postData, authorizationToken);
    // console.log(response);

    if((endPoint === "file-upload" && response) || (response && response.hasOwnProperty("data") && response.data)) {
        return response.data;
    } else {
        return false;
    }
};

export const triggerAuth0Function = async (httpRequestType, endPoint, postData, accessToken) => {
    let fullEndpoint = `auth0/${endPoint}`;
    
    let response = await makeNetworkRequest(httpRequestType, fullEndpoint, postData, accessToken);
    // console.log(response);

    if(response && response.hasOwnProperty("data") && response.data) {
        return response.data;
    } else {
        return false;
    }
};

export const generateMetaDataUpdates = async (user) => {
    // console.log(user);
    let updatedMetadata = {};
    await Promise.all(Object.keys(user.defaultProfile).map(async(key) => {
        if((key === "files" || key === "results") && user[key]) {
            // console.log(user[key]);
            let newFiles = {}
            await Promise.all(Object.keys(user[key]).map((nestedKey) => {
                let newFileName = nestedKey.replace(".", ":")
                let newFile = { [newFileName]: { ...user[key][nestedKey] } };
                Object.assign(newFiles, { ...newFile }); 

                return true;
            }));
            Object.assign(updatedMetadata, { [key]: { ...newFiles } });
        } else {
            Object.assign(updatedMetadata, { [key]: user[key] });
        }
        return true;
    }));

    return updatedMetadata;
}

export const updateProfile = async (profileUpdates, currentProfile) => {
    // console.log(profileUpdates);
    // console.log(currentProfile);

    let updatedMetaData = await generateMetaDataUpdates(profileUpdates);
    // console.log(updatedMetaData);

    let response = await triggerAuth0Function("post", "update-profile", { updatedMetaData, "userId": currentProfile.sub }, currentProfile.accessToken);
    if(response && getObjectValue(response, "data")) {
        response = response.data;
    } else {
        response = false;
    }
    return response;
};

export const storeDICOMStateinDatabase = async (dicomState, accessToken) => {
    let result = await triggerAWSDynamoDBFunction("post", "add-state", { dicomState }, accessToken);
    // console.log(result);
  
    return result;
};

export const getDICOMStateinDatabase = async (id, accessToken) => {
    let result = await triggerAWSDynamoDBFunction("post", "get-state", { id }, accessToken);
    // console.log(result);
  
    return result;
};

export const storeDICOMActivityinDatabase = async (dicomActivity, accessToken) => {
    let result = await triggerAWSDynamoDBFunction("post", "add-activity", { dicomActivity }, accessToken);
    // console.log(result);
  
    return result;
};

export const getDICOMActivitiesinDatabase = async (userId, accessToken) => {
    let result = await triggerAWSDynamoDBFunction("post", "get-activities", { userId }, accessToken);
    // console.log(result);
  
    return result;
};

export const includes = (searchable, value, toLowerCase) => {
    let returnValue = false;
    if(searchable) {
        let container = searchable;
        if(toLowerCase) {
            container = searchable.toLowerCase();
        }
        /* BEGIN CODE FROM https://www.sharmaprakash.com.np/javascript/ie-alternative-to-includes/ */
        let pos = container.indexOf(value);
        if(pos >= 0) {
            returnValue = true;
        }
        /* END CODE FROM https://www.sharmaprakash.com.np/javascript/ie-alternative-to-includes/ */
    }
    return returnValue;
};

export const convertFilesToArray = (files) => {
    let convertedArray = [];
    if(typeof files === "object") {
        let objectPrototype = Object.getPrototypeOf(files).toString();
        if(includes(objectPrototype, "filelist", true)) {
            convertedArray = Array.from(files);
        } else if (includes(objectPrototype, "[object, Object]", true)) {
            convertedArray = Object.keys(files);
        } else {
            convertedArray = files;
        }
    }
    return convertedArray;
};

export const uploadFileToAWSS3 = async (file, id, accessToken) => {
    let results = await triggerAWSS3("post", "file-upload", { file, id }, accessToken);
    if (results && results.url && results.fields) {
        let form = new FormData();
        let keys = Object.keys(results.fields);
        keys.map((key) => {
            form.append(key, results.fields[key]);
            return true;
        });
        form.append('file', file);
        try {
            await Axios.post(results.url, form, { headers: { 'content-type': 'multipart/form-data' } });
        } catch (error) {
            // console.log(error);
        }
    } else {
        results = false;
    }
    return results;
};

export const getFileFromAWSS3 = async (id, name, accessToken) => {
    let response = await triggerAWSS3("post", "get-file", { id }, accessToken);

    const buffer = Buffer.from(response.Body);
    const blob = new Blob([buffer]);
    let file = new File([blob], name);
    // console.log(file);

    return file;
};