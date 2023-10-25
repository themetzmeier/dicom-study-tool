import React, { useState, useEffect } from "react";
import { createDeepClone } from "../utils/utils.js";
import { AiOutlineEdit, AiFillEdit } from "react-icons/ai";
import PropTypes from 'prop-types';
import Loading from "./Loading.js";

function Profile({ isMobile, currentProfile, setCurrentProfile }) {
    const [makeEdits, setMakeEdits] = useState(false);
    const [profileChanges, setProfileChanges] = useState(null);
    const [profileChangesErrors, setProfileChangesErrors] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [updateSucess, setUpdateSuccess] = useState(null);
    const [updateError, setUpdateError] = useState(null);

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

    if(currentProfile && profileChangesErrors) {
        return(
            <div className="container" >
                <div className="content" >
                    <div className="card card-padding">
                        <div style={{ "width": "100%", "paddingRight":"24px", "paddingTop": "8px", "display": "flex", "alignItems": "center" }}>
                            <h2>Your Profile</h2>
                            <p style={{ "marginLeft": "auto" }}>
                                Manage Your Account Info:
                                <span>
                                    <button
                                        style={{ "background": "transparent", "border": "none", "cursor": "pointer", "outline": "none", "marginLeft": "16px" }}
                                        onClick={() => { setMakeEdits(!makeEdits); setProfileChanges(currentProfile); setUpdateSuccess(''); setUpdateError(''); }}
                                    >
                                        {!makeEdits ? (
                                            <AiOutlineEdit style={{"transform": "scale(3)"}} className="ai-edit-icon" />
                                        ) : (
                                            <AiFillEdit style={{"transform": "scale(3)"}} className="ai-edit-icon" />
                                        )}
                                    </button>
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
                                            className="w3-button w3-padding-large w3-white w3-border" 
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
