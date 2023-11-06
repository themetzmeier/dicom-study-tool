import React, { useState, useEffect } from "react";
import { createDeepClone } from "../utils/utils.js";
import { AiOutlineEdit, AiFillEdit } from "react-icons/ai";
import PropTypes from 'prop-types';
import Loading from "./Loading.js";
import DropZone from "../components/DropZone.js";
import DICOM from "../components/DICOM.js";
import HoverButton from "../components/HoverButton.js";

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
        console.log(profileChanges);
        
        let profileHasBeenUpdated = setCurrentProfile(profileChanges);
        if(profileHasBeenUpdated) {
            setUpdateSuccess("Profile successfully updated!");
            setMakeEdits(false);
            setUpdateSuccess('');
        } else {
            setUpdateError("Failed to update profile please refresh the page and try again.");
        }
    };

    const handleDICOMFileUpload = (inputFiles, type) => {
        let files = inputFiles;
        if(type === "delete") {
            files = null; 
        }
        setDicomFiles(files);
    };

    useEffect(() => {
        if(dicomAppIsInitialized) {
            setDropZoneVisible(true);
        }
    }, [dicomAppIsInitialized]);

    if(currentProfile && profileChangesErrors) {
        return(
            <div className="container" >
                <div className="content" style={{ "marginBottom": "32px"}}>
                    {/* Row 1 */ }
                    <div style={{ "display": "flex" }} >
                        <div className="card card-padding" style={{ "marginRight": "32px", "width": "50%" }}>
                            <h2>Upload Your Own DICOM File</h2>
                            <div style={{ "display": "flex", "alignItems": "center", "width": "100%" }}>
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
                        <DICOM isMobile={isMobile} files={dicomFiles} setIsInitialized={setDicomAppIsInitialized} />
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
