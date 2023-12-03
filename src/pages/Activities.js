import React, { useState, useEffect } from "react";
import { getPublicDICOMActivitiesinDatabase } from "../utils/utils.js";
import PropTypes from 'prop-types';
import Loading from "./Loading.js";

function Activities({ isMobile, currentProfile }) {
    const [dicomActivities, setDicomActivities] = useState(null);

    useEffect(() => {
        if(currentProfile && currentProfile.accessToken) {
            getPublicDICOMActivitiesinDatabase(currentProfile.accessToken).then((result) => {
                // console.log(result);
                setDicomActivities(result);
            });
        }
    }, [currentProfile]);

    if(currentProfile) {
        return(
            <div className="container" >
                <div className="content" style={{ "marginBottom": "32px"}}>
                    {dicomActivities ? (
                        <div className="card card-padding">
                            <h2>Public Learning Activities</h2>
                            {dicomActivities.length > 0 ? (
                            <React.Fragment>
                                {dicomActivities.map((activity) => {
                                    return(
                                        <button
                                            key={activity.name}
                                            className="hidden-btn card"
                                            style={{ "paddingTop": "16px", "paddingBottom": "16px", "paddingLeft": "32px", "paddingRight": "32px", border: "1px solid #000", "marginTop": "8px", "marginRight": "16px" }}
                                            onClick={() => {
                                                window.open(`/activity/${activity.id}/${activity.fileName}`, "_blank");
                                            }}
                                        >
                                            <b>{activity.name}</b>
                                            <p>{activity.description}</p>
                                        </button>
                                    );
                                })}
                            </React.Fragment>
                            ) : (
                                <div>
                                    <p>No public activities found, be the first to make one!</p>
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>
            </div>
        );
    } else {
        return(
            <Loading isMobile={isMobile} text={currentProfile ? "Public Activities" : ""} override={currentProfile ? "" : "Please make an account to access the activities feature."} />
        );
    }
}

Activities.propTypes = {
    isMobile: PropTypes.bool,
    currentProfile: PropTypes.object
};

export default Activities;
