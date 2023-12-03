import React, { useState, useEffect } from "react";
import { convertFilesToArray, createDeepClone, getDICOMActivitiesinDatabase, getDICOMStateinDatabase, getFileFromAWSS3, getObjectValue, includes, storeDICOMActivityinDatabase, storeDICOMStateinDatabase, uploadFileToAWSS3 } from "../utils/utils.js";
import { AiOutlineEdit, AiFillEdit } from "react-icons/ai";
import PropTypes from 'prop-types';
import Loading from "./Loading.js";
import DropZone from "../components/DropZone.js";
import DICOM from "../components/DICOM.js";
import HoverButton from "../components/HoverButton.js";
import { v4 as uuidv4 } from 'uuid';
import RemovalButton from "../components/RemovalButton.js";

const defaultActivityQuestion = {
    question: '',
    answer: ''
};

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
    const [dbDicomFiles, setDbDicomFiles] = useState(null);
    const [activityCreationMode, setActivityCreationMode] = useState(null);
    const [activityQuestions, setActivityQuestions] = useState([createDeepClone(defaultActivityQuestion)]);
    const [activityName, setActivityName] = useState('');
    const [activityId, setActivityId] = useState('');
    const [activityFileName, setActivityFileName] = useState('');
    const [activityDescription, setActivityDescription] = useState('');
    const [activityPrivate, setActivityPrivate] = useState(true);
    const [dicomActivities, setDicomActivities] = useState(null);
    const [currentDICOMFileId, setCurrentDICOMFileId] = useState('');

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
            checkForPreExistingFile(dicomFiles, currentProfile, setFileFound, setCurrentDICOMFileId).then((fileIds) => {
                setDicomFileIds(fileIds);
            });
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dicomFiles, currentProfile]);
    
    useEffect(() => {
        if(fileFound && currentDICOMFileId && currentProfile) {
            getDICOMStateinDatabase(currentDICOMFileId, currentProfile.accessToken).then((result) => {
                setDicomStates(result);
            });
        }
    }, [fileFound, currentDICOMFileId, currentProfile]);

    useEffect(() => {
        if(currentProfile && currentProfile.accessToken) {
            getDICOMActivitiesinDatabase(currentProfile.sub, currentProfile.accessToken).then((result) => {
                // console.log(result);
                setDicomActivities(result);
            });
        }
    }, [currentProfile]);

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
                        setCurrentDICOMFileId(fileId);
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
            setCurrentDICOMFileId('');
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
        if(currentProfile && getObjectValue(currentProfile, "files")) {
            setDbDicomFiles(currentProfile.files);
        }
    }, [currentProfile]);

    useEffect(() => {
        if(dicomAppIsInitialized && currentProfile) {
            setDropZoneVisible(true);
        }
    }, [dicomAppIsInitialized, currentProfile]);

    const questionHandleChange = (e, index) => {
        e.preventDefault();

        let activityQuestionsClone = createDeepClone(activityQuestions);
        let newQuestionObject = activityQuestionsClone[index];
        Object.assign(newQuestionObject, { [e.target.name]: e.target.value });

        setActivityQuestions(activityQuestionsClone);
    };

    const saveActivity = async () => {
        let dicomFilesArray = convertFilesToArray(dicomFiles);
        let selectedDICOMIndex = await dicomFileIds.findIndex((item) => item === currentDICOMFileId);
        let selectedDICOMFile = dicomFilesArray[selectedDICOMIndex];

        let activityObject = {
            "fileName": selectedDICOMFile.name,
            "id": currentDICOMFileId,
            "name": activityName,
            "description": activityDescription,
            "userId": currentProfile.sub,
            "questions": activityQuestions,
            "private": activityPrivate,
        };

        await storeDICOMActivityinDatabase(activityObject, currentProfile.accessToken);
    };

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
                                                if(key === "files" || key === "results") {
                                                    return null;
                                                } else {
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
                                                }
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
                    {dbDicomFiles ? (
                        <div className="card card-padding" style={{ "marginTop": "32px" }}>
                            <h2>Uploaded DICOM Files</h2>
                            {Object.keys(dbDicomFiles).map((dbFileId) => {
                                let dbDicomFile = dbDicomFiles[dbFileId];
                                return(
                                    <button
                                        key={dbFileId}
                                        className="hidden-btn"
                                        style={{ "paddingTop": "16px", "paddingBottom": "16px", "paddingLeft": "64px", "paddingRight": "64px", border: "1px solid #000", "marginTop": "8px", "marginRight": "16px" }}
                                        onClick={() => {
                                            getFileFromAWSS3(dbFileId, dbDicomFile.name, currentProfile.accessToken).then((file) => {
                                                setCurrentDICOMFileId(dbFileId);
                                                setFileFound(false);
                                                setDicomFiles([file]);
                                            });
                                        }}
                                    >
                                        {dbDicomFile.name}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                    {dicomActivities ? (
                        <div className="card card-padding" style={{ "marginTop": "32px" }}>
                            <h2>Learning Activities</h2>
                            {dicomActivities.map((activity) => {
                                return(
                                    <button
                                        key={activity.name}
                                        className="hidden-btn"
                                        style={{ "paddingTop": "16px", "paddingBottom": "16px", "paddingLeft": "64px", "paddingRight": "64px", border: "1px solid #000", "marginTop": "8px", "marginRight": "16px" }}
                                        onClick={() => {
                                            getFileFromAWSS3(activity.id, activity.fileName, currentProfile.accessToken).then((file) => {
                                                setCurrentDICOMFileId(activity.id);
                                                setFileFound(false);
                                                setDicomFiles([file]);
                                                setActivityId(activity.id);
                                                setActivityFileName(activity.fileName);
                                                setActivityName(activity.name);
                                                setActivityDescription(activity.description);
                                                setActivityQuestions(activity.questions);
                                                setActivityCreationMode(true);
                                                setActivityPrivate(activity.private);
                                            });
                                        }}
                                    >
                                        {activity.name}
                                    </button>
                                );
                            })}
                        </div>
                    ) : null}
                    {activityCreationMode ? (
                        <div className="card card-padding" style={{ "marginTop": "32px" }}>
                            <div style={{ "display": "flex", "alignItems": 'center' }}>
                                <h2>Activity Builder</h2>
                                <button 
                                    className="hidden-btn btn-link"
                                    style={{ "marginLeft": "64px" }}
                                    onClick={() => {
                                        window.open(`/activity/${activityId}/${activityFileName}`, "_blank");
                                    }}
                                >
                                    Test Activity
                                </button>
                                <div style={{ "display": "flex", "marginLeft": "64px" }}>
                                    <input
                                        style={{ "marginRight":"6px" }}
                                        type="checkbox"
                                        checked={!activityPrivate}
                                        onChange={() => { setActivityPrivate(false); }}
                                    />
                                    <label style={{ "marginRight": "16px" }}>
                                        Public
                                    </label>
                                    <input
                                        style={{ "marginRight":"6px" }}
                                        type="checkbox"
                                        checked={activityPrivate}
                                        onChange={() => { setActivityPrivate(true); }}
                                    />
                                    <label>
                                        Private
                                    </label>
                                </div>
                            </div>
                            <div style={{ "width": "100%" }}>
                                <input
                                    style={{ "height": "25px", "width": "250px", "marginBottom": "16px" }}
                                    value={activityName}
                                    placeholder="Activity Name"
                                    onChange={(e) => setActivityName(e.target.value)} 
                                />
                                <br />
                                <textarea
                                    className="main-font"
                                    style={{ "minHeight": "38px", "minWidth": "250px", "maxHeight": "100px", "maxWidth": "40%", "marginRight": "5%" }}
                                    value={activityDescription}
                                    placeholder="Activity Description"
                                    type="text-area"
                                    onChange={(e) => setActivityDescription(e.target.value)} 
                                />
                                {activityQuestions.map((questionObject, index) => {
                                    return(
                                        <div key={index} style={{ "display": "flex", "alignItems": "center" }}>
                                            <h2 style={{ "marginRight": "5%" }}>{index + 1}.</h2>
                                            <textarea
                                                className="main-font"
                                                style={{ "minHeight": "38px", "minWidth": "75px", "maxHeight": "100px", "maxWidth": "40%", "marginRight": "5%" }}
                                                name="question"
                                                value={questionObject.question}
                                                placeholder="Question"
                                                type="text-area"
                                                onChange={(e) => questionHandleChange(e, index)} 
                                            />
                                            <textarea
                                                className="main-font"
                                                style={{ "minHeight": "38px", "minWidth": "75px", "maxHeight": "100px", "maxWidth": "40%" }}
                                                name="answer"
                                                value={questionObject.answer}
                                                placeholder="Answer"
                                                onChange={(e) => questionHandleChange(e, index)}
                                            />
                                            <RemovalButton
                                                deleteObject={questionObject}
                                                updateParent={(deleteObject, type) => {
                                                    let activityQuestionsClone = createDeepClone(activityQuestions);
                                                    let deleteIndex = activityQuestionsClone.findIndex((questionObject) => questionObject.question === deleteObject.question && questionObject.answer === deleteObject.answer);
                                                    activityQuestionsClone.splice(deleteIndex, deleteIndex + 1);

                                                    if(activityQuestionsClone.length === 0) {
                                                        activityQuestionsClone.push(defaultActivityQuestion);
                                                    }

                                                    setActivityQuestions(activityQuestionsClone);
                                                }}
                                            />
                                        </div>
                                    );
                                })}
                                <button 
                                    className="hidden-btn btn-link"
                                    style={{ "marginLeft": "65px" }}
                                    onClick={() => {
                                        let activityQuestionsClone = createDeepClone(activityQuestions);
                                        activityQuestionsClone.push(defaultActivityQuestion);

                                        setActivityQuestions(activityQuestionsClone);
                                    }}
                                >
                                    Add Question
                                </button>
                            </div>
                            <div style={{ "width": "100%", "textAlign": "right" }}>
                                <button
                                    className="dwv-button"
                                    onClick={() => saveActivity()}
                                >
                                    Save Activity
                                </button>
                            </div>
                            {getObjectValue(currentProfile, "results") ? (
                                <div>
                                    {getObjectValue(currentProfile.results, activityId) ? (
                                        <React.Fragment>
                                            <p>Past Activity Results:</p>
                                            {Object.keys(currentProfile.results[activityId]).map((date) => {
                                                return(
                                                    <p key={date} >{date}: {currentProfile.results[activityId][date]}%</p>
                                                );
                                            })}
                                        </React.Fragment>
                                    ) : null}
                                </div>
                            ) : null}
                        </div>
                    ) : null}
                    {/* Row 2 */}
                    <div className="card card-padding" style={{ "marginTop": "32px" }}>
                        <div style={{ "width": "100%", "paddingRight":"24px", "paddingTop": "8px", "display": "flex", "alignItems": "center" }}>
                            <h2 style={{ "minWidth": "250px"}}>DICOM View</h2>
                            <div style={{ "width": "100%", "textAlign": "right" }}>
                                {fileFound ? (
                                    <button className="dwv-button" onClick={() => setActivityCreationMode(true)}>
                                        Create Activity
                                    </button>
                                ) : null}
                            </div>
                        </div>
                        <DICOM isMobile={isMobile} dbDICOMStates={dicomStates} files={dicomFiles} fileIds={dicomFileIds} setIsInitialized={setDicomAppIsInitialized} />
                        <div style={{ "width": "100%", "display": "flex", "justifyContent": "right" }}>
                            {fileFound ? (
                                <button className="dwv-button" onClick={() => storeDICOMState()}>
                                    Save DICOM Annotations
                                </button>
                            ) : dicomFiles ? (
                                <button className="dwv-button" onClick={() => {
                                    let dicomFileId = dicomFileIds[0];
                                    if(includes(dicomFileId, "zip", true)) {
                                        dicomFileId = dicomFileId.split(".")[0];
                                    }
                                    saveDICOMFile({ [`${dicomFileId}.${dicomFiles[0].name.split('.')[1]}`]: { "name": dicomFiles[0].name, "size": dicomFiles[0].size } }, dicomFiles[0])
                                }}>
                                    Save DICOM File
                                </button>
                            ) : null}
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
