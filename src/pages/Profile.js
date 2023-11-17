import React, { useState, useEffect } from "react";
import { convertFilesToArray, createDeepClone, getDICOMStateinDatabase, getFileFromAWSS3, includes, storeDICOMStateinDatabase, uploadFileToAWSS3 } from "../utils/utils.js";
import { AiOutlineEdit, AiFillEdit } from "react-icons/ai";
import PropTypes from 'prop-types';
import Loading from "./Loading.js";
import DropZone from "../components/DropZone.js";
import DICOM from "../components/DICOM.js";
import HoverButton from "../components/HoverButton.js";
import { v4 as uuidv4 } from 'uuid';

function Profile({ isMobile, currentProfile, setCurrentProfile }) {
    const [makeEdits, setMakeEdits] = useState(false);
    const [profileChanges, setProfileChanges] = useState(null);
    const [profileChangesErrors, setProfileChangesErrors] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [updateSucess, setUpdateSuccess] = useState(null);
    const [updateError, setUpdateError] = useState(null);
    const [dicomFiles, setDicomFiles] = useState(null);
    const [dropZoneVisible, setDropZoneVisible] = useState(false);
    const [dicomAppIsInitialized, setDicomAppIsInitialized] = useState(null);
    const [dicomFileIds, setDicomFileIds] = useState(null);
    const [fileFound, setFileFound] = useState(false);
    const [dicomStates, setDicomStates] = useState(null);

    useEffect(() => {
        if(currentProfile) {
            setProfileChangesErrors(createDeepClone(currentProfile.defaultProfileErrors));
        }
    }, [currentProfile]);

    const handleChange = (e) => {
        setSubmitted(false);
        setProfileChanges({
            ...profileChanges,
            [e.target.name]: e.target.value
        });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        // console.log(profileChanges);
        
        let profileHasBeenUpdated = setCurrentProfile(profileChanges);
        if(profileHasBeenUpdated) {
            setUpdateSuccess("Profile successfully updated!");
            setMakeEdits(false);
            setUpdateSuccess('');
        } else {
            setUpdateError("Failed to update profile please refresh the page and try again.");
        }
    };

    const saveDICOMFile = async (fileMetadata, file) => {
        let id = Object.keys(fileMetadata)[0];
        if(!currentProfile.files.hasOwnProperty(id)) {
            let profileUpdateObject = currentProfile
            if(currentProfile.files) {
                Object.assign(profileUpdateObject, { "files": { ...currentProfile.files, ...fileMetadata } });
            } else {
                Object.assign(profileUpdateObject, { "files": { ...fileMetadata } });
            }
            // console.log(profileUpdateObject);

            await uploadFileToAWSS3(file, id, currentProfile.accessToken);

            await setCurrentProfile(profileUpdateObject);
        } else {
            // Upload DICOM drawing state to DynamoDB
        }
    };

    useEffect(() => {
        if(dicomFiles && dicomFiles.length > 0 && currentProfile) {
            checkForPreExistingFile().then((fileIds) => {
                setDicomFileIds(fileIds);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dicomFiles, currentProfile]);
    
    useEffect(() => {
        if(fileFound && currentProfile) {
            getDICOMStateinDatabase(currentProfile.userId, currentProfile.accessToken).then((result) => {
                setDicomStates(result);
            });
        }
    }, [fileFound, currentProfile]);

    const checkForPreExistingFile = async () => {
        let fileIds = await Promise.all(convertFilesToArray(dicomFiles).map(async (file) => {
            let fileId = uuidv4(); 
            if(currentProfile.files) {
                await Promise.all(Object.keys(currentProfile.files).map((userFileId) => {
                    let userFile = currentProfile.files[userFileId];
                    // console.log(`${userFile.name} === ${file.name} && ${userFile.size} === ${file.size}`);
                    if(userFile.name === file.name && userFile.size === file.size) {
                        fileId = userFileId;
                        setFileFound(true);
                    }
                    return true;
                }));
            }
            return fileId;
        }));

        return fileIds;
    };

    const handleDICOMFileUpload = (inputFiles, type) => {
        let files = inputFiles;
        if(type === "delete") {
            files = null; 
        }

        setDicomFiles(files);
    };

    const storeDICOMState = async () => {
        let result = false;
        let dicomExistingState = localStorage.getItem("dicomAppState");
        if(dicomExistingState) {
            let dicomState = JSON.parse(dicomExistingState);
            let dicomStateObject = { ...dicomState, "userId": currentProfile.sub };
            // console.log(dicomStateObject);
            
            result = await storeDICOMStateinDatabase(JSON.stringify(dicomStateObject), currentProfile.accessToken);
            // console.log(result);
        }

        return result;
    };

    useEffect(() => {
        if(dicomAppIsInitialized && currentProfile) {
            setDropZoneVisible(true);
            getFileFromAWSS3(Object.keys(currentProfile.files)[0], currentProfile.files[Object.keys(currentProfile.files)[0]].name, currentProfile.accessToken).then((file) => {
                setDicomFiles([file]);
            });
        }
    }, [dicomAppIsInitialized, currentProfile]);

    if(currentProfile && profileChangesErrors) {
        return(
            <div className="container" >
                <div className="content" style={{ "marginBottom": "32px"}}>
                    {/* Row 1 */ }
                    <div style={{ "display": "flex" }} >
                        <div className="card card-padding" style={{ "marginRight": "32px", "width": "50%" }}>
                            <h2>Upload Your Own DICOM File</h2>
                            <div style={{ "display": "flex", "alignItems": "center", "width": "100%", "justifyContent": "center" }}>
                                <DropZone display={true} isMobile={isMobile} files={dicomFiles} updateParent={handleDICOMFileUpload} visible={dropZoneVisible} />
                            </div>
                        </div>
                        <div className="card card-padding" style={{ "width": "50%" }}>
                            <div style={{ "width": "100%", "paddingRight":"24px", "paddingTop": "8px", "display": "flex", "alignItems": "center" }}>
                                <h2>Your Profile</h2>
                                <p style={{ "marginLeft": "auto" }}>
                                    Manage Your Account Info:
                                    <span>
                                        <HoverButton 
                                            normalIcon={!makeEdits ? <AiOutlineEdit style={{"transform": "scale(3)"}} className="ai-edit-icon" /> : <AiFillEdit style={{"transform": "scale(3)"}} className="ai-edit-icon" />}
                                            hoverIcon={!makeEdits ? <AiFillEdit style={{"transform": "scale(3)"}} className="ai-edit-icon" /> : <AiOutlineEdit style={{"transform": "scale(3)"}} className="ai-edit-icon" />}
                                            updateParent={() => { setMakeEdits(!makeEdits); setProfileChanges(currentProfile); setUpdateSuccess(''); setUpdateError(''); }}
                                            style={{ "background": "transparent", "border": "none", "cursor": "pointer", "outline": "none", "marginLeft": "16px", "display": "inline" }}
                                        />
                                    </span>
                                </p>
                            </div>
                            <div style={isMobile ? {} : {"display":"flex"}}>
                                <div style={isMobile ? { "width": "100%", "textAlign": "center" } : { "width": "50%" }} className="w3-container">
                                    {makeEdits ? (
                                        <form onSubmit={(e) => handleSubmit(e)}>
                                            {Object.keys(currentProfile.defaultProfile).map((key, index) => {
                                                let placeholder = key;
                                                return(
                                                    <React.Fragment key={index + 300}>
                                                        <input
                                                            name={key}
                                                            placeholder={placeholder}
                                                            value={profileChanges[key]}
                                                            onChange={(e) => handleChange(e)}
                                                            style={{ "marginTop": "8px", "marginBottom": "8px" }}
                                                        />
                                                        <div className="form-error">{profileChangesErrors[`${key}Error`]}</div>
                                                    </React.Fragment>
                                                );
                                            })}
                                            <button
                                                className="dwv-button" 
                                                style={{ "padding": "8px", "marginTop": "8px" }}
                                                type="submit"
                                                disabled={submitted}
                                            >
                                                <b>Apply Changes</b>
                                            </button>
                                            <div className="form-error">{updateError}</div>
                                            <div className="form-error" style={{ "color": "green "}}>{updateSucess}</div>                                                                
                                        </form>
                                    ) : (
                                        <div style ={{"marginBottom":"16px"}}>
                                            <p>
                                                {currentProfile.username}
                                            </p>
                                            <p>
                                                {currentProfile.firstName} {currentProfile.lastName}
                                            </p>
                                            <p>
                                                {currentProfile.company}
                                            </p>
                                            <p style ={{"margin":"0"}}>
                                                {currentProfile.address1}
                                            </p>
                                            <p style ={{"margin":"0"}}>
                                                {currentProfile.address2}
                                            </p>
                                            {currentProfile.city && currentProfile.state ? (
                                                <p style ={{"margin":"0"}}>
                                                    {currentProfile.city}, {currentProfile.state}
                                                </p>
                                            ) : null}
                                            <p style ={{"margin":"0"}}>
                                                {currentProfile.zip}
                                            </p>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    {/* Row 2 */}
                    <div className="card card-padding" style={{ "marginTop": "32px" }}>
                        <div style={{ "width": "100%", "paddingRight":"24px", "paddingTop": "8px", "display": "flex", "alignItems": "center" }}>
                            <h2>DICOM View</h2>
                        </div>
                        <DICOM isMobile={isMobile} dbDICOMStates={dicomStates} files={dicomFiles} fileIds={dicomFileIds} setIsInitialized={setDicomAppIsInitialized} />
                        <div style={{ "width": "100%", "display": "flex", "justifyContent": "right" }}>
                            {fileFound ? (
                                <button className="dwv-button" onClick={() => storeDICOMState()}>
                                    Save DICOM Annotations
                                </button>
                            ) : (
                                <button className="dwv-button" onClick={() => {
                                    let dicomFileId = dicomFileIds[0];
                                    if(includes(dicomFileId, "zip", true)) {
                                        dicomFileId = dicomFileId.split(".")[0];
                                    }
                                    saveDICOMFile({ [`${dicomFileId}.${dicomFiles[0].name.split('.')[1]}`]: { "name": dicomFiles[0].name, "size": dicomFiles[0].size } }, dicomFiles[0])
                                }}>
                                    Save DICOM File
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        );
    } else {
        return(
            <Loading text="Profile" />
        );
    }
}

Profile.propTypes = {
    isMobile: PropTypes.bool,
    currentProfile: PropTypes.object,
    setCurrentProfile: PropTypes.func,
    username: PropTypes.string
};

export default Profile;
