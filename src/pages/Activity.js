import React, { useEffect, useState } from "react";
import PropTypes from 'prop-types';
import Loading from "./Loading";
import { useParams } from "react-router-dom";
import { createDeepClone, getDICOMActivitiesinDatabase, getDICOMStateinDatabase, getFileFromAWSS3, getObjectValue, updateProfile } from "../utils/utils";
import DICOM from "../components/DICOM";
import { GiCheckMark } from "react-icons/gi";
import { GoX } from "react-icons/go";

function Activity({ isMobile, currentProfile, setCurrentProfile }) {
    const [dicomFiles, setDicomFiles] = useState(null);
    const [dicomAppIsInitialized, setDicomAppIsInitialized] = useState(false);
    const [dicomFileIds, setDicomFileIds] = useState(null);
    const [dicomStates, setDicomStates] = useState(null);
    const [dicomActivities, setDicomActivities] = useState(null);
    const [currentDicomActivity, setCurrentDicomActivity] = useState(null);
    const [submitted, setSubmitted] = useState(false);
    const [percentage, setPercentage] = useState(null);

    const { activityId, activityFileName } = useParams();

    useEffect(() => {
        if(currentProfile && activityId && activityFileName  && dicomAppIsInitialized && !submitted) {
            getFileFromAWSS3(activityId, activityFileName, currentProfile.accessToken).then((file) => {
                setDicomFiles([file]);
            });
        }
    }, [activityId, activityFileName, currentProfile, dicomAppIsInitialized, submitted]);

    useEffect(() => {
        if(dicomFiles && dicomFiles.length > 0 && currentProfile && !submitted) {
            setDicomFileIds([activityId]);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [dicomFiles, currentProfile, submitted]);

    useEffect(() => {
        if(dicomFileIds && currentProfile && !submitted) {
            let dicomFileId = dicomFileIds[0]
            getDICOMStateinDatabase(dicomFileId, currentProfile.accessToken).then((result) => {
                setDicomStates(result);
            });
            getDICOMActivitiesinDatabase(currentProfile.sub, currentProfile.accessToken).then((results) => {
                setDicomActivities(results);

                let filteredResults = results.filter((activity) => activity.id === dicomFileId);
                if(filteredResults.length === 1) {
                    let activityQuestions = filteredResults[0].questions.map((result) => {
                        return { ...result, "userAnswer": '' };
                    });
                    Object.assign(filteredResults[0], { questions: activityQuestions });
                    setCurrentDicomActivity(filteredResults[0]);
                }
            });
        }
    }, [dicomFileIds, currentProfile, submitted]);

    const answerHandleChange = (e, index) => {
        e.preventDefault();

        let currentDicomActivityClone = createDeepClone(currentDicomActivity);
        let questionObject = currentDicomActivityClone.questions[index];
        Object.assign(questionObject, { [e.target.name]: e.target.value });

        setCurrentDicomActivity(currentDicomActivityClone);
    };

    const calculateResults = async () => {
        let currentDicomActivityClone = createDeepClone(currentDicomActivity);
        let questions = currentDicomActivityClone.questions;

        let correctAnswers = 0;
        let newQuestions = questions.map((question) => {
            let correct = false;
            if(question.answer === question.userAnswer) {
                correct = true;
                correctAnswers += 1;
            }
            return { ...question, correct };
        });
        Object.assign(currentDicomActivityClone, { "questions": newQuestions });

        let percentage = ((correctAnswers/questions.length) * 100).toFixed(2);

        let oldResults = {};
        let results = {};
        if(getObjectValue(currentProfile, "results")) {
            results = currentProfile.results;
            if(getObjectValue(currentProfile.results, activityId)) {
                oldResults = currentProfile.results[activityId];
            }
        }

        let now = new Date();
        
        Object.assign(results, { [activityId]: { ...oldResults, [now.toLocaleString()]: percentage } });
        // console.log(results);

        let profileUpdateObject = { ...currentProfile, results };
        // console.log(profileUpdateObject);

        setCurrentProfile(profileUpdateObject);
        
        setCurrentDicomActivity(currentDicomActivityClone);
        setPercentage(percentage);
    };

    if(currentProfile && activityId && activityFileName) {
        return(
            <div className="container" >
                <div className="content" style={{ "marginBottom": "32px"}}>
                    {currentDicomActivity && getObjectValue(currentDicomActivity, "questions") && currentDicomActivity.questions.length > 0 ?(
                        <React.Fragment>
                            <div className="card card-padding" style={{ "marginTop": "32px", "display": "flex" }}>
                                <div style={{ "marginRight": "96px" }}>
                                    <h4>{currentDicomActivity.name}</h4>
                                    <p>{currentDicomActivity.description}</p>
                                </div>
                                {submitted && percentage ? (
                                    <div>
                                        <h4>Results: {percentage}%</h4>
                                        <p>Results have been saved to your profile.</p>
                                    </div>
                                ) : null}
                            </div>
                            {currentDicomActivity.questions.map((question, index) => {
                                return(
                                    <div key={JSON.stringify(question)} className="card card-padding" style={{ "marginTop": "32px" }}>
                                        <h4>{index + 1}. {question.question}</h4>
                                        {submitted ? (
                                            <div style={{ "display": "flex" }}>
                                                <div>
                                                    <p>Your answer:</p>
                                                    <p>{question.userAnswer}</p>
                                                </div>
                                                <div style={{ "marginLeft": "64px" }}>
                                                    <p>Correct answer:</p>
                                                    <p>{question.answer}</p>
                                                </div>
                                                <div style={{ "marginLeft": "64px", "display": "flex", "alignItems": "center" }}>
                                                    {question.correct ? (
                                                        <GiCheckMark style={{"transform": "scale(2)", "color": "green" }} className="ai-edit-icon" />
                                                    ) : (
                                                        <GoX style={{"transform": "scale(3)", "color": "red"}} className="ai-edit-icon" />
                                                    )}
                                                </div>
                                            </div>
                                        ) : (
                                            <textarea
                                                className="main-font"
                                                style={{ "minHeight": "38px", "minWidth": "250px", "maxHeight": "100px", "maxWidth": "40%", "marginRight": "5%" }}
                                                name="userAnswer"
                                                value={question.userAnswer}
                                                placeholder="Your Answer"
                                                type="text-area"
                                                onChange={(e) => { answerHandleChange(e, index) }} 
                                            />
                                        )}
                                        {index + 1 === currentDicomActivity.questions.length ? (
                                            <div style={{ "width": "100%", "textAlign": "right" }}>
                                                <button
                                                    className="dwv-button" 
                                                    style={{ "padding": "8px", "marginTop": "8px" }}
                                                    onClick={() => {
                                                        setSubmitted(true);
                                                        calculateResults();
                                                    }}
                                                    disabled={submitted}
                                                >
                                                    <b>Finish Activity</b>
                                                </button>
                                            </div>
                                        ) : null}
                                    </div>
                                );
                            })}
                        </React.Fragment>
                    ) : null}
                    {!submitted ? (
                        <div className="card card-padding" style={{ "marginTop": "32px" }}>
                            <DICOM isMobile={isMobile} files={dicomFiles} fileIds={dicomFileIds} setIsInitialized={setDicomAppIsInitialized} />
                        </div>
                    ) : null}
                </div>
            </div>
        );
    } else {
        return(
            <Loading text="Activity" />
        );
    }
}

Activity.propTypes = {
    isMobile: PropTypes.bool,
    currentProfile: PropTypes.object,
    setCurrentProfile: PropTypes.func,
};

export default Activity;